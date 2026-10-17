import 'server-only'
import { notFound } from 'next/navigation'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import type { Order, Product } from '@/payload-types'
import config from '@/payload.config'
import { vi } from '../i18n/vi'
import { experienceOrderSchema, type ExperienceOrderInput } from '../forms/schemas'
import { checkAndRecordRateLimit } from '../forms/ratelimit.server'
import { verifyTurnstile } from '../forms/turnstile.server'
import { getEffectivePrice, getToolUrl } from '../products'
import { computePackageValue } from '../pricing'
import { generatePayToken, generateUniquePaymentRef } from './payment-ref'
import { assertValidBankConfig, buildVietQrPayload, generateVietQrSvg } from './vietqr'
import { isSepayMode } from './provider'
import {
  sendDigitalToolOrderPaidEmail,
  sendExperienceOrderPaidEmail,
  sendOrderExpiredReminderEmail,
  sendPackageOrderPaidEmail,
} from '../email/service.server'
import type { EmailSender } from '../email/types'
import { grantEntitlementsForOrder, type ConvertedTrialProduct } from './entitlements.server'
import { getAccess } from '../entitlements'
import { getSiteUrl } from '../site-url'
import { trackServer } from '../analytics/track.server'

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

export class InvalidProductTypeError extends PaymentError {
  constructor(message = vi.payment.errors.invalidProductType) {
    super(message)
    this.name = 'InvalidProductTypeError'
  }
}

export class ProductExternalError extends PaymentError {
  constructor(message = vi.payment.errors.productExternal) {
    super(message)
    this.name = 'ProductExternalError'
  }
}

export class TermsNotAcceptedError extends PaymentError {
  constructor(
    message = vi.checkout?.termsRequired ??
      'Vui lòng đồng ý với Điều khoản và Chính sách giá – thanh toán để tiếp tục.',
  ) {
    super(message)
    this.name = 'TermsNotAcceptedError'
  }
}

export class AlreadyHasActiveAccessError extends PaymentError {
  toolUrl?: string
  constructor(message = vi.entitlement.alreadyHasActiveAccess, toolUrl?: string) {
    super(message)
    this.name = 'AlreadyHasActiveAccessError'
    this.toolUrl = toolUrl
  }
}

export interface DigitalToolOrderResult {
  success: boolean
  payToken: string
  reused?: boolean
  message: string
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
  paymentProvider?: 'manual' | 'sepay'
  toolUrl?: string | null
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

interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

function getTransactionSessions(
  payload: Payload,
): Record<string, { db?: DrizzleDbExecutor }> | undefined {
  return (payload.db as unknown as { sessions?: Record<string, { db?: DrizzleDbExecutor }> })
    .sessions
}

// REVIEW-REQUIRED: Có transactionID mà không còn session (Payload đã rollback khi một lệnh local API
// lỗi) → ném lỗi, KHÔNG rơi về kết nối chung (ghi ngoài transaction).
function getTransactionDb(
  payload: Payload,
  transactionID?: number | string | null,
): DrizzleDbExecutor {
  if (transactionID) {
    const db = getTransactionSessions(payload)?.[String(transactionID)]?.db
    if (db && typeof db.execute === 'function') {
      return db
    }
    throw new PaymentError(vi.payment.errors.transactionUnavailable)
  }
  return (payload.db as unknown as { drizzle: DrizzleDbExecutor }).drizzle
}

// REVIEW-REQUIRED: Bắt đầu transaction bắt buộc – adapter không hỗ trợ → từ chối, không chạy không khóa.
async function beginPaymentTransaction(payload: Payload): Promise<number | string> {
  if (
    typeof payload.db?.beginTransaction !== 'function' ||
    typeof payload.db.commitTransaction !== 'function' ||
    typeof payload.db.rollbackTransaction !== 'function'
  ) {
    throw new PaymentError(vi.payment.errors.transactionUnavailable)
  }
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) {
    throw new PaymentError(vi.payment.errors.transactionUnavailable)
  }
  return transactionID
}

// REVIEW-REQUIRED: commitTransaction của adapter im lặng khi session đã bị hủy (một lệnh trong
// transaction lỗi và Payload đã rollback). Kiểm session còn sống trước khi commit; mất → ném lỗi.
async function commitPaymentTransaction(
  payload: Payload,
  transactionID: number | string,
): Promise<void> {
  if (!getTransactionSessions(payload)?.[String(transactionID)]) {
    throw new PaymentError(vi.payment.errors.transactionUnavailable)
  }
  await payload.db.commitTransaction(transactionID)
}

async function rollbackPaymentTransaction(
  payload: Payload,
  transactionID: number | string,
  label: string,
): Promise<void> {
  try {
    await payload.db.rollbackTransaction(transactionID)
  } catch (rollbackErr) {
    console.error(`[Payment] Lỗi rollback transaction ${label}:`, rollbackErr)
  }
}

function getDrizzleDb(payload: Payload): DrizzleDbExecutor {
  return (payload.db as unknown as { drizzle: DrizzleDbExecutor }).drizzle
}

/**
 * REVIEW-REQUIRED: Tạo hoặc dùng lại đơn hàng mua lẻ công cụ số (digital_tool).
 *
 * Quy tắc:
 * 1. Chỉ khách hàng đã đăng nhập (customerId hợp lệ > 0).
 * 2. Bắt buộc đồng ý điều khoản thanh toán ({ termsAccepted: true }).
 * 3. Giới hạn tần suất tạo đơn (checkAndRecordRateLimit) theo khách.
 * 4. Sản phẩm: type = 'digital_tool', _status = 'published', saleStatus = 'on_sale', không có externalUrl.
 * 5. Giá đọc trực tiếp từ DB bằng getEffectivePrice, bỏ qua mọi giá gửi từ client.
 * 6. Khách đã có quyền 'active' còn hiệu lực -> ném AlreadyHasActiveAccessError (không tạo đơn).
 * 7. Tái sử dụng đơn hàng: Nếu khách đã có đơn 'pending' chứa sản phẩm này chưa quá 24 giờ và GIÁ KHỚP -> dùng lại payToken; nếu lệch giá -> hủy đơn cũ bằng cancelOrder và tạo đơn mới.
 * 8. Khóa luồng song song theo (customerId, productId) để tránh tạo 2 đơn pending trùng lặp.
 * 9. Tạo paymentRef và payToken duy nhất -> trả về CHỈ payToken (không lộ ID đơn hay thông tin khách).
 */
export async function createDigitalToolOrder(
  customerId: number,
  productSlug: string,
  input: { termsAccepted?: boolean; ip?: string } = {},
  options: { payload?: Payload; now?: Date } = {},
): Promise<DigitalToolOrderResult> {
  const now = options.now ?? new Date()
  const payload = await resolvePayload(options.payload)

  // 1. Kiểm tra khách hàng đã đăng nhập
  if (!customerId || typeof customerId !== 'number' || customerId <= 0) {
    throw new UnauthorizedPaymentError(vi.auth.unauthorizedNotice)
  }

  const customer = await payload.findByID({
    collection: 'customers',
    id: customerId,
    overrideAccess: true,
  })

  if (!customer) {
    throw new UnauthorizedPaymentError(vi.auth.unauthorizedNotice)
  }

  // 2. Bắt buộc đồng ý điều khoản
  if (!input.termsAccepted) {
    throw new TermsNotAcceptedError(
      vi.checkout?.termsRequired ??
        'Vui lòng đồng ý với Điều khoản và Chính sách giá – thanh toán để tiếp tục.',
    )
  }

  // 3. Giới hạn tần suất tạo đơn
  await checkAndRecordRateLimit(payload, {
    form: 'digital_tool_order',
    email: customer.email,
    ip: input.ip,
    maxHits: 10,
    windowMinutes: 10,
  })

  // 4. Tìm sản phẩm theo slug
  const cleanSlug = (productSlug || '').trim()
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: cleanSlug } },
    overrideAccess: true,
    limit: 1,
  })

  if (products.totalDocs === 0) {
    throw new OrderNotFoundError(vi.payment.errors.productNotFound)
  }

  const product = products.docs[0]!

  if (product._status !== 'published') {
    throw new OrderNotFoundError(vi.payment.errors.productNotFound)
  }

  if (product.type !== 'digital_tool') {
    throw new InvalidProductTypeError(vi.payment.errors.invalidProductType)
  }

  if (product.saleStatus !== 'on_sale') {
    throw new ProductNotForSaleError(vi.payment.errors.productNotForSale)
  }

  if (product.externalUrl && product.externalUrl.trim().length > 0) {
    throw new ProductExternalError(vi.payment.errors.productExternal)
  }

  // 5. Kiểm tra cấu hình ngân hàng
  const siteSettings = await payload.findGlobal({
    slug: 'siteSettings',
    overrideAccess: true,
  })
  assertValidBankConfig(siteSettings)

  // 6. Kiểm tra xem khách đã có quyền active còn hiệu lực hay chưa – TRƯỚC khi mở transaction:
  // getAccess chạy trên kết nối chung; gọi trong lúc giữ khóa sẽ cần kết nối thứ hai và có thể treo
  // cả pool khi nhiều yêu cầu cùng chờ khóa.
  const access = await getAccess(customerId, product.id, { payload, now })
  if (access.hasAccess && access.status === 'active') {
    const toolUrl = getToolUrl(product)
    throw new AlreadyHasActiveAccessError(vi.entitlement.alreadyHasActiveAccess, toolUrl)
  }

  // Khóa theo cặp (customerId, productId) quanh bước tìm + tạo đơn bằng Postgres transaction + advisory lock
  const transactionID = await beginPaymentTransaction(payload)
  // A fresh req per call: Payload's local API merges `context` into the req it is given.
  const txReq = () =>
    ({
      transactionID,
      context: { paymentAction: true },
    }) as unknown as PayloadRequest

  try {
    const txDb = getTransactionDb(payload, transactionID)
    // REVIEW-REQUIRED: Khóa tạo đơn bằng Postgres advisory lock trong transaction.
    // pg_advisory_xact_lock(hashtext('order:' || customerId || ':' || productId))
    // tự động giải phóng khi commit hoặc rollback, ngăn chặn tạo 2 đơn pending trùng lặp.
    await txDb.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`order:${customerId}:${product.id}`}))`,
    )

    // 7. Đọc giá hiệu lực từ DB trước
    const effective = getEffectivePrice(product, now)
    const effectivePrice = effective.salePrice ?? effective.price
    if (effectivePrice == null || effectivePrice <= 0) {
      throw new PaymentError(vi.payment.errors.productPriceInvalid)
    }

    // 8. Kiểm tra đơn pending chưa quá 24 giờ để dùng lại
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const recentPendingOrders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { customer: { equals: customerId } },
          { paymentStatus: { equals: 'pending' } },
          { createdAt: { greater_than_equal: twentyFourHoursAgo } },
        ],
      },
      sort: '-createdAt',
      limit: 20,
      overrideAccess: true,
      req: txReq(),
    })

    const reusableOrder = recentPendingOrders.docs.find((ord) => {
      if (!Array.isArray(ord.items)) return false
      return ord.items.some((item) => {
        const pId =
          typeof item.product === 'object' && item.product !== null
            ? item.product.id
            : Number(item.product)
        return pId === product.id
      })
    })

    if (reusableOrder && reusableOrder.payToken) {
      if (reusableOrder.total === effectivePrice) {
        await payload.update({
          collection: 'orders',
          id: reusableOrder.id,
          data: {
            termsAcceptedAt: now.toISOString(),
          },
          context: { paymentAction: true },
          overrideAccess: true,
          req: txReq(),
        })

        await commitPaymentTransaction(payload, transactionID)

        return {
          success: true,
          payToken: reusableOrder.payToken,
          reused: true,
          message: vi.payment.success.orderCreated,
        }
      } else {
        // Giá sản phẩm đã thay đổi -> hủy đơn cũ bằng cancelOrder và tạo đơn mới
        await cancelOrder(reusableOrder.id, { id: 0, role: 'system' }, 'Giá sản phẩm đã thay đổi', {
          payload,
          now,
          req: txReq(),
        })
      }
    }

    // 9. Sinh paymentRef và payToken duy nhất
    const paymentRef = await generateUniquePaymentRef(async (ref) => {
      const { totalDocs } = await payload.count({
        collection: 'orders',
        where: { paymentRef: { equals: ref } },
        overrideAccess: true,
        req: txReq(),
      })
      return totalDocs > 0
    })

    const payToken = generatePayToken()
    const termsAcceptedAt = now.toISOString()

    // 10. Tạo đơn hàng mới
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
        notes: `Mua công cụ số: ${product.name}`,
        createdByAdmin: false,
      },
      context: { paymentAction: true },
      overrideAccess: true,
      req: txReq(),
    })

    await commitPaymentTransaction(payload, transactionID)

    // REVIEW-REQUIRED: COMMIT lỗi (mất kết nối) không ném ra từ adapter → đọc lại đơn trước khi trả payToken.
    const { totalDocs: savedCount } = await payload.count({
      collection: 'orders',
      where: { payToken: { equals: payToken } },
      overrideAccess: true,
    })
    if (savedCount === 0) {
      throw new PaymentError(vi.payment.errors.transactionUnavailable)
    }

    return {
      success: true,
      payToken,
      message: vi.payment.success.orderCreated,
    }
  } catch (err) {
    await rollbackPaymentTransaction(payload, transactionID, 'tạo đơn')
    throw err
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

  // REVIEW-REQUIRED: Đơn do Hana tạo chưa đồng ý điều khoản -> không gửi QR, tài khoản, mã chuyển khoản
  // xuống trình duyệt (che giao diện thôi là chưa đủ).
  const awaitingTerms = Boolean(order.createdByAdmin) && !order.termsAcceptedAt
  if (awaitingTerms) {
    bankInfo.bankBin = ''
    bankInfo.bankName = undefined
    bankInfo.accountNumber = ''
    bankInfo.accountName = ''
  }

  const qrPayload = awaitingTerms
    ? ''
    : buildVietQrPayload({
        bin: bankInfo.bankBin,
        accountNumber: bankInfo.accountNumber,
        amount: order.total,
        addInfo: order.paymentRef || undefined,
      })

  const qrSvg = awaitingTerms ? '' : await generateVietQrSvg(qrPayload)

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

  let toolUrl: string | null = null
  if (Array.isArray(order.items) && order.items.length > 0) {
    const firstItem = order.items[0]
    const product = firstItem.product
    // Chỉ công cụ số (Habit / EQ) mới có nút "Vào sử dụng công cụ"; đơn 149k / gói → nút tài khoản
    if (
      typeof product === 'object' &&
      product !== null &&
      (product.web === 'habit' || product.web === 'eq')
    ) {
      toolUrl = getToolUrl(product)
    }
  }

  const paymentProvider = isSepayMode() ? 'sepay' : 'manual'

  // REVIEW-REQUIRED: DTO công khai không chứa email, số điện thoại hay ID nội bộ của khách hàng
  return {
    paymentRef: awaitingTerms ? '' : order.paymentRef || '',
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
    paymentProvider,
    toolUrl,
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
export interface MarkOrderPaidOptions {
  source: 'manual' | 'webhook'
  actorId?: number | string | null
  now?: Date
  payload?: Payload
  emailSender?: EmailSender
}

/**
 * REVIEW-REQUIRED: Lõi đánh dấu đơn hàng đã thanh toán (dùng chung cho xác nhận thủ công và webhook SePay).
 * Thực hiện atomic UPDATE, cấp quyền (nếu là gói/công cụ số), gửi transactional email và ghi audit log.
 */
export async function markOrderPaid(
  orderId: number,
  options: MarkOrderPaidOptions,
): Promise<Order> {
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
    const actor = options.actorId ? Number(options.actorId) : undefined
    const action =
      options.source === 'webhook'
        ? 'webhook_payment_duplicate'
        : 'confirm_manual_payment_duplicate'

    await payload.create({
      collection: 'auditLogs',
      data: {
        actor,
        action,
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
    Object.assign(order, { __alreadyPaid: true })
    return order
  }

  if (order.paymentStatus !== 'pending' && order.paymentStatus !== 'failed') {
    throw new InvalidOrderStatusError(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

  // REVIEW-REQUIRED: Đơn Hana tạo phải có thời điểm khách đồng ý điều khoản (AGENTS 8.1) mới xác nhận được
  if (order.createdByAdmin && !order.termsAcceptedAt) {
    throw new InvalidOrderStatusError(vi.payment.errors.termsNotAccepted)
  }

  // Bắt đầu transaction nguyên tử: đổi paid + ghi audit + cấp quyền + deliveryStatus = access_granted
  const transactionID = await beginPaymentTransaction(payload)
  // A fresh req per call: Payload's local API merges `context` into the req it is given.
  const txReq = () =>
    ({
      transactionID,
      context: { paymentAction: true },
    }) as unknown as PayloadRequest

  const paidAt = now.toISOString()
  let oldStatus = order.paymentStatus

  let packageProduct: Product | null = null
  let digitalToolProduct: Product | null = null
  let isPackageOrder = false
  let isDigitalToolOrder = false
  // Chỉ lỗi ở bước cấp quyền mới ghi audit grant_entitlements_failed (lỗi khác: rollback, ném lại).
  let grantStarted = false
  // trial_converted gom lại trong transaction, gửi sau commit (T2-22c)
  let convertedTrials: ConvertedTrialProduct[] = []
  // Đơn không còn pending/failed (đã paid / đã hủy) → xử lý sau khi rollback, ngoài transaction.
  let noRowUpdated = false

  try {
    const txDb = getTransactionDb(payload, transactionID)
    // REVIEW-REQUIRED: Chuyển trạng thái sang 'paid' nguyên tử bằng một câu UPDATE có điều kiện tại DB (T2-13 / Q19)
    // Hỗ trợ cả đơn 'pending' và 'failed' (quá hạn 24h). Lấy trạng thái cũ ngay trong cùng câu truy vấn CTE.
    const updateResult = await txDb.execute(
      sql`WITH prev AS (
        SELECT "id", "payment_status"
        FROM "orders"
        WHERE "id" = ${orderId} AND "payment_status" IN ('pending', 'failed')
        FOR UPDATE
      )
      UPDATE "orders" AS o
      SET "payment_status" = 'paid', "paid_at" = ${paidAt}::timestamptz, "updated_at" = ${paidAt}::timestamptz
      FROM prev
      WHERE o."id" = prev."id"
      RETURNING o."id", prev."payment_status" AS "old_status"`,
    )
    const rows =
      (updateResult as { rows?: Array<{ id: number; old_status: 'pending' | 'failed' }> }).rows ??
      []

    // Chỉ khi RETURNING có dòng mới gửi email / cấp quyền / ghi auditLogs;
    // Không có dòng -> trả kết quả "đã xử lý trước đó" (idempotent), không ném lỗi.
    if (rows.length === 0) {
      noRowUpdated = true
    }

    if (!noRowUpdated) {
      // REVIEW-REQUIRED: Ghi nhật ký thao tác trong cùng transaction
      oldStatus = rows[0].old_status
      const auditAction =
        options.source === 'webhook'
          ? 'webhook_payment'
          : oldStatus === 'failed'
            ? 'confirm_expired_order'
            : 'confirm_manual_payment'

      await payload.create({
        collection: 'auditLogs',
        data: {
          actor: options.actorId ? Number(options.actorId) : undefined,
          action: auditAction,
          target: `orders:${orderId}`,
          before: { paymentStatus: oldStatus, paidAt: null },
          after: { paymentStatus: 'paid', paidAt },
          at: paidAt,
        },
        overrideAccess: true,
        req: txReq(),
      })

      // Kiểm tra đơn hàng có chứa sản phẩm dạng package hoặc digital_tool hay không
      const items = Array.isArray(order.items) ? order.items : []

      for (const item of items) {
        let p: Product | number | string | null = item.product as Product | number | string | null
        if (typeof p === 'number' || typeof p === 'string') {
          p = (await payload.findByID({
            collection: 'products',
            id: Number(p),
            depth: 1,
            overrideAccess: true,
            req: txReq(),
          })) as Product
        }
        if (p && typeof p === 'object') {
          if (p.type === 'package') {
            packageProduct = p
            break
          } else if (p.type === 'digital_tool' && !digitalToolProduct) {
            digitalToolProduct = p
          }
        }
      }

      isPackageOrder = Boolean(packageProduct)
      isDigitalToolOrder = !isPackageOrder && Boolean(digitalToolProduct)

      // REVIEW-REQUIRED: Cấp quyền truy cập trong transaction ("đã thanh toán ⇔ đã cấp quyền").
      // Nếu cấp quyền thất bại -> rollback cả transaction (đơn vẫn pending/failed, không có quyền nửa vời).
      if (isPackageOrder || isDigitalToolOrder) {
        grantStarted = true
        const grantResult = await grantEntitlementsForOrder(orderId, {
          payload,
          now,
          reqFactory: txReq,
        })
        convertedTrials = grantResult.convertedTrials ?? []
        grantStarted = false
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: { deliveryStatus: 'access_granted' },
          context: { paymentAction: true },
          overrideAccess: true,
          req: txReq(),
        })
      }
    }

    if (noRowUpdated) {
      await rollbackPaymentTransaction(payload, transactionID, 'markOrderPaid')
    } else {
      // REVIEW-REQUIRED: Commit transaction - chốt trạng thái paid và quyền truy cập đồng thời
      await commitPaymentTransaction(payload, transactionID)
    }
  } catch (txErr) {
    // REVIEW-REQUIRED: Rollback transaction khi bất kỳ thao tác nào thất bại
    await rollbackPaymentTransaction(payload, transactionID, 'markOrderPaid')
    console.error('[Payment] Mark order paid failed in transaction for order', orderId, txErr)
    if (!grantStarted) {
      throw txErr
    }
    // Ghi audit grant_entitlements_failed sau rollback (ngoài transaction)
    const actor = options.actorId ? Number(options.actorId) : undefined
    try {
      await payload.create({
        collection: 'auditLogs',
        data: {
          actor,
          action: 'grant_entitlements_failed',
          target: `orders:${orderId}`,
          before: { error: String(txErr) },
          after: null,
          at: now.toISOString(),
        },
        overrideAccess: true,
      })
    } catch (auditErr) {
      console.error('[Payment] Failed to record grant_entitlements_failed audit:', auditErr)
    }
    throw txErr
  }

  if (noRowUpdated) {
    const refreshed = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
      overrideAccess: true,
    })
    if (refreshed && refreshed.paymentStatus === 'paid') {
      const actor = options.actorId ? Number(options.actorId) : undefined
      const action =
        options.source === 'webhook'
          ? 'webhook_payment_duplicate'
          : 'confirm_manual_payment_duplicate'

      await payload.create({
        collection: 'auditLogs',
        data: {
          actor,
          action,
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
      Object.assign(refreshed, { __alreadyPaid: true })
      return refreshed
    }
    // Thua race với hủy đơn: đơn không còn pending/failed -> báo lỗi, không báo "đã xác nhận"
    throw new InvalidOrderStatusError(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

  // REVIEW-REQUIRED: COMMIT lỗi (mất kết nối) không ném ra từ adapter → đọc lại đơn, chỉ gửi email
  // khi đơn thật sự đã 'paid' trong DB.
  const committed = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    overrideAccess: true,
  })
  if (committed?.paymentStatus !== 'paid') {
    throw new PaymentError(vi.payment.errors.transactionUnavailable)
  }

  // REVIEW-REQUIRED: Gửi email xác nhận sau khi commit (không gửi trong transaction).
  // Email lỗi -> đơn vẫn paid + đã cấp quyền, ghi audit confirmation_email_failed.
  let emailFailed = false
  let emailSent = false
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

        emailSent = true
      } else if (isDigitalToolOrder && digitalToolProduct) {
        // REVIEW-REQUIRED: Gửi email kích hoạt đơn mua lẻ công cụ số
        const siteUrl = getSiteUrl()
        const toolUrl = `${siteUrl}${getToolUrl(digitalToolProduct)}`
        await sendDigitalToolOrderPaidEmail(
          payload,
          {
            name: customerDoc.name || 'bạn',
            email: customerDoc.email,
            paymentRef: order.paymentRef || '',
            amount: order.total,
            toolName: digitalToolProduct.name || 'Công cụ số',
            accessDurationDays: digitalToolProduct.accessDurationDays,
            toolUrl,
          },
          options.emailSender,
        )

        emailSent = true
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

        emailSent = true
      }
    } catch (emailErr) {
      emailFailed = true
      console.error('[Payment] Confirmation email delivery failed for order', orderId, emailErr)
      const actor = options.actorId ? Number(options.actorId) : undefined
      try {
        await payload.create({
          collection: 'auditLogs',
          data: {
            actor,
            action: 'confirmation_email_failed',
            target: `orders:${orderId}`,
            before: { error: String(emailErr) },
            after: null,
            at: now.toISOString(),
          },
          overrideAccess: true,
        })
      } catch (auditErr) {
        console.error('[Payment] Failed to record confirmation_email_failed audit:', auditErr)
      }
    }
  }

  // Cập nhật trạng thái ngoài khối gửi email: email đã đi mà ghi trạng thái lỗi thì không coi là
  // "email lỗi" (tránh gửi lại lần 2 bằng nút "Gửi lại email xác nhận").
  if (emailSent) {
    try {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { deliveryStatus: 'email_sent' },
        context: { paymentAction: true },
        overrideAccess: true,
      })
    } catch (statusErr) {
      console.error(
        '[Payment] Failed to set deliveryStatus email_sent for order',
        orderId,
        statusErr,
      )
    }
  }

  // REVIEW-REQUIRED: Gửi sự kiện analytics order_paid từ server (sau commit, chỉ lần đầu) (T2-22)
  try {
    const orderItems = Array.isArray(order.items) ? order.items : []
    const firstItem = orderItems[0]
    const firstProduct =
      typeof firstItem?.product === 'object' && firstItem.product !== null
        ? (firstItem.product as Product)
        : null
    const primaryProduct = packageProduct ?? digitalToolProduct ?? firstProduct
    const productSlug = primaryProduct?.slug || undefined
    const productId =
      primaryProduct?.id ??
      (typeof firstItem?.product === 'number'
        ? firstItem.product
        : typeof firstItem?.product === 'string'
          ? Number(firstItem.product)
          : undefined)

    await trackServer(
      'order_paid',
      {
        productSlug,
        productId,
        amount: order.total,
      },
      { payload },
    )
    for (const converted of convertedTrials) {
      await trackServer('trial_converted', { ...converted }, { payload })
    }
  } catch (analyticsErr) {
    console.warn('[Payment] Non-blocking analytics error for order_paid:', analyticsErr)
  }

  const updatedOrder = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 1,
    overrideAccess: true,
  })

  const result = updatedOrder ?? order
  if (emailFailed) {
    Object.assign(result, { __emailFailed: true })
  }
  return result
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
    throw new UnauthorizedPaymentError(vi.payment.errors.unauthorized)
  }

  return await markOrderPaid(orderId, {
    source: 'manual',
    actorId: user.id,
    now: options.now,
    payload: options.payload,
    emailSender: options.emailSender,
  })
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
  options: { payload?: Payload; now?: Date; req?: PayloadRequest } = {},
): Promise<unknown> {
  // REVIEW-REQUIRED: Chỉ tài khoản 'owner' hoặc 'system' mới được hủy đơn hàng
  if (!user || (user.role !== 'owner' && user.role !== 'system')) {
    throw new UnauthorizedPaymentError(vi.payment.errors.unauthorized)
  }

  const payload = await resolvePayload(options.payload)

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    req: options.req,
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
  const txId = options.req ? await options.req.transactionID : undefined
  const db = getTransactionDb(payload, txId)
  const updateResult = await db.execute(
    sql`UPDATE "orders" SET "payment_status" = 'cancelled', "notes" = ${nextNotes ?? null}, "updated_at" = ${nowIso}::timestamptz WHERE "id" = ${orderId} AND "payment_status" = 'pending' RETURNING "id"`,
  )
  const rows = (updateResult as { rows?: Array<{ id: number }> }).rows ?? []

  if (rows.length === 0) {
    const refreshed = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
      req: options.req,
    })
    if (refreshed?.paymentStatus === 'paid') {
      throw new CannotCancelPaidOrderError(vi.payment.errors.cannotCancelPaidOrder)
    }
    if (refreshed?.paymentStatus === 'cancelled') {
      return refreshed
    }
    throw new InvalidOrderStatusError(vi.payment.errors.orderNotFound)
  }

  const actorId = user.id ? Number(user.id) : 0
  await payload.create({
    collection: 'auditLogs',
    data: {
      ...(actorId > 0 ? { actor: actorId } : {}),
      action: 'cancel_order',
      target: `orders:${orderId}`,
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: 'cancelled', reason: reason || null },
      at: nowIso,
    },
    overrideAccess: true,
    req: options.req,
  })

  const updatedOrder = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    req: options.req,
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

// REVIEW-REQUIRED: Khách đồng ý điều khoản đơn do admin tạo (gọi qua action acceptOrderTerms).
// UPDATE nguyên tử: SET terms_accepted_at = now() WHERE pay_token = $1 AND terms_accepted_at IS NULL AND payment_status = 'pending'
// Rate limit theo IP, token sai -> notFound() (404).
export async function acceptOrderTermsForToken(
  token: string,
  options: { payload?: Payload; now?: Date; ip?: string } = {},
): Promise<{ success: boolean; message: string }> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    notFound()
  }

  const cleanToken = token.trim()

  const ip = options.ip || '127.0.0.1'

  const payload = await resolvePayload(options.payload)

  // Rate limit theo IP: 10 lần / 10 phút
  await checkAndRecordRateLimit(payload, {
    form: 'accept_order_terms',
    ip,
    maxHits: 10,
    windowMinutes: 10,
  })

  // Kiểm tra đơn hàng có tồn tại với token này không
  const orders = await payload.find({
    collection: 'orders',
    where: { payToken: { equals: cleanToken } },
    overrideAccess: true,
    limit: 1,
  })

  if (orders.totalDocs === 0) {
    notFound()
  }

  const order = orders.docs[0]
  if (order.paymentStatus !== 'pending') {
    throw new InvalidOrderStatusError(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

  const now = options.now ?? new Date()
  const nowIso = now.toISOString()
  const db = getDrizzleDb(payload)

  // Cập nhật nguyên tử chỉ khi terms_accepted_at IS NULL và payment_status = 'pending'
  await db.execute(
    sql`UPDATE "orders" SET "terms_accepted_at" = ${nowIso}::timestamptz, "updated_at" = ${nowIso}::timestamptz WHERE "pay_token" = ${cleanToken} AND "terms_accepted_at" IS NULL AND "payment_status" = 'pending' RETURNING "id"`,
  )

  return {
    success: true,
    message: vi.payment.success.termsAccepted,
  }
}

/**
 * Gửi lại email xác nhận đơn hàng (CHỈ role 'owner').
 * Chỉ cho phép đối với đơn 'paid' có deliveryStatus khác 'email_sent'.
 * Gửi lại email tương ứng với loại đơn (package, digital_tool, experience),
 * cập nhật deliveryStatus = 'email_sent', và ghi nhận nhật ký auditLogs.
 */
export async function resendPaymentConfirmation(
  orderId: number,
  user: AdminActor,
  options: {
    payload?: Payload
    now?: Date
    emailSender?: EmailSender
  } = {},
): Promise<Order> {
  // REVIEW-REQUIRED: Chỉ role owner mới được gửi lại email xác nhận đơn hàng
  if (!user || user.role !== 'owner') {
    throw new UnauthorizedPaymentError(vi.payment.errors.unauthorized)
  }

  const payload = await resolvePayload(options.payload)
  const now = options.now ?? new Date()

  const order = (await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })) as Order | null

  if (!order) {
    throw new OrderNotFoundError(vi.payment.errors.orderNotFound)
  }

  // Chỉ cho phép gửi lại khi đơn đã paid
  if (order.paymentStatus !== 'paid') {
    throw new InvalidOrderStatusError(vi.payment.errors.orderNotPaid)
  }

  // Chỉ cho phép gửi lại khi deliveryStatus khác 'email_sent'
  if (order.deliveryStatus === 'email_sent') {
    throw new PaymentError(vi.payment.errors.alreadyEmailSent)
  }

  const customerId =
    typeof order.customer === 'object' && order.customer !== null
      ? (order.customer as { id: number }).id
      : Number(order.customer)

  const customerDoc = await payload.findByID({
    collection: 'customers',
    id: customerId,
    overrideAccess: true,
  })

  if (!customerDoc?.email) {
    throw new PaymentError(vi.payment.errors.customerEmailNotFound)
  }

  // Xác định loại sản phẩm
  const items = Array.isArray(order.items) ? order.items : []
  let packageProduct: Product | null = null
  let digitalToolProduct: Product | null = null

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
    if (p && typeof p === 'object') {
      if (p.type === 'package') {
        packageProduct = p
        break
      } else if (p.type === 'digital_tool' && !digitalToolProduct) {
        digitalToolProduct = p
      }
    }
  }

  const isPackageOrder = Boolean(packageProduct)
  const isDigitalToolOrder = !isPackageOrder && Boolean(digitalToolProduct)

  // REVIEW-REQUIRED: Giành quyền gửi bằng một câu UPDATE có điều kiện TRƯỚC khi gửi: hai lần bấm /
  // hai owner cùng lúc → chỉ một bên gửi. Gửi lỗi → trả deliveryStatus về như cũ.
  const previousDelivery = order.deliveryStatus ?? 'none'
  const claimResult = await getDrizzleDb(payload).execute(
    sql`UPDATE "orders" SET "delivery_status" = 'email_sent', "updated_at" = ${now.toISOString()}::timestamptz
      WHERE "id" = ${orderId} AND "payment_status" = 'paid'
        AND "delivery_status" IS DISTINCT FROM 'email_sent'
      RETURNING "id"`,
  )
  if (((claimResult as { rows?: unknown[] }).rows ?? []).length === 0) {
    throw new PaymentError(vi.payment.errors.alreadyEmailSent)
  }

  try {
    const siteSettings = await payload.findGlobal({
      slug: 'siteSettings',
      overrideAccess: true,
    })

    if (isPackageOrder && packageProduct) {
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
    } else if (isDigitalToolOrder && digitalToolProduct) {
      const siteUrl = getSiteUrl()
      const toolUrl = `${siteUrl}${getToolUrl(digitalToolProduct)}`
      await sendDigitalToolOrderPaidEmail(
        payload,
        {
          name: customerDoc.name || 'bạn',
          email: customerDoc.email,
          paymentRef: order.paymentRef || '',
          amount: order.total,
          toolName: digitalToolProduct.name || 'Công cụ số',
          accessDurationDays: digitalToolProduct.accessDurationDays,
          toolUrl,
        },
        options.emailSender,
      )
    } else {
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
  } catch (sendErr) {
    await getDrizzleDb(payload).execute(
      sql`UPDATE "orders" SET "delivery_status" = ${previousDelivery}::"enum_orders_delivery_status"
        WHERE "id" = ${orderId} AND "delivery_status" = 'email_sent'`,
    )
    throw sendErr
  }

  const updatedOrder = (await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })) as Order

  // REVIEW-REQUIRED: Ghi nhật ký auditLogs sau khi gửi lại email thành công
  await payload.create({
    collection: 'auditLogs',
    data: {
      actor: user.id ? Number(user.id) : undefined,
      action: 'resend_payment_confirmation',
      target: `orders:${orderId}`,
      before: { deliveryStatus: order.deliveryStatus },
      after: { deliveryStatus: 'email_sent' },
      at: now.toISOString(),
    },
    overrideAccess: true,
  })

  return updatedOrder
}
