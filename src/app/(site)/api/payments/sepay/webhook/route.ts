import 'server-only'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { ValidationError } from 'payload'
import config from '@/payload.config'
import { SepayPaymentProvider } from '@/lib/payments/sepay'
import { markOrderPaid } from '@/lib/payments/orders.server'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'

export const dynamic = 'force-dynamic'

/**
 * REVIEW-REQUIRED: Webhook nhận thông báo biến động số dư từ SePay.
 * - Chặn khi PAYMENT_PROVIDER !== 'sepay' -> 404.
 * - Kiểm tra chữ ký / API key bằng constant-time timingSafeEqual -> 401 khi không hợp lệ, ghi log paymentEvents signatureValid: false.
 * - Rate limit theo IP để chống spam/DDoS.
 * - Idempotency: bắt ValidationError từ Payload khi transactionId đã tồn tại -> trả 200 { success: true, result: 'duplicate' }, không cấp quyền lần 2.
 * - Chỉ xử lý tiền vào (transferType = 'in').
 * - Xử lý lệch tiền (amount_mismatch), đơn hủy (order_cancelled), đơn đã thanh toán (already_paid), đơn chờ đồng ý điều khoản (terms_missing).
 * - Luôn phản hồi HTTP 200 { success: true } khi webhook đã được ghi nhận để SePay không retry vô hạn.
 */
export async function POST(req: Request): Promise<Response> {
  // REVIEW-REQUIRED: Chế độ PAYMENT_PROVIDER !== 'sepay' -> 404
  if (process.env.PAYMENT_PROVIDER !== 'sepay') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const payload = await getPayload({ config })

  // Rate limit theo IP
  const forwarded = req.headers.get('x-forwarded-for')
  const ip =
    (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')?.trim()) ||
    undefined

  if (ip) {
    try {
      await checkAndRecordRateLimit(payload, {
        form: 'sepay_webhook',
        ip,
        windowMinutes: 1,
        maxHits: 120,
      })
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }
  }

  // Đọc body JSON an toàn
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const payloadData: Record<string, unknown> =
    typeof rawBody === 'object' && rawBody !== null
      ? (rawBody as Record<string, unknown>)
      : { value: rawBody }

  const provider = new SepayPaymentProvider()
  const isSignatureValid = await provider.verifyWebhook(req)

  // REVIEW-REQUIRED: Xác thực API key thất bại -> 401 và ghi log paymentEvents (không lưu header khóa)
  if (!isSignatureValid) {
    let transactionId: string | undefined
    if (rawBody && typeof rawBody === 'object' && 'id' in rawBody) {
      transactionId = String((rawBody as { id: unknown }).id)
    }

    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: payloadData,
          signatureValid: false,
          result: 'invalid_signature',
          transactionId: transactionId || undefined,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (!(err instanceof ValidationError)) {
        console.error('[Sepay Webhook] Failed to record invalid signature event:', err)
      }
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse webhook payload
  let parsed
  try {
    parsed = await provider.parseWebhook(payloadData)
  } catch (parseErr) {
    console.error('[Sepay Webhook] Failed to parse payload with Zod:', parseErr)
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: payloadData,
          signatureValid: true,
          result: 'invalid_payload',
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
    }
    return NextResponse.json({ success: true, message: 'Invalid payload acknowledged' })
  }

  const transactionId = parsed.transactionId

  // 1. Tiền ra (transferType !== 'in') -> ignored, không đổi đơn
  if (!parsed.isMoneyIn) {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: payloadData,
          signatureValid: true,
          result: 'ignored',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record ignored event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'ignored' })
  }

  // 2. Không tìm thấy mã thanh toán hợp lệ -> no_match, không đổi đơn
  if (!parsed.paymentRef) {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: payloadData,
          signatureValid: true,
          result: 'no_match',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record no_match event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'no_match' })
  }

  // 3. Tìm đơn hàng theo paymentRef
  let order
  try {
    const orderSearch = await payload.find({
      collection: 'orders',
      where: { paymentRef: { equals: parsed.paymentRef } },
      overrideAccess: true,
      limit: 1,
      depth: 0,
    })
    if (orderSearch.totalDocs > 0) {
      order = orderSearch.docs[0]
    }
  } catch (dbErr) {
    console.error('[Sepay Webhook] Error finding order by paymentRef:', dbErr)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  // Không tìm thấy đơn hàng khớp mã -> no_match, không đổi đơn
  if (!order) {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: payloadData,
          signatureValid: true,
          result: 'no_match',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record no_match event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'no_match' })
  }

  // REVIEW-REQUIRED: Xử lý theo đúng thứ tự logic bảng nghiệp vụ:
  // - Số tiền khác order.total -> amount_mismatch, không đổi đơn (Hana xử lý tay)
  // - Đơn cancelled -> order_cancelled, không đổi đơn (Hana xử lý tay)
  // - Đơn đã paid -> already_paid, không đổi đơn
  // - Đơn createdByAdmin chưa đồng ý điều khoản -> terms_missing, không đổi đơn
  // - Đơn pending/failed + đúng số tiền -> paid -> gọi markOrderPaid
  let result: string
  let shouldMarkPaid = false

  if (parsed.amount !== order.total) {
    result = 'amount_mismatch'
  } else if (order.paymentStatus === 'cancelled') {
    result = 'order_cancelled'
  } else if (order.paymentStatus === 'paid') {
    result = 'already_paid'
  } else if (order.createdByAdmin && !order.termsAcceptedAt) {
    result = 'terms_missing'
  } else if (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') {
    result = 'paid'
    shouldMarkPaid = true
  } else {
    result = 'ignored'
  }

  // REVIEW-REQUIRED: Chống trùng lặp - transactionId unique.
  // Bắt ValidationError của Payload khi transactionId đã tồn tại -> trả duplicate mà không cấp quyền lần 2.
  try {
    await payload.create({
      collection: 'paymentEvents',
      data: {
        provider: 'sepay',
        order: order.id,
        rawPayload: payloadData,
        signatureValid: true,
        result,
        transactionId,
        receivedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: true, result: 'duplicate' })
    }
    console.error('[Sepay Webhook] Failed to record payment event:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  // Gọi markOrderPaid cho đơn hợp lệ
  if (shouldMarkPaid) {
    try {
      await markOrderPaid(order.id, {
        source: 'webhook',
        payload,
      })
    } catch (payErr) {
      console.error('[Sepay Webhook] Failed to mark order paid:', payErr)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, result })
}
