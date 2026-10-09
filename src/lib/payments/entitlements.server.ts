import { getPayload, type Payload } from 'payload'
import type { Product } from '@/payload-types'
import config from '@/payload.config'

export interface GrantEntitlementsResult {
  grantedCount: number
  skipped?: boolean
}

/**
 * REVIEW-REQUIRED: Cấp quyền truy cập (entitlements) cho sản phẩm trong gói Growth Mirror khi đơn hàng đã paid.
 *
 * Quy tắc:
 * 1. Chỉ đơn đã thanh toán ('paid') mới được cấp quyền; trạng thái khác bỏ qua.
 * 2. Duyệt qua tất cả sản phẩm trong items có type = 'package'.
 * 3. Với mỗi components[].grantsProduct khác rỗng:
 *    - source = 'package'
 *    - status = 'active'
 *    - grantedAt = paidAt (hoặc now)
 *    - expiresAt: theo Q2 (paidAt + product.accessDurationDays; nếu rỗng -> null / vĩnh viễn)
 *    - order = orderId
 * 4. DB Idempotency: khóa duy nhất grantKey = `${orderId}:${productId}`.
 *    Nếu trùng khóa -> bỏ qua, không ném lỗi.
 *    Gọi 2 lần hoặc đồng thời (Promise.all) -> không bao giờ nhân đôi entitlement.
 */
export async function grantEntitlementsForOrder(
  orderId: number,
  options: { payload?: Payload; now?: Date } = {},
): Promise<GrantEntitlementsResult> {
  const payload = options.payload ?? (await getPayload({ config: await config }))
  const now = options.now ?? new Date()

  // 1. Đọc đơn hàng
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 2,
    overrideAccess: true,
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

  // 2. Duyệt các sản phẩm dạng package trong đơn hàng
  const items = Array.isArray(order.items) ? order.items : []

  for (const item of items) {
    let productDoc: Product | number | string | null = item.product as
      | Product
      | number
      | string
      | null

    // Nếu product chưa được populating đủ depth
    if (typeof productDoc === 'number' || typeof productDoc === 'string') {
      productDoc = (await payload.findByID({
        collection: 'products',
        id: Number(productDoc),
        depth: 1,
        overrideAccess: true,
      })) as Product
    }

    if (!productDoc || typeof productDoc !== 'object' || productDoc.type !== 'package') {
      continue
    }

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
      let grantedProductDoc: Product | { id: number; accessDurationDays?: number | null } | null =
        comp.grantsProduct as Product | { id: number; accessDurationDays?: number | null } | null
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
        })) as Product
      }

      let expiresAt: string | null = null
      const durationDays = grantedProductDoc?.accessDurationDays
      if (typeof durationDays === 'number' && durationDays > 0) {
        expiresAt = new Date(paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      }

      const grantKey = `${orderId}:${grantedProductId}`

      // REVIEW-REQUIRED: Tạo entitlement với grantKey duy nhất
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
        })
        grantedCount++
      } catch (err: unknown) {
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

        const isDuplicate =
          msg.includes('Quyền truy cập cho sản phẩm này trong đơn hàng đã tồn tại') ||
          msg.includes('unique constraint') ||
          msg.includes('duplicate key') ||
          (typeof err === 'object' && err !== null && anyErr.code === '23505') ||
          hasDuplicateMessage

        if (isDuplicate) {
          // Idempotent: Đã được cấp trước đó, bỏ qua không báo lỗi
        } else {
          throw err
        }
      }
    }
  }

  return { grantedCount }
}
