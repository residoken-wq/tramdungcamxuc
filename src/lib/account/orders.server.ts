import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Order, Product } from '@/payload-types'
import { formatVnd } from '../format'
import { vi } from '../i18n/vi'

export interface CustomerOrderFile {
  fileId: number | string
  filename?: string
  downloadUrl: string
}

export interface CustomerOrderDto {
  productName: string
  totalFormatted: string
  rawTotal: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled'
  createdAtFormatted: string
  paidAtFormatted?: string | null
  payToken?: string | null
  paymentRef?: string | null
  downloadFiles?: CustomerOrderFile[]
}

function formatOrderDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return ''
  }
}

/**
 * Đọc danh sách đơn hàng của chính khách hàng hiện tại.
 * - Chỉ đơn của chính khách trong phiên (lọc customer = customerId ở server, overrideAccess chỉ sau khi lọc).
 * - Sắp xếp mới nhất trước (-createdAt), tối đa 20 đơn.
 * - Trả về DTO an toàn: không id nội bộ, không email, không lộ paymentRef của đơn đã hủy.
 */
export async function getCustomerOrders(
  customerId: number,
  options: { payload?: Payload } = {},
): Promise<CustomerOrderDto[]> {
  if (!customerId || typeof customerId !== 'number') {
    return []
  }

  const payload = options.payload || (await getPayload({ config: await config }))

  const ordersRes = await payload.find({
    collection: 'orders',
    where: { customer: { equals: customerId } },
    sort: '-createdAt',
    limit: 20,
    depth: 2,
    overrideAccess: true,
  })

  const dtos: CustomerOrderDto[] = []

  for (const order of ordersRes.docs as Order[]) {
    // 1. Tên sản phẩm
    let productName: string = vi.account.orders.defaultProductName
    if (Array.isArray(order.items) && order.items.length > 0) {
      const names = order.items
        .map((item) => {
          if (typeof item.product === 'object' && item.product !== null) {
            return (item.product as Product).name
          }
          return null
        })
        .filter(Boolean)
      if (names.length > 0) {
        productName = names.join(', ')
      }
    }

    const isCancelled = order.paymentStatus === 'cancelled'
    const isPendingOrFailed = order.paymentStatus === 'pending' || order.paymentStatus === 'failed'

    // Không hiện paymentRef của đơn đã hủy; không hiện email, id nội bộ
    const paymentRef = isCancelled ? null : order.paymentRef || null
    const payToken = isPendingOrFailed ? order.payToken || null : null

    dtos.push({
      productName,
      totalFormatted: formatVnd(order.total) || '0đ',
      rawTotal: order.total,
      paymentStatus: order.paymentStatus,
      createdAtFormatted: formatOrderDate(order.createdAt),
      paidAtFormatted: order.paidAt ? formatOrderDate(order.paidAt) : null,
      payToken,
      paymentRef,
    })
  }

  return dtos
}
