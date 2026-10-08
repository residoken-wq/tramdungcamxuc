import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { vi } from '../i18n/vi'
import { experienceOrderSchema, type ExperienceOrderInput } from '../forms/schemas'
import { checkAndRecordRateLimit } from '../forms/ratelimit.server'
import { verifyTurnstile } from '../forms/turnstile.server'
import { getEffectivePrice } from '../products'
import { generatePayToken, generateUniquePaymentRef } from './payment-ref'
import { assertValidBankConfig, buildVietQrPayload, generateVietQrSvg } from './vietqr'
import {
  sendExperienceOrderPaidEmail,
  sendOrderExpiredReminderEmail,
} from '../email/service.server'
import type { EmailSender } from '../email/types'

export interface ExperienceOrderContext {
  ip?: string
  page?: string
  utm?: string
}

export interface ExperienceOrderOptions {
  payload?: Payload
  now?: Date
  emailSender?: EmailSender
}

export interface ExperienceOrderResult {
  success: boolean
  payToken: string
  message: string
  fake?: boolean
}

export interface PublicOrderViewDto {
  paymentRef: string
  amount: number
  status: string
  bankInfo: {
    bankBin: string
    bankName?: string
    accountNumber: string
    accountName: string
  }
  qrPayload: string
  qrSvg: string
  sandbox: boolean
  sandboxNotice?: string
  productName?: string
  createdAt?: string | null
}

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

/**
 * Tạo đơn đặt phiên trải nghiệm Growth Mirror 149.000đ.
 * Thứ tự: honeypot -> Zod (tên, email, SĐT, nhu cầu ngắn <= 1000, ô đồng ý điều khoản)
 * -> Turnstile -> rate limit -> tạo/tìm customer -> product type coaching_trial ->
 * giá DB (getEffectivePrice) -> paymentRef -> payToken -> order pending.
 *
 * Trả về CHỈ payToken (không trả order ID, không trả thông tin khách hàng).
 */
export async function createExperienceOrder(
  input: ExperienceOrderInput | Record<string, unknown>,
  ctx: ExperienceOrderContext = {},
  options: ExperienceOrderOptions = {},
): Promise<ExperienceOrderResult> {
  // 1. Honeypot check
  if (typeof input === 'object' && input !== null && 'honeypot' in input) {
    const rawHp = String(input.honeypot || '').trim()
    if (rawHp.length > 0) {
      return {
        success: true,
        payToken: generatePayToken(),
        message: vi.payment.success.orderCreated,
        fake: true,
      }
    }
  }

  // 2. Zod validation (bắt buộc tích ô điều khoản)
  const validated = experienceOrderSchema.parse(input)

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      payToken: generatePayToken(),
      message: vi.payment.success.orderCreated,
      fake: true,
    }
  }

  // 3. Cloudflare Turnstile
  await verifyTurnstile(validated.turnstileToken, ctx.ip)

  // 4. Rate limit check
  const payload = await resolvePayload(options.payload)
  await checkAndRecordRateLimit(payload, {
    form: 'experience_order',
    ip: ctx.ip,
    email: validated.email,
  })

  // 5. Kiểm tra cấu hình ngân hàng trong siteSettings (thiếu -> lỗi tiếng Việt, không tạo đơn)
  const siteSettings = await payload.findGlobal({
    slug: 'siteSettings',
    overrideAccess: true,
  })
  assertValidBankConfig(siteSettings)

  // 6. Tìm hoặc tạo customer theo email (GAPS A10: không cần đăng nhập ở GĐ 1)
  const customerEmail = validated.email.trim().toLowerCase()
  const existingCustomers = await payload.find({
    collection: 'customers',
    where: { email: { equals: customerEmail } },
    overrideAccess: true,
    limit: 1,
  })

  let customerId: number
  if (existingCustomers.totalDocs > 0) {
    customerId = existingCustomers.docs[0].id
  } else {
    const createdCustomer = await payload.create({
      collection: 'customers',
      data: {
        email: customerEmail,
        name: validated.name.trim(),
        phone: validated.phone?.trim() || undefined,
        consentMarketing: false,
      },
      overrideAccess: true,
    })
    customerId = createdCustomer.id
  }

  // 7. Lấy sản phẩm phiên trải nghiệm đang published
  const now = options.now ?? new Date()
  const products = await payload.find({
    collection: 'products',
    where: {
      and: [{ type: { equals: 'coaching_trial' } }, { _status: { equals: 'published' } }],
    },
    overrideAccess: true,
    limit: 1,
  })

  if (products.totalDocs === 0) {
    throw new Error(vi.payment.errors.productNotFound)
  }

  const product = products.docs[0]

  // REVIEW-REQUIRED: Giá được đọc trực tiếp từ DB qua getEffectivePrice, bỏ qua mọi giá client gửi
  const effective = getEffectivePrice(product, now)
  const effectivePrice = effective.salePrice ?? effective.price
  if (effectivePrice == null || effectivePrice <= 0) {
    throw new Error(vi.payment.errors.productPriceInvalid)
  }

  // 8. Sinh paymentRef duy nhất và payToken không đoán được
  const paymentRef = await generateUniquePaymentRef(async (ref) => {
    const { totalDocs } = await payload.count({
      collection: 'orders',
      where: { paymentRef: { equals: ref } },
      overrideAccess: true,
    })
    return totalDocs > 0
  })

  const payToken = generatePayToken()

  // REVIEW-REQUIRED: Tạo order với trạng thái pending và thời điểm đồng ý điều khoản
  const termsAcceptedAt = now.toISOString()
  await payload.create({
    collection: 'orders',
    data: {
      customer: customerId,
      items: [
        {
          product: product.id,
          price: effectivePrice,
        },
      ],
      subtotal: effectivePrice,
      total: effectivePrice,
      paymentRef,
      payToken,
      paymentStatus: 'pending',
      deliveryStatus: 'none',
      termsAcceptedAt,
      customerNeed: validated.need?.trim() || undefined,
      notes: validated.need?.trim() ? `Nhu cầu: ${validated.need.trim()}` : undefined,
      createdByAdmin: false,
    },
    overrideAccess: true,
  })

  // Trả về CHỈ payToken (không lộ ID đơn, không lộ thông tin khách)
  return {
    success: true,
    payToken,
    message: vi.payment.success.orderCreated,
  }
}

/**
 * Lấy thông tin xem đơn hàng công khai qua payToken.
 * Trả về DTO an toàn: số tiền, paymentRef, thông tin ngân hàng, mã và ảnh QR, trạng thái, cờ sandbox.
 * Không lộ email/SĐT khách, không lộ đơn khác. Token sai -> trả về null.
 */
export async function getPublicOrderView(
  payToken: string,
  options: { payload?: Payload } = {},
): Promise<PublicOrderViewDto | null> {
  if (!payToken || typeof payToken !== 'string' || payToken.trim().length === 0) {
    return null
  }

  const payload = await resolvePayload(options.payload)

  const orders = await payload.find({
    collection: 'orders',
    where: { payToken: { equals: payToken.trim() } },
    overrideAccess: true,
    limit: 1,
    depth: 1,
  })

  if (orders.totalDocs === 0) {
    return null
  }

  const order = orders.docs[0]

  const siteSettings = await payload.findGlobal({
    slug: 'siteSettings',
    overrideAccess: true,
  })

  const bankInfo = {
    bankBin: siteSettings?.bankBin || '',
    bankName: siteSettings?.bankName || undefined,
    accountNumber: siteSettings?.accountNumber || '',
    accountName: siteSettings?.accountName || '',
  }

  const isSandbox = process.env.PAYMENT_SANDBOX === 'true'

  const qrPayload = buildVietQrPayload({
    bin: bankInfo.bankBin,
    accountNumber: bankInfo.accountNumber,
    amount: order.total,
    addInfo: order.paymentRef || undefined,
  })

  const qrSvg = await generateVietQrSvg(qrPayload)

  // Lấy tên sản phẩm nếu có
  let productName: string | undefined
  if (Array.isArray(order.items) && order.items.length > 0) {
    const firstItem = order.items[0]
    if (typeof firstItem.product === 'object' && firstItem.product !== null) {
      productName = firstItem.product.name
    }
  }

  // REVIEW-REQUIRED: DTO công khai không chứa email, số điện thoại hay ID nội bộ của khách hàng
  return {
    paymentRef: order.paymentRef || '',
    amount: order.total,
    status: order.paymentStatus,
    bankInfo,
    qrPayload,
    qrSvg,
    sandbox: isSandbox,
    sandboxNotice: isSandbox ? vi.payment.sandboxNotice : undefined,
    productName,
    createdAt: order.createdAt,
  }
}

export interface AdminActor {
  id: number | string
  role?: string
  email?: string
}

/**
 * Xác nhận thanh toán thủ công cho đơn hàng (CHỈ role 'owner').
 * Idempotent: chỉ chuyển pending -> paid; gọi lần 2 không đổi paidAt, không gửi lại email.
 * Ghi nhận nhật ký auditLogs. Sau khi paid: gửi email chứa experienceBookingUrl.
 */
export async function confirmManualPayment(
  orderId: number,
  user: AdminActor,
  options: { payload?: Payload; emailSender?: EmailSender; now?: Date } = {},
): Promise<unknown> {
  // REVIEW-REQUIRED: Chỉ tài khoản có vai trò 'owner' mới được quyền xác nhận thanh toán thủ công
  if (!user || user.role !== 'owner') {
    throw new Error(vi.payment.errors.unauthorized)
  }

  const payload = await resolvePayload(options.payload)

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 1,
    overrideAccess: true,
  })

  if (!order) {
    throw new Error(vi.payment.errors.orderNotFound)
  }

  const now = options.now ?? new Date()

  // REVIEW-REQUIRED: Idempotency - nếu đơn đã thanh toán, không đổi paidAt, không gửi lại email
  if (order.paymentStatus === 'paid') {
    await payload.create({
      collection: 'auditLogs',
      data: {
        actor: Number(user.id),
        action: 'confirm_manual_payment_duplicate',
        target: `orders:${orderId}`,
        before: { paymentStatus: order.paymentStatus, paidAt: order.paidAt },
        after: {
          paymentStatus: order.paymentStatus,
          paidAt: order.paidAt,
          note: 'đã xác nhận trước đó',
        },
        at: now.toISOString(),
      },
      overrideAccess: true,
    })
    return order
  }

  if (order.paymentStatus !== 'pending') {
    throw new Error(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

  // REVIEW-REQUIRED: Chuyển trạng thái pending -> paid và lưu thời điểm paidAt
  const paidAt = now.toISOString()
  const updatedOrder = await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      paymentStatus: 'paid',
      paidAt,
    },
    overrideAccess: true,
  })

  // Ghi nhật ký thao tác
  await payload.create({
    collection: 'auditLogs',
    data: {
      actor: Number(user.id),
      action: 'confirm_manual_payment',
      target: `orders:${orderId}`,
      before: { paymentStatus: 'pending', paidAt: null },
      after: { paymentStatus: 'paid', paidAt },
      at: paidAt,
    },
    overrideAccess: true,
  })

  // Gửi email xác nhận kèm link đặt lịch
  const siteSettings = await payload.findGlobal({
    slug: 'siteSettings',
    overrideAccess: true,
  })

  const customerDoc =
    typeof order.customer === 'object' && order.customer !== null
      ? order.customer
      : await payload.findByID({
          collection: 'customers',
          id: Number(order.customer),
          overrideAccess: true,
        })

  if (customerDoc?.email) {
    try {
      await sendExperienceOrderPaidEmail(
        payload,
        {
          name: customerDoc.name || 'bạn',
          email: customerDoc.email,
          paymentRef: order.paymentRef || '',
          amount: order.total,
          bookingUrl: siteSettings?.experienceBookingUrl,
        },
        options.emailSender,
      )

      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { deliveryStatus: 'email_sent' },
        overrideAccess: true,
      })
    } catch (emailErr) {
      console.error('[Payment] Confirmation email delivery failed for order', orderId, emailErr)
      // Đơn hàng vẫn giữ nguyên trạng thái paid (không revert)
    }
  }

  return updatedOrder
}

/**
 * Hủy đơn hàng (CHỈ role 'owner').
 * Không hỗ trợ hủy đơn đã paid (không có chính sách hoàn tiền).
 * Ghi nhận nhật ký auditLogs.
 */
export async function cancelOrder(
  orderId: number,
  user: AdminActor,
  reason?: string,
  options: { payload?: Payload; now?: Date } = {},
): Promise<unknown> {
  // REVIEW-REQUIRED: Chỉ tài khoản 'owner' mới được hủy đơn hàng
  if (!user || user.role !== 'owner') {
    throw new Error(vi.payment.errors.unauthorized)
  }

  const payload = await resolvePayload(options.payload)

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })

  if (!order) {
    throw new Error(vi.payment.errors.orderNotFound)
  }

  // REVIEW-REQUIRED: Không cho phép hủy đơn đã thanh toán (tuân thủ chính sách không hoàn tiền AGENTS.md mục 14)
  if (order.paymentStatus === 'paid') {
    throw new Error(vi.payment.errors.cannotCancelPaidOrder)
  }

  if (order.paymentStatus === 'cancelled') {
    return order
  }

  const now = options.now ?? new Date()
  const updatedOrder = await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      paymentStatus: 'cancelled',
      notes: reason ? `${order.notes || ''}\nLý do hủy: ${reason}`.trim() : order.notes,
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'auditLogs',
    data: {
      actor: Number(user.id),
      action: 'cancel_order',
      target: `orders:${orderId}`,
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: 'cancelled', reason: reason || null },
      at: now.toISOString(),
    },
    overrideAccess: true,
  })

  return updatedOrder
}

export interface ExpireOrdersResult {
  expiredCount: number
  reminderSentCount: number
}

/**
 * Đóng các đơn hàng pending quá 24 giờ -> chuyển sang failed.
 * Nếu khách hàng có consentMarketing = true -> gửi email nhắc hẹn.
 */
export async function expirePendingOrders(
  now: Date = new Date(),
  options: { payload?: Payload; emailSender?: EmailSender } = {},
): Promise<ExpireOrdersResult> {
  const payload = await resolvePayload(options.payload)

  // 24 giờ trước thời điểm now
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // REVIEW-REQUIRED: Chỉ tìm và đóng các đơn pending tạo trước mốc 24 giờ
  const pendingOrders = await payload.find({
    collection: 'orders',
    where: {
      and: [{ paymentStatus: { equals: 'pending' } }, { createdAt: { less_than: cutoff } }],
    },
    overrideAccess: true,
    depth: 1,
    limit: 200,
  })

  let expiredCount = 0
  let reminderSentCount = 0

  for (const order of pendingOrders.docs) {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        paymentStatus: 'failed',
      },
      overrideAccess: true,
    })
    expiredCount++

    // Kiểm tra nếu khách đồng ý nhận tin quảng bá -> gửi email nhắc hẹn
    const customerDoc =
      typeof order.customer === 'object' && order.customer !== null
        ? order.customer
        : await payload.findByID({
            collection: 'customers',
            id: Number(order.customer),
            overrideAccess: true,
          })

    if (customerDoc?.consentMarketing && customerDoc?.email) {
      try {
        await sendOrderExpiredReminderEmail(
          payload,
          {
            name: customerDoc.name || 'bạn',
            email: customerDoc.email,
          },
          options.emailSender,
        )
        reminderSentCount++
      } catch (err) {
        console.error('[Payment] Failed to send expiration reminder to', customerDoc.email, err)
      }
    }
  }

  return {
    expiredCount,
    reminderSentCount,
  }
}
