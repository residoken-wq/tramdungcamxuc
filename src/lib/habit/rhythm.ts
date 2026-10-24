/**
 * Bộ luật nhịp tuần và trạng thái ngày (HB-05).
 * Module thuần túy, không phụ thuộc database, có thể chạy trên browser và node.
 */

import { getCurrentDayOfPlan, getVietnamYmd } from './tracker-stats'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type DayState = 'voted' | 'minimal' | 'missed' | 'rest' | 'today' | 'upcoming'
export type CheckinStatus = 'voted' | 'minimal' | 'missed' | 'rest'

export interface PlanLike {
  journeyDays?: number | null
  startDate?: string | Date | null
  rhythmDays?: string[] | null
}

export interface CheckinLike {
  day?: number | null
  done?: boolean | null
  status?: CheckinStatus | string | null
}

const WEEKDAYS_MAP: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/**
 * Lấy tổng số ngày của hành trình. Mặc định 21 nếu kế hoạch cũ không có.
 */
export function getJourneyDays(plan?: PlanLike | null): number {
  if (typeof plan?.journeyDays === 'number' && plan.journeyDays > 0) {
    return plan.journeyDays
  }
  return 21
}

/**
 * Tính thứ của ngày thứ N (1..journeyDays) của kế hoạch theo giờ Việt Nam.
 * Ngày 1 = startDate.
 */
export function weekdayOfDay(startDate: string | Date | null | undefined, day: number): Weekday {
  const startObj = startDate
    ? typeof startDate === 'string'
      ? new Date(startDate)
      : startDate
    : new Date()
  const startYmd = getVietnamYmd(startObj)
  const [y, m, d] = startYmd.split('-').map(Number)
  // Ngày 1 tương ứng với offset 0 ngày, ngày thứ `day` là (day - 1) ngày sau startDate
  const targetUtc = Date.UTC(y, m - 1, d) + (day - 1) * 86_400_000
  const targetDate = new Date(targetUtc)
  const dayIndex = targetDate.getUTCDay()
  return WEEKDAYS_MAP[dayIndex]
}

/**
 * Kiểm tra xem ngày thứ N có phải ngày bỏ phiếu không.
 * - `day` ngoài 1..journeyDays -> false.
 * - `rhythmDays` rỗng hoặc thiếu -> true (mọi ngày đều là ngày bỏ phiếu).
 * - có `rhythmDays` -> thứ của ngày nằm trong rhythmDays.
 */
export function isVotingDay(plan: PlanLike | null | undefined, day: number): boolean {
  const journeyDays = getJourneyDays(plan)
  if (day < 1 || day > journeyDays) {
    return false
  }
  const rhythmDays = plan?.rhythmDays
  if (!rhythmDays || rhythmDays.length === 0) {
    return true
  }
  const wd = weekdayOfDay(plan?.startDate, day)
  return rhythmDays.includes(wd)
}

/**
 * Lấy danh sách các ngày bỏ phiếu trong hành trình (1..journeyDays).
 */
export function getVotingDays(plan?: PlanLike | null): number[] {
  const journeyDays = getJourneyDays(plan)
  const votingDays: number[] = []
  for (let d = 1; d <= journeyDays; d++) {
    if (isVotingDay(plan, d)) {
      votingDays.push(d)
    }
  }
  return votingDays
}

/**
 * Xác định trạng thái của một ngày trong hành trình:
 * - có check-in: status của nó (thiếu status thì suy từ done như HB-04);
 * - không check-in, không phải ngày bỏ phiếu -> rest;
 * - không check-in, ngày bỏ phiếu: trước hôm nay -> missed; là hôm nay -> today; sau hôm nay -> upcoming.
 */
export function getDayState(
  plan: PlanLike | null | undefined,
  checkins: CheckinLike[] | null | undefined,
  day: number,
  today: Date | string,
): DayState {
  const checkin = checkins?.find((c) => c.day === day)
  if (checkin) {
    if (
      checkin.status === 'voted' ||
      checkin.status === 'minimal' ||
      checkin.status === 'missed' ||
      checkin.status === 'rest'
    ) {
      return checkin.status
    }
    return checkin.done ? 'voted' : 'missed'
  }

  if (!isVotingDay(plan, day)) {
    return 'rest'
  }

  const nowDate = typeof today === 'string' ? new Date(today) : today
  const currentDay = getCurrentDayOfPlan(plan?.startDate, nowDate)

  if (day < currentDay) {
    return 'missed'
  }
  if (day === currentDay) {
    return 'today'
  }
  return 'upcoming'
}

/**
 * Tính số ngày bỏ phiếu liên tiếp có voted hoặc minimal, đếm lùi từ hôm qua
 * (hôm nay đã check-in voted/minimal thì tính cả hôm nay).
 * - Ngày nghỉ theo nhịp bỏ qua, không làm đứt chuỗi.
 * - Ngày bỏ phiếu missed hoặc rest (khách tự ghi nghỉ vào ngày bỏ phiếu) làm đứt chuỗi.
 */
export function currentStreak(
  plan: PlanLike | null | undefined,
  checkins: CheckinLike[] | null | undefined,
  today: Date | string,
): number {
  const nowDate = typeof today === 'string' ? new Date(today) : today
  const currentDay = getCurrentDayOfPlan(plan?.startDate, nowDate)
  const journeyDays = getJourneyDays(plan)

  if (currentDay < 1) {
    return 0
  }

  let streak = 0
  let startFromDay: number

  if (currentDay > journeyDays) {
    // Đã qua ngày cuối hành trình: đếm lùi từ ngày cuối cùng
    startFromDay = journeyDays
  } else {
    // Trong hành trình: kiểm tra hôm nay
    if (isVotingDay(plan, currentDay)) {
      const todayState = getDayState(plan, checkins, currentDay, today)
      if (todayState === 'voted' || todayState === 'minimal') {
        streak = 1
      } else if (todayState === 'missed' || todayState === 'rest') {
        // Khách tự ghi missed hoặc rest vào ngày bỏ phiếu hôm nay -> chuỗi đứt ngay hôm nay
        return 0
      }
      // Nếu là 'today' (chưa check-in) -> streak = 0, đếm lùi từ hôm qua
    }
    startFromDay = currentDay - 1
  }

  for (let d = startFromDay; d >= 1; d--) {
    if (!isVotingDay(plan, d)) {
      // Ngày nghỉ theo nhịp: bỏ qua, không làm đứt chuỗi
      continue
    }

    const state = getDayState(plan, checkins, d, today)
    if (state === 'voted' || state === 'minimal') {
      streak++
    } else {
      // missed hoặc rest (khách tự ghi nghỉ vào ngày bỏ phiếu) làm đứt chuỗi
      break
    }
  }

  return streak
}

/**
 * Tìm chuỗi ngày bỏ phiếu liên tiếp gần nhất kết thúc trước hôm nay đang ở trạng thái lỡ (missed),
 * bỏ qua ngày nghỉ theo nhịp.
 * - `count`: số ngày bỏ phiếu lỡ liên tiếp.
 * - `startDay`: ngày đầu của chuỗi lỡ (ngày nhỏ nhất trong chuỗi lỡ đó).
 */
export function missedVotingRun(
  plan: PlanLike | null | undefined,
  checkins: CheckinLike[] | null | undefined,
  today: Date | string,
): { count: number; startDay: number | null } {
  const nowDate = typeof today === 'string' ? new Date(today) : today
  const currentDay = getCurrentDayOfPlan(plan?.startDate, nowDate)
  const journeyDays = getJourneyDays(plan)

  if (currentDay <= 1) {
    return { count: 0, startDay: null }
  }

  let count = 0
  let startDay: number | null = null

  const endDay = Math.min(currentDay - 1, journeyDays)

  for (let d = endDay; d >= 1; d--) {
    if (!isVotingDay(plan, d)) {
      // Ngày nghỉ theo nhịp: bỏ qua
      continue
    }

    const state = getDayState(plan, checkins, d, today)
    if (state === 'missed') {
      count++
      startDay = d
    } else {
      // Gặp ngày có voted / minimal hoặc rest tự ghi -> kết thúc chuỗi lỡ
      break
    }
  }

  if (count === 0) {
    return { count: 0, startDay: null }
  }

  return { count, startDay }
}

/**
 * Kiểm tra xem có cần gửi email nhắc nhở lỡ nhịp hay không:
 * - `missedVotingRun(...).count >= 2`
 * - Hành trình chưa qua ngày cuối (`currentDay <= journeyDays`) và đã bắt đầu (`currentDay >= 1`).
 */
export function shouldNudgeMissed(
  plan: PlanLike | null | undefined,
  checkins: CheckinLike[] | null | undefined,
  today: Date | string,
): boolean {
  const nowDate = typeof today === 'string' ? new Date(today) : today
  const currentDay = getCurrentDayOfPlan(plan?.startDate, nowDate)
  const journeyDays = getJourneyDays(plan)

  if (currentDay < 1 || currentDay > journeyDays) {
    return false
  }

  const run = missedVotingRun(plan, checkins, today)
  return run.count >= 2
}
