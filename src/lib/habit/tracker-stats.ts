import { type EmotionKey, getEmotion } from '@/lib/emotions'

export interface TrackerStats {
  completedDays: number
  mostFrequentEmotion: {
    key: EmotionKey
    label: string
    emoji: string
    count: number
  } | null
}

/**
 * Lấy chuỗi YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function getVietnamYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Trả về ISO string của đầu ngày hôm nay theo giờ Việt Nam (00:00:00+07:00).
 * Giúp lưu vào DB lúc 0h–7h sáng không bị lùi về hôm trước theo UTC.
 */
export function vietnamTodayIso(now: Date = new Date()): string {
  const ymd = getVietnamYmd(now)
  return new Date(`${ymd}T00:00:00+07:00`).toISOString()
}

/**
 * Tính số ngày chênh lệch giữa 2 ngày lịch theo giờ Việt Nam.
 */
export function getVietnamCalendarDayDiff(
  startDate?: Date | string | null,
  now: Date = new Date(),
): number {
  if (!startDate) return 0
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const startYmd = getVietnamYmd(start)
  const nowYmd = getVietnamYmd(now)

  const [sy, sm, sd] = startYmd.split('-').map(Number)
  const [ny, nm, nd] = nowYmd.split('-').map(Number)

  const startUtcMidnight = Date.UTC(sy, sm - 1, sd)
  const nowUtcMidnight = Date.UTC(ny, nm - 1, nd)

  return Math.floor((nowUtcMidnight - startUtcMidnight) / (24 * 60 * 60 * 1000))
}

/**
 * Tính ngày thứ N của kế hoạch theo giờ Việt Nam.
 * Ngày bắt đầu (startDate) là Ngày 1.
 * Ngày thứ N = số ngày từ startDate (giờ VN) + 1.
 */
export function getCurrentDayOfPlan(
  startDate?: Date | string | null,
  now: Date = new Date(),
): number {
  if (!startDate) return 1
  const diff = getVietnamCalendarDayDiff(startDate, now)
  return diff + 1
}

/**
 * Cộng/trừ số ngày vào chuỗi ngày YYYY-MM-DD theo giờ Việt Nam.
 */
export function addVietnamDays(
  baseYmd: string,
  days: number,
  timeSuffix = '00:00:00+07:00',
): string {
  const [y, m, d] = baseYmd.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d) + days * 86_400_000
  const date = new Date(utc)
  const nextYmd = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  return `${nextYmd}T${timeSuffix}`
}

export interface PlanDayDate {
  short: string
  full: string
}

/**
 * Định dạng ngày theo giờ Việt Nam (dd/MM/yyyy).
 * Nhận Date, chuỗi ISO, chuỗi YYYY-MM-DD. Trả về '' nếu null/undefined/không hợp lệ.
 */
export function formatVietnamDate(date?: Date | string | null): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
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
 * Định dạng ngày theo giờ Việt Nam dạng rút gọn (dd/MM).
 * Trả về '' nếu null/undefined/không hợp lệ.
 */
export function formatVietnamShortDate(date?: Date | string | null): string {
  const full = formatVietnamDate(date)
  if (!full) return ''
  return full.slice(0, 5)
}

export interface ParsedTime12 {
  hour12: number
  minute: string
  period: 'AM' | 'PM'
}

/**
 * Chuyển chuỗi giờ 24h (HH:mm) sang { hour12, minute, period }.
 * Trả null nếu chuỗi không hợp lệ.
 */
export function parse24hTime(time24?: string | null): ParsedTime12 | null {
  if (!time24 || typeof time24 !== 'string') return null
  const trimmed = time24.trim()
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed)
  if (!match) return null
  const h24 = Number(match[1])
  const minute = match[2]
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour12, minute, period }
}

/**
 * Chuyển giờ 12h + AM/PM sang chuỗi 24h (HH:mm).
 */
export function to24hTime(
  hour12: number | string,
  minute: number | string = '00',
  period: 'AM' | 'PM' = 'AM',
): string {
  const h = Number(hour12)
  if (isNaN(h) || h < 1 || h > 12) return ''
  let h24: number
  if (period === 'AM') {
    h24 = h === 12 ? 0 : h
  } else {
    h24 = h === 12 ? 12 : h + 12
  }
  const m = String(minute).padStart(2, '0')
  return `${String(h24).padStart(2, '0')}:${m}`
}

/**
 * Định dạng giờ 24h (HH:mm) sang dạng hiển thị "6:00 AM".
 * Trả chuỗi rỗng nếu không hợp lệ.
 */
export function formatTimeAmPm(time24?: string | null): string {
  const parsed = parse24hTime(time24)
  if (!parsed) return ''
  return `${parsed.hour12}:${parsed.minute} ${parsed.period}`
}

/**
 * Tính ngày lịch theo giờ Việt Nam cho ngày thứ N của kế hoạch (HB-23).
 * Ngày 1 = startDate.
 * Trả về { short: 'dd/MM', full: 'dd/MM/yyyy' }.
 * Trả null khi startDate không hợp lệ hoặc day < 1.
 */
export function planDayDate(startDate?: Date | string | null, day?: number): PlanDayDate | null {
  if (!startDate || typeof day !== 'number' || day < 1 || !Number.isFinite(day)) {
    return null
  }
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  if (isNaN(start.getTime())) {
    return null
  }

  const startYmd = getVietnamYmd(start)
  const [y, m, d] = startYmd.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d) + (day - 1) * 86_400_000
  const target = new Date(utc)
  const ty = target.getUTCFullYear()
  const tm = String(target.getUTCMonth() + 1).padStart(2, '0')
  const td = String(target.getUTCDate()).padStart(2, '0')

  return {
    short: `${td}/${tm}`,
    full: `${td}/${tm}/${ty}`,
  }
}

/**
 * Tính toán thống kê hoàn thành và cảm xúc thường gặp nhất từ danh sách check-in.
 */
export function calculateTrackerStats(
  checkins: Array<{ done?: boolean | null; emotion?: string | null }>,
): TrackerStats {
  const completed = checkins.filter((c) => Boolean(c.done))
  const completedDays = completed.length

  const emotionCounts = new Map<string, number>()
  for (const c of completed) {
    if (c.emotion) {
      emotionCounts.set(c.emotion, (emotionCounts.get(c.emotion) ?? 0) + 1)
    }
  }

  let mostFrequent: TrackerStats['mostFrequentEmotion'] = null
  let maxCount = 0

  for (const [key, count] of emotionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      const em = getEmotion(key)
      if (em) {
        mostFrequent = {
          key: em.key as EmotionKey,
          label: em.label,
          emoji: em.emoji,
          count,
        }
      }
    }
  }

  return {
    completedDays,
    mostFrequentEmotion: mostFrequent,
  }
}
