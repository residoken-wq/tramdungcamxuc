import 'server-only'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{
    token: string
  }>
}

/**
 * REVIEW-REQUIRED: Route kiểm tra trạng thái thanh toán đơn hàng phục vụ polling.
 * - Chỉ nhận payToken. Token sai hoặc không tìm thấy -> 404.
 * - Tuyệt đối CHỈ trả về `{ paymentStatus: string }`.
 * - Không làm lộ tên, email, số điện thoại, số tiền, mã đơn hàng hay bất kỳ thông tin nhạy cảm nào.
 */
export async function GET(
  _req: Request,
  context: RouteContext,
): Promise<Response> {
  const { token } = await context.params

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const payload = await getPayload({ config })

  const orders = await payload.find({
    collection: 'orders',
    where: { payToken: { equals: token.trim() } },
    overrideAccess: true,
    limit: 1,
    depth: 0,
  })

  if (orders.totalDocs === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const order = orders.docs[0]

  return NextResponse.json({
    paymentStatus: order.paymentStatus,
  })
}
