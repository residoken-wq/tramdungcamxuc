import 'server-only'
import type { Payload } from 'payload'
import type { Order, Product } from '@/payload-types'

export interface OwnPaidOrderFile {
  productId: number
  fileId: number
}

/**
 * REVIEW-REQUIRED: Kiểm quyền tải lại file đã mua – dùng chung cho server action (sinh link)
 * và route tải (khi dùng link). Chỉ trả về khi:
 * - đơn thuộc đúng `customerId`,
 * - đơn `paid`,
 * - file thuộc một sản phẩm có trong `items` của đơn.
 * Mọi trường hợp khác trả null (không phân biệt lý do để không lộ thông tin).
 */
export async function findOwnPaidOrderFile(
  payload: Payload,
  params: { customerId: number; orderId: number; fileId: number },
): Promise<OwnPaidOrderFile | null> {
  const { customerId, orderId, fileId } = params
  if (![customerId, orderId, fileId].every((n) => Number.isInteger(n) && n > 0)) return null

  let order: Order
  try {
    order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    return null
  }

  const ownerId = typeof order.customer === 'object' ? order.customer?.id : order.customer
  if (ownerId !== customerId || order.paymentStatus !== 'paid') return null

  for (const item of order.items ?? []) {
    const product = item.product
    if (typeof product !== 'object' || product === null) continue
    const files = (product as Product).files ?? []
    const hasFile = files.some((entry) => {
      const id = typeof entry.file === 'object' && entry.file !== null ? entry.file.id : entry.file
      return id === fileId
    })
    if (hasFile) return { productId: product.id, fileId }
  }
  return null
}
