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
