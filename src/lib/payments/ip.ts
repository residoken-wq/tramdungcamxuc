/**
 * Trích xuất IP client an toàn cho webhook SePay.
 * - Lấy phần tử cuối cùng của `X-Forwarded-For` vì reverse proxy của hệ thống (Nginx/Caddy)
 *   sẽ gắn IP kết nối trực tiếp vào cuối chuỗi header này, ngăn chặn việc client giả mạo IP phía trước.
 * - Nếu không có header `X-Forwarded-For`, thử đọc `x-real-ip`.
 * - Nếu không có cả hai, fallback về chuỗi 'unknown' (vẫn được đưa vào hệ thống đếm rate limit).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    const last = parts[parts.length - 1]?.trim()
    if (last) {
      return last
    }
  }
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }
  return 'unknown'
}
