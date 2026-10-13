import 'server-only'
import { NextResponse } from 'next/server'
import { getPayload, ValidationError } from 'payload'
import config from '@/payload.config'
import { SepayPaymentProvider } from '@/lib/payments/sepay'
import { markOrderPaid, InvalidOrderStatusError } from '@/lib/payments/orders.server'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { getClientIp } from '@/lib/payments/ip'
import type { EmailSender } from '@/lib/email/types'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 16 * 1024 // 16 KB

interface WebhookContext {
  emailSender?: EmailSender
  params?: Promise<Record<string, string | string[]>>
}

/**
 * REVIEW-REQUIRED: Webhook nhận thông báo biến động số dư từ SePay.
 * - Chặn khi PAYMENT_PROVIDER !== 'sepay' -> 404.
 * - Giới hạn kích thước body <= 16 KB -> 413, ghi event không kèm body.
 * - Xác thực chữ ký / API key (timingSafeEqual) TRƯỚC rate limit.
 * - Chỉ request SAI KHÓA mới qua rate limit (theo IP từ phần tử cuối X-Forwarded-For).
 * - Nhánh 401: KHÔNG đặt transactionId (để rỗng, chống kẻ xấu giữ chỗ transactionId).
 * - Request đúng khóa: không bị rate limit.
 * - JSON lỗi -> ghi event invalid_payload rồi 400.
 * - Trạng thái đơn và event khớp nhau:
 *   + Ghi event với result: 'processing' trước khi markOrderPaid.
 *   + Thành công -> cập nhật result: 'paid' (hoặc 'already_paid' nếu đơn đã được xác nhận ở luồng song song).
 *   + InvalidOrderStatusError -> đọc lại đơn, cập nhật result: order_cancelled / already_paid / ignored, trả 200.
 *   + Lỗi khác -> XÓA event vừa ghi (để SePay retry được), log, trả 500.
 */
export async function POST(req: Request, context?: WebhookContext): Promise<Response> {
  // REVIEW-REQUIRED: Chế độ PAYMENT_PROVIDER !== 'sepay' -> 404
  if (process.env.PAYMENT_PROVIDER !== 'sepay') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const payload = await getPayload({ config: await config })

  // 1. Đọc body text và kiểm tra giới hạn kích thước (tối đa 16 KB)
  let rawText: string
  try {
    rawText = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const bodyLength = Buffer.byteLength(rawText, 'utf8')
  if (bodyLength > MAX_BODY_BYTES) {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: { error: 'payload_too_large', size: bodyLength },
          signatureValid: false,
          result: 'payload_too_large',
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      console.error('[Sepay Webhook] Failed to record payload_too_large event:', err)
    }
    return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 })
  }

  const provider = new SepayPaymentProvider()
  const isSignatureValid = await provider.verifyWebhook(req)

  // 2. REVIEW-REQUIRED: Xác thực API key thất bại -> rate limit theo IP, ghi event KHÔNG ĐẶT transactionId, trả 401
  if (!isSignatureValid) {
    const ip = getClientIp(req)
    try {
      await checkAndRecordRateLimit(payload, {
        form: 'sepay_webhook_invalid',
        ip,
        windowMinutes: 1,
        maxHits: 60,
      })
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    let parsedBody: Record<string, unknown> = {}
    try {
      const json = JSON.parse(rawText)
      if (typeof json === 'object' && json !== null) {
        parsedBody = json as Record<string, unknown>
      }
    } catch {
      parsedBody = { rawText }
    }

    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: parsedBody,
          signatureValid: false,
          result: 'invalid_signature',
          // A1: KHÔNG đặt transactionId để tránh kẻ xấu giữ chỗ ID
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      console.error('[Sepay Webhook] Failed to record invalid signature event:', err)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Request đúng khóa: KHÔNG rate limit. Parse JSON.
  let payloadData: Record<string, unknown>
  try {
    const json = JSON.parse(rawText)
    if (typeof json === 'object' && json !== null) {
      payloadData = json as Record<string, unknown>
    } else {
      payloadData = { value: json }
    }
  } catch {
    // C5: JSON lỗi -> ghi event invalid_payload rồi 400
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          rawPayload: { rawText },
          signatureValid: true,
          result: 'invalid_payload',
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      console.error('[Sepay Webhook] Failed to record invalid payload event:', err)
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Parse webhook schema với Zod
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

  // 4. Tiền ra (transferType !== 'in') -> ignored, không đổi đơn
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

  // 5. Không tìm thấy mã thanh toán hợp lệ -> no_match, không đổi đơn
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

  // 6. Tìm đơn hàng theo paymentRef
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

  // 7. REVIEW-REQUIRED: Xử lý theo đúng thứ tự logic nghiệp vụ:
  // - Số tiền khác order.total -> amount_mismatch, không đổi đơn
  // - Đơn cancelled -> order_cancelled, không đổi đơn
  // - Đơn đã paid -> already_paid, không đổi đơn
  // - Đơn createdByAdmin chưa đồng ý điều khoản -> terms_missing, không đổi đơn
  // - Đơn pending/failed + đúng số tiền -> chuyển tiếp sang bước markOrderPaid
  if (parsed.amount !== order.total) {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: payloadData,
          signatureValid: true,
          result: 'amount_mismatch',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record amount_mismatch event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'amount_mismatch' })
  }

  if (order.paymentStatus === 'cancelled') {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: payloadData,
          signatureValid: true,
          result: 'order_cancelled',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record order_cancelled event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'order_cancelled' })
  }

  if (order.paymentStatus === 'paid') {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: payloadData,
          signatureValid: true,
          result: 'already_paid',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record already_paid event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'already_paid' })
  }

  if (order.createdByAdmin && !order.termsAcceptedAt) {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: payloadData,
          signatureValid: true,
          result: 'terms_missing',
          transactionId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      console.error('[Sepay Webhook] Failed to record terms_missing event:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ success: true, result: 'terms_missing' })
  }

  // 8. REVIEW-REQUIRED (B2): Đơn pending / failed + đúng số tiền
  // - Ghi event với result: 'processing' và transactionId unique.
  // - Gọi markOrderPaid:
  //   + Thành công: cập nhật result: 'paid' (hoặc 'already_paid' nếu đã paid bởi luồng song song).
  //   + InvalidOrderStatusError: đọc lại đơn, cập nhật result: order_cancelled / already_paid / ignored, trả 200.
  //   + Lỗi khác: XÓA event vừa ghi (để SePay retry được không bị kẹt transactionId), log, trả 500.
  let eventDoc
  try {
    eventDoc = await payload.create({
      collection: 'paymentEvents',
      data: {
        provider: 'sepay',
        order: order.id,
        rawPayload: payloadData,
        signatureValid: true,
        result: 'processing',
        transactionId,
        receivedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: true, result: 'duplicate' })
    }
    console.error('[Sepay Webhook] Failed to record processing payment event:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  try {
    const paidResult = await markOrderPaid(order.id, {
      source: 'webhook',
      payload,
      emailSender: context?.emailSender,
    })

    const finalResult = (paidResult as { __alreadyPaid?: boolean })?.__alreadyPaid
      ? 'already_paid'
      : 'paid'

    await payload.update({
      collection: 'paymentEvents',
      id: eventDoc.id,
      data: {
        result: finalResult,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true, result: finalResult })
  } catch (payErr) {
    if (payErr instanceof InvalidOrderStatusError) {
      // Race condition với hủy đơn hoặc thanh toán đồng thời: đọc lại đơn hàng
      let updatedResult = 'ignored'
      try {
        const freshOrder = await payload.findByID({
          collection: 'orders',
          id: order.id,
          overrideAccess: true,
          depth: 0,
        })
        if (freshOrder?.paymentStatus === 'cancelled') {
          updatedResult = 'order_cancelled'
        } else if (freshOrder?.paymentStatus === 'paid') {
          updatedResult = 'already_paid'
        }
      } catch (readErr) {
        console.error(
          '[Sepay Webhook] Failed to re-read order after InvalidOrderStatusError:',
          readErr,
        )
      }

      try {
        await payload.update({
          collection: 'paymentEvents',
          id: eventDoc.id,
          data: {
            result: updatedResult,
          },
          overrideAccess: true,
        })
      } catch (updateErr) {
        console.error(
          '[Sepay Webhook] Failed to update event after InvalidOrderStatusError:',
          updateErr,
        )
      }

      return NextResponse.json({ success: true, result: updatedResult })
    }

    // Lỗi khác (DB đứt mạng, lỗi server tạm thời, v.v.):
    // Xóa event vừa ghi để SePay gửi lại sau không bị coi là duplicate
    try {
      await payload.delete({
        collection: 'paymentEvents',
        id: eventDoc.id,
        overrideAccess: true,
      })
    } catch (delErr) {
      console.error('[Sepay Webhook] Failed to delete event after processing error:', delErr)
    }

    console.error('[Sepay Webhook] Failed to mark order paid:', payErr)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
