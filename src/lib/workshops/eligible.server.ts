import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Workshop } from '@/payload-types'
import { formatWorkshopTime } from './format'

export interface EligibleWorkshop {
  id: number
  title: string
  startsAt: string
  endsAt: string | null
  joinUrl: string | null
  canJoinNow: boolean
  formattedTime: string
  status: 'upcoming' | 'open' | 'ended'
}

/**
 * REVIEW-REQUIRED: Kiểm tra quyền tham dự workshop và kiểm soát link phòng họp (joinUrl).
 *
 * Điều kiện được thấy và tham gia workshop:
 * 1. Khách hàng phải có ít nhất một đơn hàng đã thanh toán (paymentStatus === 'paid')
 *    chứa sản phẩm nằm trong danh sách `audienceProducts` của workshop.
 * 2. Workshop phải ở trạng thái đã xuất bản (_status === 'published').
 * 3. Workshop sắp diễn ra hoặc đang diễn ra (endTime >= now).
 * 4. Quyền truy cập joinUrl:
 *    - `joinUrl` trong collection Workshops được bảo vệ (access: { read: authenticated }),
 *      nghĩa là khách thông thường không thể tự đọc qua API public/GraphQL.
 *    - Server chỉ dùng `overrideAccess: true` để lấy `joinUrl` SAU KHI đã kiểm tra
 *      đủ điều kiện khách đã mua VÀ thời điểm hiện tại nằm trong khoảng [startsAt - 60 phút, endTime].
 *    - Ngoài khoảng 60 phút trước giờ học đến khi kết thúc, `joinUrl` luôn trả về null.
 */
export async function getEligibleWorkshops(
  customerId: number,
  now: Date = new Date(),
  customPayload?: Payload,
): Promise<EligibleWorkshop[]> {
  const payload = customPayload ?? (await getPayload({ config }))

  // 1. Lấy danh sách sản phẩm từ các đơn hàng ĐÃ THANH TOÁN của khách
  const paidOrders = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { customer: { equals: customerId } },
        { paymentStatus: { equals: 'paid' } },
      ],
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  const purchasedProductIds = new Set<number>()
  for (const order of paidOrders.docs) {
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const rawProduct = item.product
        const pid =
          typeof rawProduct === 'object' && rawProduct !== null
            ? (rawProduct as { id: number }).id
            : Number(rawProduct)
        if (Number.isFinite(pid) && pid > 0) {
          purchasedProductIds.add(pid)
        }
      }
    }
  }

  // Khách chưa mua sản phẩm nào -> không có workshop nào đủ điều kiện
  if (purchasedProductIds.size === 0) {
    return []
  }

  // 2. Lấy các workshop đã xuất bản
  const workshopsRes = await payload.find({
    collection: 'workshops',
    where: {
      _status: { equals: 'published' },
    },
    sort: 'startsAt',
    limit: 100,
    depth: 0,
    overrideAccess: true, // REVIEW-REQUIRED: Server đọc joinUrl để phục vụ kiểm tra điều kiện mở link
  })

  const results: EligibleWorkshop[] = []

  for (const rawDoc of workshopsRes.docs) {
    const ws = rawDoc as unknown as Workshop
    if (!ws.startsAt) continue

    const startTime = new Date(ws.startsAt)
    if (Number.isNaN(startTime.getTime())) continue

    // Nếu không có endsAt, mặc định workshop kéo dài 2 giờ từ lúc bắt đầu
    const endTime = ws.endsAt
      ? new Date(ws.endsAt)
      : new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

    // Chỉ lấy workshop trong tương lai hoặc đang diễn ra
    if (endTime < now) {
      continue
    }

    // Kiểm tra audienceProducts
    const audience = Array.isArray(ws.audienceProducts) ? ws.audienceProducts : []
    const isEligible = audience.some((item) => {
      const pid =
        typeof item === 'object' && item !== null
          ? (item as { id: number }).id
          : Number(item)
      return purchasedProductIds.has(pid)
    })

    if (!isEligible) {
      continue
    }

    // Khoảng thời gian mở link: 60 phút trước giờ bắt đầu đến hết giờ kết thúc
    const joinWindowStart = new Date(startTime.getTime() - 60 * 60 * 1000)
    const canJoinNow = now >= joinWindowStart && now <= endTime

    // REVIEW-REQUIRED: Chỉ cấp joinUrl khi canJoinNow === true
    const joinUrl = canJoinNow && ws.joinUrl ? ws.joinUrl : null
    const status: 'open' | 'upcoming' = canJoinNow ? 'open' : 'upcoming'

    results.push({
      id: ws.id,
      title: ws.title,
      startsAt: ws.startsAt,
      endsAt: ws.endsAt ?? null,
      joinUrl,
      canJoinNow,
      formattedTime: formatWorkshopTime(ws.startsAt, ws.endsAt),
      status,
    })
  }

  // Sắp xếp theo startsAt tăng dần
  results.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  return results
}
