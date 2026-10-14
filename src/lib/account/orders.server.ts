import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Order, Product, PrivateFile } from '@/payload-types'
import { formatVnd } from '../format'
import { vi } from '../i18n/vi'

export interface CustomerOrderFile {
  fileId: number
  filename?: string
}

export interface CustomerOrderDto {
  productName: string
  totalFormatted: string
  rawTotal: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled'
  createdAtFormatted: string
  paidAtFormatted?: string | null
  payToken?: string | null
  /** Chỉ có với đơn `paid` có file: dùng để gọi action tải lại (action tự kiểm quyền ở server). */
  orderId?: number
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
 * - Trả về DTO an toàn: không email, không paymentRef; id đơn chỉ có ở đơn `paid` có file
 *   (cần để gọi action tải lại – action tự kiểm đơn thuộc khách trong phiên).
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
    // Chỉ lấy trường cần hiển thị; không kéo khách (email) hay ảnh sản phẩm
    select: {
      items: true,
      total: true,
      paymentStatus: true,
      createdAt: true,
      paidAt: true,
      payToken: true,
    },
    populate: {
      products: { name: true, files: true },
      privateFiles: { filename: true },
    },
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

    const isPendingOrFailed = order.paymentStatus === 'pending' || order.paymentStatus === 'failed'
    const payToken = isPendingOrFailed ? order.payToken || null : null

    // 2. Tải lại file đã mua: chỉ liệt kê file cho đơn 'paid'; link ký sinh khi khách bấm (action)
    let downloadFiles: CustomerOrderFile[] | undefined
    if (order.paymentStatus === 'paid' && Array.isArray(order.items)) {
      const files: CustomerOrderFile[] = []
      for (const item of order.items) {
        if (typeof item.product === 'object' && item.product !== null) {
          const prod = item.product as Product
          if (Array.isArray(prod.files) && prod.files.length > 0) {
            for (const fileEntry of prod.files) {
              const fileObj = fileEntry.file
              const fileId = typeof fileObj === 'object' && fileObj !== null ? fileObj.id : fileObj
              const filename =
                typeof fileObj === 'object' && fileObj !== null
                  ? (fileObj as PrivateFile).filename || undefined
                  : undefined
              if (typeof fileId === 'number' && !files.some((f) => f.fileId === fileId)) {
                files.push({ fileId, filename })
              }
            }
          }
        }
      }
      if (files.length > 0) {
        downloadFiles = files
      }
    }

    dtos.push({
      productName,
      totalFormatted: formatVnd(order.total) || '0đ',
      rawTotal: order.total,
      paymentStatus: order.paymentStatus,
      createdAtFormatted: formatOrderDate(order.createdAt),
      paidAtFormatted: order.paidAt ? formatOrderDate(order.paidAt) : null,
      payToken,
      ...(downloadFiles ? { orderId: order.id, downloadFiles } : {}),
    })
  }

  return dtos
}
