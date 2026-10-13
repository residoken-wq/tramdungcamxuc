import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sendTrackerNudges } from '@/lib/habit/tracker.server'

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
 * Route tự động gửi email nhắc lỡ nhịp 2 ngày liên tiếp cho học viên tracker.
 * Chỉ cho phép gọi khi có header `Authorization: Bearer <CRON_SECRET>` hợp lệ.
 */
export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization')

  // REVIEW-REQUIRED: Kiểm tra bí mật CRON_SECRET bằng so sánh hằng thời gian tránh timing attack
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendTrackerNudges(new Date())
    return NextResponse.json({
      success: true,
      message: 'Đã hoàn tất kiểm tra và gửi email nhắc lỡ nhịp tracker.',
      ...result,
    })
  } catch (err) {
    console.error('[Cron] Lỗi khi xử lý nhắc lỡ nhịp tracker:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
