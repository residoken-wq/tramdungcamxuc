import 'server-only'
import { NextResponse } from 'next/server'
import { getPayload, ValidationError } from 'payload'
import config from '@/payload.config'
import { SepayPaymentProvider } from '@/lib/payments/sepay'
import { isSepayMode } from '@/lib/payments/provider'
import { markOrderPaid, InvalidOrderStatusError } from '@/lib/payments/orders.server'
import { grantEntitlementsForOrder } from '@/lib/payments/entitlements.server'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { getClientIp } from '@/lib/payments/ip'
import type { EmailSender } from '@/lib/email/types'
import type { PaymentEvent } from '@/payload-types'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 16 * 1024 // 16 KB
// Event 'processing' cũ hơn mức này mới được xử lý lại (tránh chen vào luồng đang chạy)
const RESUME_AFTER_MS = 60 * 1000

interface WebhookContext {
  emailSender?: EmailSender
  params?: Promise<Record<string, string | string[]>>
}

/**
 * REVIEW-REQUIRED: Webhook nhận thông báo biến động số dư từ SePay.
 * - Chặn khi PAYMENT_PROVIDER !== 'sepay' -> 404.
 * - Giới hạn kích thước body <= 16 KB -> 413 (không ghi DB vì chưa xác thực).
 * - Xác thực chữ ký / API key (timingSafeEqual) TRƯỚC rate limit.
 * - Chỉ request SAI KHÓA mới qua rate limit (theo IP từ phần tử cuối X-Forwarded-For).
 * - Nhánh 401: KHÔNG đặt transactionId (để rỗng, chống kẻ xấu giữ chỗ transactionId).
 * - Request đúng khóa: không bị rate limit.
 * - JSON lỗi -> ghi event invalid_payload rồi 400.
 * - Trạng thái đơn và event khớp nhau:
 *   + Ghi event với result: 'processing' trước khi markOrderPaid.
 *   + Thành công -> cập nhật result: 'paid' (hoặc 'already_paid' nếu đơn đã được xác nhận ở luồng song song).
 *   + InvalidOrderStatusError -> đọc lại đơn, cập nhật result: order_cancelled / already_paid / ignored, trả 200.
 *   + Lỗi khác -> GIỮ event 'processing', log, trả 500. SePay gửi lại → gặp event 'processing'
 *     cùng transactionId → xử lý lại (markOrderPaid không cấp quyền 2 lần) và gắn nhãn đúng.
 */
export async function POST(req: Request, context?: WebhookContext): Promise<Response> {
  // REVIEW-REQUIRED: Chế độ PAYMENT_PROVIDER !== 'sepay' -> 404
  if (!isSepayMode()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const payload = await getPayload({ config: await config })

  // 1. Giới hạn kích thước body (16 KB). Chưa xác thực nên KHÔNG ghi DB ở nhánh này
  // (tránh người lạ gửi body lớn làm phình bảng paymentEvents).
  const declaredLength = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 })
  }

  let rawText: string
  try {
    rawText = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const bodyLength = Buffer.byteLength(rawText, 'utf8')
  if (bodyLength > MAX_BODY_BYTES) {
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

  // 6b. REVIEW-REQUIRED: Giao dịch đã ghi trước đó. Còn 'processing' (lần trước lỗi giữa chừng)
  // → xử lý lại ở bước 8, bỏ qua các nhánh trạng thái đơn bên dưới; kết quả khác → trùng.
  let resumeEvent: PaymentEvent | undefined
  try {
    const previous = await payload.find({
      collection: 'paymentEvents',
      where: { transactionId: { equals: transactionId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const previousEvent = previous.docs[0]
    if (previousEvent) {
      // Event 'processing' còn mới → một luồng khác đang xử lý chính giao dịch này → trùng.
      // Chỉ xử lý lại event đã kẹt (lần trước lỗi / tiến trình chết).
      const ageMs = Date.now() - new Date(previousEvent.createdAt).getTime()
      if (previousEvent.result !== 'processing' || ageMs < RESUME_AFTER_MS) {
        return NextResponse.json({ success: true, result: 'duplicate' })
      }
      resumeEvent = previousEvent
    }
  } catch (dbErr) {
    console.error('[Sepay Webhook] Error looking up previous event:', dbErr)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  // 6c. Xử lý lại mà tổng đơn đã bị sửa khác số tiền nhận → amount_mismatch, không đổi đơn
  if (resumeEvent && parsed.amount !== order.total) {
    await payload.update({
      collection: 'paymentEvents',
      id: resumeEvent.id,
      data: { result: 'amount_mismatch' },
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, result: 'amount_mismatch' })
  }

  // 7. REVIEW-REQUIRED: Xử lý theo đúng thứ tự logic nghiệp vụ:
  // - Số tiền khác order.total -> amount_mismatch, không đổi đơn
  // - Đơn cancelled -> order_cancelled, không đổi đơn
  // - Đơn đã paid -> already_paid, không đổi đơn
  // - Đơn createdByAdmin chưa đồng ý điều khoản -> terms_missing, không đổi đơn
  // - Đơn pending/failed + đúng số tiền -> chuyển tiếp sang bước markOrderPaid
  if (!resumeEvent && parsed.amount !== order.total) {
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

  if (!resumeEvent && order.paymentStatus === 'cancelled') {
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

  if (!resumeEvent && order.paymentStatus === 'paid') {
    // Đơn chưa có giao dịch SePay nào làm nó paid → Hana đã xác nhận tay trước khi webhook tới:
    // nhãn riêng, không báo "khách chuyển 2 lần".
    const sepayPaid = await payload.count({
      collection: 'paymentEvents',
      where: {
        and: [
          { order: { equals: order.id } },
          { result: { in: ['paid', 'paid_incomplete', 'processing'] } },
        ],
      },
      overrideAccess: true,
    })
    const paidLabel = sepayPaid.totalDocs > 0 ? 'already_paid' : 'confirmed_manually_before'
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: payloadData,
          signatureValid: true,
          result: paidLabel,
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
    return NextResponse.json({ success: true, result: paidLabel })
  }

  if (!resumeEvent && order.createdByAdmin && !order.termsAcceptedAt) {
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
  //   + Lỗi khác: GIỮ event 'processing', log, trả 500 (SePay gửi lại → xử lý lại, xem 6b).
  let eventDoc: PaymentEvent
  const resumed = Boolean(resumeEvent)
  if (resumeEvent) {
    eventDoc = resumeEvent
  } else {
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
      if (!(err instanceof ValidationError)) {
        console.error('[Sepay Webhook] Failed to record processing payment event:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      }
      // Một luồng khác vừa ghi cùng giao dịch → trùng (luồng đó tự xử lý tiếp)
      return NextResponse.json({ success: true, result: 'duplicate' })
    }
  }

  // Nhãn khi markOrderPaid báo đơn đã paid: nếu đơn chưa có giao dịch KHÁC đang/đã xử lý
  // ('processing' / 'paid') thì chính giao dịch này đã làm đơn paid (lần trước lỗi sau khi đơn
  // đã chuyển paid) → 'paid'; ngược lại là khách trả lần 2 → 'already_paid'.
  const resolveAlreadyPaidLabel = async (): Promise<'paid' | 'already_paid'> => {
    const otherPaid = await payload.count({
      collection: 'paymentEvents',
      where: {
        and: [
          { order: { equals: order.id } },
          { result: { in: ['paid', 'paid_incomplete', 'processing'] } },
          { id: { not_equals: eventDoc.id } },
        ],
      },
      overrideAccess: true,
    })
    return otherPaid.totalDocs > 0 ? 'already_paid' : 'paid'
  }

  try {
    const paidResult = await markOrderPaid(order.id, {
      source: 'webhook',
      payload,
      emailSender: context?.emailSender,
    })

    const isEmailFailed = Boolean((paidResult as { __emailFailed?: boolean })?.__emailFailed)
    let finalResult: string = (paidResult as { __alreadyPaid?: boolean })?.__alreadyPaid
      ? await resolveAlreadyPaidLabel()
      : isEmailFailed
        ? 'paid_incomplete'
        : 'paid'

    // REVIEW-REQUIRED: Xử lý lại một giao dịch mà chính nó đã làm đơn paid ở lần trước (lần trước
    // lỗi / tiến trình chết sau khi đơn chuyển paid). markOrderPaid không cấp quyền / gửi email lại,
    // nên: cấp quyền bù nếu chưa cấp (grantEntitlementsForOrder không cấp trùng nhờ grantKey) và gắn
    // nhãn 'paid_incomplete' để Hana kiểm tra email xác nhận.
    if (
      resumed &&
      (paidResult as { __alreadyPaid?: boolean })?.__alreadyPaid &&
      finalResult === 'paid'
    ) {
      finalResult = 'paid_incomplete'
      const fresh = await payload.findByID({
        collection: 'orders',
        id: order.id,
        depth: 0,
        overrideAccess: true,
      })
      if (fresh.deliveryStatus === 'none') {
        const granted = await grantEntitlementsForOrder(order.id, { payload })
        if (granted.grantedCount > 0) {
          await payload.update({
            collection: 'orders',
            id: order.id,
            data: { deliveryStatus: 'access_granted' },
            context: { paymentAction: true },
            overrideAccess: true,
          })
        }
      }
    }

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
          updatedResult = await resolveAlreadyPaidLabel()
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

    // Lỗi khác (DB đứt mạng, cấp quyền lỗi...): Không update eventDoc, giữ nguyên 'processing' để lần sau
    // SePay gửi lại ở nhánh trùng ở trên xử lý lại. Admin thấy cảnh báo 'processing' nếu vẫn kẹt.
    console.error('[Sepay Webhook] Failed to mark order paid:', payErr)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
