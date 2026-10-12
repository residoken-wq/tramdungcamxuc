import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { markExpiredEntitlements } from '@/lib/entitlements'

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
 * Route tự động cập nhật trạng thái các quyền truy cập (entitlements) đã hết hạn sang 'expired'
 * và phát sự kiện analytics trial_expired.
 * Chỉ cho phép gọi khi có header `Authorization: Bearer <CRON_SECRET>` hợp lệ.
 */
export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization')

  // REVIEW-REQUIRED: Kiểm tra bí mật CRON_SECRET bằng so sánh hằng thời gian tránh timing attack
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await markExpiredEntitlements(new Date())
    return NextResponse.json({
      success: true,
      message: 'Đã hoàn tất kiểm tra và cập nhật quyền truy cập hết hạn.',
      ...result,
    })
  } catch (err) {
    console.error('[Cron] Lỗi khi xử lý entitlement hết hạn:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
