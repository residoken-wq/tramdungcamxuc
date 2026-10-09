import 'server-only'
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import type { Product } from '@/payload-types'
import config from '@/payload.config'
import { vi } from '../i18n/vi'
import { experienceOrderSchema, type ExperienceOrderInput } from '../forms/schemas'
import { checkAndRecordRateLimit } from '../forms/ratelimit.server'
import { verifyTurnstile } from '../forms/turnstile.server'
import { getEffectivePrice } from '../products'
import { computePackageValue } from '../pricing'
import { generatePayToken, generateUniquePaymentRef } from './payment-ref'
import { assertValidBankConfig, buildVietQrPayload, generateVietQrSvg } from './vietqr'
import {
  sendExperienceOrderPaidEmail,
  sendOrderExpiredReminderEmail,
  sendPackageOrderPaidEmail,
} from '../email/service.server'
import type { EmailSender } from '../email/types'
import { grantEntitlementsForOrder } from './entitlements.server'
import { getSiteUrl } from '../site-url'

export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentError'
  }
}

export class OrderNotFoundError extends PaymentError {
  constructor(message: string = vi.payment.errors.orderNotFound) {
    super(message)
    this.name = 'OrderNotFoundError'
  }
}

export class UnauthorizedPaymentError extends PaymentError {
  constructor(message: string = vi.payment.errors.unauthorized) {
    super(message)
    this.name = 'UnauthorizedPaymentError'
  }
}

export class CannotCancelPaidOrderError extends PaymentError {
  constructor(message: string = vi.payment.errors.cannotCancelPaidOrder) {
    super(message)
    this.name = 'CannotCancelPaidOrderError'
  }
}

export class InvalidOrderStatusError extends PaymentError {
  constructor(message: string = vi.payment.errors.onlyPendingCanBeConfirmed) {
    super(message)
    this.name = 'InvalidOrderStatusError'
  }
}

export class ProductNotForSaleError extends PaymentError {
  constructor(message: string = vi.payment.errors.productNotForSale) {
    super(message)
    this.name = 'ProductNotForSaleError'
  }
}

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
  createdByAdmin?: boolean
  termsAcceptedAt?: string | null
  payToken?: string
  packageSummary?: {
    name: string
    components: Array<{ label: string; quantity: number | null; unitValue: number | null }>
    totalValue: number
    sellingPrice: number
    discountPercent: number | null
    notes?: string | null
  } | null
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

  // 7. Lấy sản phẩm phiên trải nghiệm theo productId đang published
  // REVIEW-REQUIRED: Tìm sản phẩm theo đúng productId, kiểm tra type = coaching_trial và _status = published
  const now = options.now ?? new Date()
  const products = await payload.find({
    collection: 'products',
    where: {
      id: { equals: validated.productId },
    },
    overrideAccess: true,
    limit: 1,
  })

  if (products.totalDocs === 0) {
    throw new OrderNotFoundError(vi.payment.errors.productNotFound)
  }

  const product = products.docs[0]
  if (product.type !== 'coaching_trial' || product._status !== 'published') {
    throw new OrderNotFoundError(vi.payment.errors.productNotFound)
  }

  // REVIEW-REQUIRED: Chỉ bán sản phẩm đang mở bán (saleStatus === 'on_sale')
  if (product.saleStatus !== 'on_sale') {
    throw new ProductNotForSaleError(vi.payment.errors.productNotForSale)
  }

  // REVIEW-REQUIRED: Giá được đọc trực tiếp từ DB qua getEffectivePrice, bỏ qua mọi giá client gửi
  const effective = getEffectivePrice(product, now)
  const effectivePrice = effective.salePrice ?? effective.price
  if (effectivePrice == null || effectivePrice <= 0) {
    throw new PaymentError(vi.payment.errors.productPriceInvalid)
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
    context: { paymentAction: true },
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

  // Lấy tên sản phẩm và tóm tắt gói nếu có
  let productName: string | undefined
  let packageSummary = null

  if (Array.isArray(order.items) && order.items.length > 0) {
    const firstItem = order.items[0]
    if (typeof firstItem.product === 'object' && firstItem.product !== null) {
      const p = firstItem.product as {
        name?: string
        type?: string
        price?: number | null
        salePrice?: number | null
        saleEndsAt?: string | null
        components?: Array<{
          label?: string | null
          quantity?: number | null
          unitValue?: number | null
        }>
      }
      productName = p.name

      if (p.type === 'package') {
        const comps = Array.isArray(p.components)
          ? p.components.map((c) => ({
              label: c.label || '',
              quantity: typeof c.quantity === 'number' ? c.quantity : 1,
              unitValue: typeof c.unitValue === 'number' ? c.unitValue : 0,
            }))
          : []

        const effective = getEffectivePrice(p, new Date())
        const sellingPrice = order.total
        const { totalValue } = computePackageValue({
          components: comps,
          price: effective.price,
          salePrice: effective.salePrice,
        })

        const discountPercent =
          totalValue > 0 && sellingPrice < totalValue
            ? Math.round(((totalValue - sellingPrice) / totalValue) * 100)
            : null

        packageSummary = {
          name: p.name || '',
          components: comps,
          totalValue,
          sellingPrice,
          discountPercent,
          notes: order.notes || null,
        }
      }
    }
  }

  const createdByAdmin = Boolean(order.createdByAdmin)
  const termsAcceptedAt = order.termsAcceptedAt ? String(order.termsAcceptedAt) : null

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
    createdByAdmin,
    termsAcceptedAt,
    payToken: order.payToken || payToken,
    packageSummary,
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
interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

function getDrizzleDb(payload: Payload): DrizzleDbExecutor {
  return (payload.db as unknown as { drizzle: DrizzleDbExecutor }).drizzle
}

export async function confirmManualPayment(
  orderId: number,
  user: AdminActor,
  options: { payload?: Payload; emailSender?: EmailSender; now?: Date } = {},
): Promise<unknown> {
  // REVIEW-REQUIRED: Chỉ tài khoản có vai trò 'owner' mới được quyền xác nhận thanh toán thủ công
  if (!user || user.role !== 'owner') {
    throw new UnauthorizedPaymentError(vi.payment.errors.unauthorized)
  }

  const payload = await resolvePayload(options.payload)

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 1,
    overrideAccess: true,
  })

  if (!order) {
    throw new OrderNotFoundError(vi.payment.errors.orderNotFound)
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
    throw new InvalidOrderStatusError(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

  // REVIEW-REQUIRED: Chuyển trạng thái sang 'paid' nguyên tử bằng một câu UPDATE có điều kiện tại DB
  // UPDATE orders SET payment_status = 'paid', paid_at = ${paidAt}, updated_at = ${paidAt} WHERE id = ${orderId} AND payment_status = 'pending' RETURNING id
  // Bảng orders không cấu hình versions (không có _orders_v) nên câu UPDATE trực tiếp an toàn tuyệt đối.
  const paidAt = now.toISOString()
  const db = getDrizzleDb(payload)
  const updateResult = await db.execute(
    sql`UPDATE "orders" SET "payment_status" = 'paid', "paid_at" = ${paidAt}::timestamptz, "updated_at" = ${paidAt}::timestamptz WHERE "id" = ${orderId} AND "payment_status" = 'pending' RETURNING "id"`,
  )
  const rows = (updateResult as { rows?: Array<{ id: number }> }).rows ?? []

  // Chỉ khi RETURNING có dòng mới gửi email / cấp quyền / ghi auditLogs;
  // Không có dòng -> trả kết quả "đã xử lý trước đó" (idempotent), không ném lỗi.
  if (rows.length === 0) {
    const refreshed = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
      overrideAccess: true,
    })
    if (refreshed && refreshed.paymentStatus === 'paid') {
      await payload.create({
        collection: 'auditLogs',
        data: {
          actor: Number(user.id),
          action: 'confirm_manual_payment_duplicate',
          target: `orders:${orderId}`,
          before: { paymentStatus: refreshed.paymentStatus, paidAt: refreshed.paidAt },
          after: {
            paymentStatus: refreshed.paymentStatus,
            paidAt: refreshed.paidAt,
            note: 'đã xác nhận trước đó',
          },
          at: now.toISOString(),
        },
        overrideAccess: true,
      })
      return refreshed
    }
    // Thua race với hủy đơn / cron hết hạn: đơn không còn pending -> báo lỗi, không báo "đã xác nhận"
    throw new InvalidOrderStatusError(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

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

  // Kiểm tra đơn hàng có chứa sản phẩm dạng package hay không
  const items = Array.isArray(order.items) ? order.items : []
  let packageProduct: Product | null = null

  for (const item of items) {
    let p: Product | number | string | null = item.product as Product | number | string | null
    if (typeof p === 'number' || typeof p === 'string') {
      p = (await payload.findByID({
        collection: 'products',
        id: Number(p),
        depth: 1,
        overrideAccess: true,
      })) as Product
    }
    if (p && typeof p === 'object' && p.type === 'package') {
      packageProduct = p
      break
    }
  }

  const isPackageOrder = Boolean(packageProduct)

  // REVIEW-REQUIRED: Cấp quyền truy cập cho đơn gói Growth Mirror
  if (isPackageOrder) {
    try {
      await grantEntitlementsForOrder(orderId, { payload, now })
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { deliveryStatus: 'access_granted' },
        context: { paymentAction: true },
        overrideAccess: true,
      })
    } catch (grantErr) {
      console.error('[Payment] Grant entitlements failed for order', orderId, grantErr)
      await payload.create({
        collection: 'auditLogs',
        data: {
          actor: Number(user.id),
          action: 'grant_entitlements_failed',
          target: `orders:${orderId}`,
          before: { error: String(grantErr) },
          after: null,
          at: now.toISOString(),
        },
        overrideAccess: true,
      })
    }
  }

  // Gửi email xác nhận kèm link đặt lịch / hướng dẫn
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
      if (isPackageOrder && packageProduct) {
        // Tìm các workshop sắp diễn ra có audienceProducts chứa gói này
        let upcomingWorkshops: Array<{ title: string; timeString: string }> = []
        try {
          const workshopsRes = await payload.find({
            collection: 'workshops',
            where: {
              audienceProducts: { contains: packageProduct.id },
              startsAt: { greater_than_equal: now.toISOString() },
            },
            sort: 'startsAt',
            limit: 5,
            overrideAccess: true,
          })
          upcomingWorkshops = workshopsRes.docs.map(
            (w: { startsAt?: string | null; title?: string | null }) => {
              const timeStr = w.startsAt
                ? new Intl.DateTimeFormat('vi-VN', {
                    timeZone: 'Asia/Bangkok',
                    dateStyle: 'full',
                    timeStyle: 'short',
                  }).format(new Date(w.startsAt))
                : ''
              return {
                title: w.title || '',
                timeString: timeStr,
              }
            },
          )
        } catch {
          // Bỏ qua nếu lỗi truy vấn workshop
        }

        const comps = Array.isArray(packageProduct.components) ? packageProduct.components : []
        const hasDigitalTools = comps.some((c) => Boolean(c.grantsProduct))
        const hasCommunity = comps.some((c) => (c.label || '').toLowerCase().includes('cộng đồng'))
        const communityZaloUrl =
          hasCommunity && siteSettings?.zaloGroupUrl ? siteSettings.zaloGroupUrl : null

        await sendPackageOrderPaidEmail(
          payload,
          {
            name: customerDoc.name || 'bạn',
            email: customerDoc.email,
            paymentRef: order.paymentRef || '',
            amount: order.total,
            packageName: packageProduct.name || 'Gói Growth Mirror',
            components: comps.map((c) => ({
              label: c.label || '',
              quantity: c.quantity,
            })),
            hasDigitalTools,
            toolsUrl: getSiteUrl(),
            coachingBookingUrl: siteSettings?.experienceBookingUrl || null,
            upcomingWorkshops,
            communityZaloUrl,
          },
          options.emailSender,
        )
      } else {
        // Đơn trải nghiệm 149k giữ nguyên hành vi
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
      }

      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { deliveryStatus: 'email_sent' },
        context: { paymentAction: true },
        overrideAccess: true,
      })
    } catch (emailErr) {
      console.error('[Payment] Confirmation email delivery failed for order', orderId, emailErr)
      // Đơn hàng vẫn giữ nguyên trạng thái paid (không revert)
    }
  }

  const updatedOrder = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 1,
    overrideAccess: true,
  })

  return updatedOrder ?? order
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
    throw new UnauthorizedPaymentError(vi.payment.errors.unauthorized)
  }

  const payload = await resolvePayload(options.payload)

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })

  if (!order) {
    throw new OrderNotFoundError(vi.payment.errors.orderNotFound)
  }

  // REVIEW-REQUIRED: Không cho phép hủy đơn đã thanh toán (tuân thủ chính sách không hoàn tiền AGENTS.md mục 14)
  if (order.paymentStatus === 'paid') {
    throw new CannotCancelPaidOrderError(vi.payment.errors.cannotCancelPaidOrder)
  }

  if (order.paymentStatus === 'cancelled') {
    return order
  }

  const now = options.now ?? new Date()
  const nowIso = now.toISOString()
  const nextNotes = reason ? `${order.notes || ''}\nLý do hủy: ${reason}`.trim() : order.notes

  // REVIEW-REQUIRED: Hủy đơn hàng nguyên tử bằng câu lệnh UPDATE có điều kiện tại DB
  // Bảng orders không cấu hình versions (không có _orders_v). UPDATE chỉ đổi khi payment_status = 'pending'.
  const db = getDrizzleDb(payload)
  const updateResult = await db.execute(
    sql`UPDATE "orders" SET "payment_status" = 'cancelled', "notes" = ${nextNotes ?? null}, "updated_at" = ${nowIso}::timestamptz WHERE "id" = ${orderId} AND "payment_status" = 'pending' RETURNING "id"`,
  )
  const rows = (updateResult as { rows?: Array<{ id: number }> }).rows ?? []

  if (rows.length === 0) {
    const refreshed = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })
    if (refreshed?.paymentStatus === 'paid') {
      throw new CannotCancelPaidOrderError(vi.payment.errors.cannotCancelPaidOrder)
    }
    if (refreshed?.paymentStatus === 'cancelled') {
      return refreshed
    }
    throw new InvalidOrderStatusError(vi.payment.errors.orderNotFound)
  }

  await payload.create({
    collection: 'auditLogs',
    data: {
      actor: Number(user.id),
      action: 'cancel_order',
      target: `orders:${orderId}`,
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: 'cancelled', reason: reason || null },
      at: nowIso,
    },
    overrideAccess: true,
  })

  const updatedOrder = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })

  return updatedOrder ?? order
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
  const nowIso = now.toISOString()

  // REVIEW-REQUIRED: Cron đóng đơn hết hạn nguyên tử bằng một câu UPDATE có điều kiện tại DB
  // Bảng orders không cấu hình versions (không có _orders_v). Chỉ đổi đơn pending tạo trước cutoff sang failed.
  const db = getDrizzleDb(payload)
  const updateResult = await db.execute(
    sql`UPDATE "orders" SET "payment_status" = 'failed', "updated_at" = ${nowIso}::timestamptz WHERE "payment_status" = 'pending' AND "created_at" < ${cutoff}::timestamptz RETURNING "id", "customer_id", "payment_ref", "total"`,
  )
  const rows =
    (
      updateResult as {
        rows?: Array<{
          id: number
          customer_id: number
          payment_ref: string | null
          total: number | string
        }>
      }
    ).rows ?? []

  let expiredCount = 0
  let reminderSentCount = 0

  for (const row of rows) {
    expiredCount++

    // Kiểm tra nếu khách đồng ý nhận tin quảng bá -> gửi email nhắc hẹn
    const customerDoc = await payload.findByID({
      collection: 'customers',
      id: Number(row.customer_id),
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
