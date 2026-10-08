import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { expirePendingOrders } from '@/lib/payments/orders.server'

export const dynamic = 'force-dynamic'

function isAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || !authHeader) return false
  const expected = `Bearer ${secret}`
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(authHeader)
  if (expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}

/**
 * Route tự động đóng các đơn hàng pending quá 24 giờ.
 * Chỉ cho phép gọi khi có header `Authorization: Bearer <CRON_SECRET>` hợp lệ.
 */
export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization')

  // REVIEW-REQUIRED: Kiểm tra bí mật CRON_SECRET bằng so sánh hằng thời gian tránh timing attack
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expirePendingOrders(new Date())
    return NextResponse.json({
      success: true,
      message: 'Đã hoàn tất kiểm tra và xử lý đơn hàng quá hạn.',
      ...result,
    })
  } catch (err) {
    console.error('[Cron] Lỗi khi xử lý đơn hết hạn:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
