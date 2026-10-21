/**
 * Luật hành trình Habit Hack (HB-02, HB-05).
 * Module thuần túy, không phụ thuộc database, có thể chạy trên browser và node.
 */

import { getCurrentDayOfPlan } from './tracker-stats'

export type HabitPlanOutcome = 'in_progress' | 'completed' | 'experienced'

export interface PlanLike {
  journeyDays?: number | null
  startDate?: string | Date | null
}

export interface CheckinLike {
  day?: number | null
  done?: boolean | null
}

export interface ComputeOutcomeParams {
  plan?: PlanLike | null
  checkins?: CheckinLike[] | null
  today?: Date | string
  percent?: number | null
}

/**
 * Lấy tổng số ngày của hành trình.
 * Nếu không có trong kế hoạch (kế hoạch cũ trước HB-02), mặc định 21 ngày.
 */
export function getJourneyDays(plan?: PlanLike | null): number {
  if (typeof plan?.journeyDays === 'number' && plan.journeyDays > 0) {
    return plan.journeyDays
  }
  return 21
}

/**
 * Danh sách các ngày bỏ phiếu trong hành trình.
 * Ở HB-02: mọi ngày đều là ngày bỏ phiếu (1..journeyDays).
 * HB-05 sẽ thay thế bằng các ngày theo nhịp tuần đã chọn.
 */
export function getVotingDays(plan?: PlanLike | null): number[] {
  const days = getJourneyDays(plan)
  return Array.from({ length: days }, (_, i) => i + 1)
}

/**
 * Số ngày tối thiểu cần check-in để đạt chuẩn chứng nhận.
 * Công thức: Math.ceil(votingDays.length * percent / 100).
 * Ví dụ: 28 ngày, 90% -> 26 ngày; 21 ngày, 90% -> 19 ngày.
 */
export function requiredDays(votingDays: number[] | number, percent: number = 90): number {
  const total = Array.isArray(votingDays) ? votingDays.length : votingDays
  if (total <= 0) return 0
  const pct = typeof percent === 'number' && Number.isFinite(percent) ? percent : 90
  return Math.ceil((total * pct) / 100)
}

/**
 * Đếm số ngày bỏ phiếu đã check-in hoàn thành (done = true).
 */
export function countCompletedVotingDays(
  plan?: PlanLike | null,
  checkins?: CheckinLike[] | null,
): number {
  if (!checkins || checkins.length === 0) return 0
  const votingDays = getVotingDays(plan)
  const votingDaysSet = new Set(votingDays)

  const doneDays = new Set<number>()
  for (const c of checkins) {
    if (Boolean(c?.done) && typeof c?.day === 'number' && votingDaysSet.has(c.day)) {
      doneDays.add(c.day)
    }
  }
  return doneDays.size
}

/**
 * Tính kết quả hành trình (outcome):
 * - Chưa qua ngày cuối (currentDay <= journeyDays) -> 'in_progress'
 * - Đã qua ngày cuối (currentDay > journeyDays):
 *   + số ngày bỏ phiếu đã check-in (done = true) >= requiredDays -> 'completed'
 *   + ngược lại -> 'experienced'
 */
export function computeOutcome({
  plan,
  checkins = [],
  today = new Date(),
  percent = 90,
}: ComputeOutcomeParams): HabitPlanOutcome {
  const journeyDays = getJourneyDays(plan)
  const nowDate = typeof today === 'string' ? new Date(today) : today
  const currentDay = getCurrentDayOfPlan(plan?.startDate, nowDate)

  // Chưa qua ngày cuối hành trình -> Đang thực hành
  if (currentDay <= journeyDays) {
    return 'in_progress'
  }

  // Đã qua ngày cuối: kiểm tra tỷ lệ đạt chứng nhận
  const votingDays = getVotingDays(plan)
  const minRequired = requiredDays(votingDays, percent ?? 90)
  const completedVotingDays = countCompletedVotingDays(plan, checkins)

  if (completedVotingDays >= minRequired) {
    return 'completed'
  }

  return 'experienced'
}
