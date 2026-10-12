/**
 * Định dạng thời gian workshop theo giờ Việt Nam (Asia/Ho_Chi_Minh).
 * Ví dụ: "20:00 – 21:30, Thứ Bảy, 18/10/2026" hoặc "20:00, Thứ Bảy, 18/10/2026".
 */
export function formatWorkshopTime(
  startsAt?: string | Date | null,
  endsAt?: string | Date | null,
): string {
  if (!startsAt) return ''
  const startDate = typeof startsAt === 'string' ? new Date(startsAt) : startsAt
  if (Number.isNaN(startDate.getTime())) return ''

  const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const startTimeStr = timeFormatter.format(startDate)
  const dateStr = dateFormatter.format(startDate)

  if (endsAt) {
    const endDate = typeof endsAt === 'string' ? new Date(endsAt) : endsAt
    if (!Number.isNaN(endDate.getTime())) {
      const endTimeStr = timeFormatter.format(endDate)
      return `${startTimeStr} – ${endTimeStr}, ${dateStr}`
    }
  }

  return `${startTimeStr}, ${dateStr}`
}
