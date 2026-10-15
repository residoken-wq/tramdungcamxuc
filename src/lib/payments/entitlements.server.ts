import 'server-only'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import type { Product } from '@/payload-types'
import config from '@/payload.config'
import { track } from '@/lib/analytics/track'

export interface GrantEntitlementsResult {
  grantedCount: number
  skipped?: boolean
}

export interface GrantEntitlementsOptions {
  payload?: Payload
  now?: Date
  req?: PayloadRequest
}

function isDuplicateGrantKeyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  const anyErr = err as {
    code?: string
    errors?: Array<{ path?: string; message?: string }>
    data?: { errors?: Array<{ path?: string; message?: string }> }
  }
  const errorsList = Array.isArray(anyErr?.errors)
    ? anyErr.errors
    : Array.isArray(anyErr?.data?.errors)
      ? anyErr.data.errors
      : []
  const hasDuplicateMessage = errorsList.some(
    (e) =>
      String(e?.message || '').includes(
        'Quyền truy cập cho sản phẩm này trong đơn hàng đã tồn tại',
      ) ||
      e?.path === 'grantKey' ||
      (e?.path === 'order' && String(e?.message || '').includes('tồn tại')),
  )

  return (
    msg.includes('Quyền truy cập cho sản phẩm này trong đơn hàng đã tồn tại') ||
    msg.includes('unique constraint') ||
    msg.includes('duplicate key') ||
    (typeof err === 'object' && err !== null && anyErr.code === '23505') ||
    hasDuplicateMessage
  )
}

async function checkAndEmitTrialConverted(
  payload: Payload,
  customerId: number,
  productDoc: Product | { id: number; slug?: string | null },
  req?: PayloadRequest,
): Promise<void> {
  try {
    const existingTrial = await payload.find({
      collection: 'entitlements',
      where: {
        and: [
          { customer: { equals: customerId } },
          { product: { equals: productDoc.id } },
          { source: { equals: 'trial' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (existingTrial.totalDocs > 0) {
      // TODO(T2-04): track() không ghi nhận gì ở server; cần kênh gửi sự kiện từ server.
      track('trial_converted', {
        productSlug: 'slug' in productDoc ? (productDoc.slug ?? undefined) : undefined,
        productId: productDoc.id,
      })
    }
  } catch {
    // Non-blocking for analytics event
  }
}

/**
 * REVIEW-REQUIRED: Cấp quyền truy cập (entitlements) cho sản phẩm trong gói Growth Mirror hoặc mua lẻ công cụ số khi đơn hàng đã paid.
 *
 * Quy tắc:
 * 1. Chỉ đơn đã thanh toán ('paid') mới được cấp quyền; trạng thái khác bỏ qua.
 * 2. Duyệt qua tất cả sản phẩm trong items:
 *    a) Nếu type = 'package': cấp quyền cho từng components[].grantsProduct (source = 'package').
 *    b) Nếu type = 'digital_tool': cấp quyền trực tiếp cho sản phẩm (source = 'order').
 * 3. status = 'active', grantedAt = paidAt (hoặc now).
 * 4. expiresAt: theo Q2 (paidAt + product.accessDurationDays; nếu rỗng/null/<= 0 -> null / vĩnh viễn).
 * 5. Giữ nguyên bản ghi trial cũ (không xóa). Dữ liệu tracker gắn theo khách hàng.
 * 6. Ghi nhận sự kiện analytics trial_converted nếu khách từng có trial sản phẩm đó.
 * 7. DB Idempotency: khóa duy nhất grantKey = `${orderId}:${productId}`.
 *    Nếu trùng khóa -> bỏ qua, không ném lỗi.
 *    Gọi 2 lần hoặc đồng thời (Promise.all) -> không bao giờ nhân đôi entitlement.
 */
export async function grantEntitlementsForOrder(
  orderId: number,
  options: GrantEntitlementsOptions = {},
): Promise<GrantEntitlementsResult> {
  const payload = options.payload ?? (await getPayload({ config: await config }))
  const now = options.now ?? new Date()
  const req = options.req

  // 1. Đọc đơn hàng
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 2,
    overrideAccess: true,
    req,
  })

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  // Chỉ đơn có paymentStatus = 'paid' mới cấp quyền
  if (order.paymentStatus !== 'paid') {
    return { grantedCount: 0, skipped: true }
  }

  const customerId =
    typeof order.customer === 'object' && order.customer !== null
      ? order.customer.id
      : Number(order.customer)

  if (!customerId) {
    throw new Error(`Order ${orderId} missing customer`)
  }

  const paidAt = order.paidAt ? new Date(order.paidAt) : now
  let grantedCount = 0

  // 2. Duyệt các sản phẩm trong đơn hàng
  const items = Array.isArray(order.items) ? order.items : []

  for (const item of items) {
    let productDoc: Product | number | string | null = item.product as
      Product | number | string | null

    // Nếu product chưa được populate đủ depth
    if (typeof productDoc === 'number' || typeof productDoc === 'string') {
      productDoc = (await payload.findByID({
        collection: 'products',
        id: Number(productDoc),
        depth: 1,
        overrideAccess: true,
        req,
      })) as Product
    }

    if (!productDoc || typeof productDoc !== 'object') {
      continue
    }

    // Trường hợp 2a: Mua lẻ công cụ số (digital_tool)
    if (productDoc.type === 'digital_tool') {
      let expiresAt: string | null = null
      const durationDays = productDoc.accessDurationDays
      if (typeof durationDays === 'number' && durationDays > 0) {
        expiresAt = new Date(paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      }

      const grantKey = `${orderId}:${productDoc.id}`

      // REVIEW-REQUIRED: Tạo entitlement cho digital_tool với grantKey duy nhất
      try {
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerId,
            product: productDoc.id,
            order: orderId,
            source: 'order',
            status: 'active',
            grantedAt: paidAt.toISOString(),
            expiresAt: expiresAt ?? undefined,
            grantKey,
          },
          overrideAccess: true,
          req,
        })
        grantedCount++
        // Chỉ sau khi cấp thành công: webhook trùng / xác nhận 2 lần không đếm chuyển đổi 2 lần.
        await checkAndEmitTrialConverted(payload, customerId, productDoc, req)
      } catch (err: unknown) {
        if (isDuplicateGrantKeyError(err)) {
          // Idempotent: Đã được cấp trước đó, bỏ qua không báo lỗi
        } else {
          throw err
        }
      }
      continue
    }

    // Trường hợp 2b: Gói sản phẩm (package)
    if (productDoc.type === 'package') {
      const components = Array.isArray(productDoc.components) ? productDoc.components : []

      for (const comp of components) {
        if (!comp.grantsProduct) {
          continue
        }

        const grantedProductId =
          typeof comp.grantsProduct === 'object' && comp.grantsProduct !== null
            ? comp.grantsProduct.id
            : Number(comp.grantsProduct)

        if (!grantedProductId) {
          continue
        }

        // Lấy thông tin sản phẩm được cấp để xác định accessDurationDays (Q2)
        let grantedProductDoc:
          | Product
          | { id: number; accessDurationDays?: number | null; slug?: string | null }
          | null = comp.grantsProduct as
          Product | { id: number; accessDurationDays?: number | null; slug?: string | null } | null
        if (
          !grantedProductDoc ||
          typeof grantedProductDoc !== 'object' ||
          !('accessDurationDays' in grantedProductDoc)
        ) {
          grantedProductDoc = (await payload.findByID({
            collection: 'products',
            id: grantedProductId,
            depth: 0,
            overrideAccess: true,
            req,
          })) as Product
        }

        let expiresAt: string | null = null
        const durationDays = grantedProductDoc?.accessDurationDays
        if (typeof durationDays === 'number' && durationDays > 0) {
          expiresAt = new Date(paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        }

        const grantKey = `${orderId}:${grantedProductId}`

        // REVIEW-REQUIRED: Tạo entitlement cho package component với grantKey duy nhất
        try {
          await payload.create({
            collection: 'entitlements',
            data: {
              customer: customerId,
              product: grantedProductId,
              order: orderId,
              source: 'package',
              status: 'active',
              grantedAt: paidAt.toISOString(),
              expiresAt: expiresAt ?? undefined,
              grantKey,
            },
            overrideAccess: true,
            req,
          })
          grantedCount++
          if (grantedProductDoc) {
            await checkAndEmitTrialConverted(payload, customerId, grantedProductDoc, req)
          }
        } catch (err: unknown) {
          if (isDuplicateGrantKeyError(err)) {
            // Idempotent: Đã được cấp trước đó, bỏ qua không báo lỗi
          } else {
            throw err
          }
        }
      }
    }
  }

  return { grantedCount }
}
