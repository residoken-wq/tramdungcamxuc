/**
 * Luật hành trình Habit Hack (HB-02, HB-05).
 * Module thuần túy, không phụ thuộc database, có thể chạy trên browser và node.
 */

import { getCurrentDayOfPlan } from './tracker-stats'
import {
  getJourneyDays,
  getVotingDays as rhythmGetVotingDays,
  type CheckinLike,
  type PlanLike,
} from './rhythm'

export type { CheckinLike, PlanLike }
export { getJourneyDays }
export type HabitPlanOutcome = 'in_progress' | 'completed' | 'experienced'

export interface ComputeOutcomeParams {
  plan?: PlanLike | null
  checkins?: CheckinLike[] | null
  today?: Date | string
  percent?: number | null
}

/**
 * REVIEW-REQUIRED: Danh sách các ngày bỏ phiếu trong hành trình, phụ thuộc vào nhịp tuần (HB-05).
 */
export function getVotingDays(plan?: PlanLike | null): number[] {
  return rhythmGetVotingDays(plan)
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
 * REVIEW-REQUIRED: Đếm số ngày bỏ phiếu đã check-in hoàn thành (voted/minimal hoặc done=true khi thiếu status).
 * Ngày nghỉ theo nhịp hoặc ngày ngoài hành trình không được tính điểm.
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
    if (typeof c?.day === 'number' && votingDaysSet.has(c.day)) {
      const isCompleted =
        c.status === 'voted' || c.status === 'minimal' || (!c.status && Boolean(c.done))
      if (isCompleted) {
        doneDays.add(c.day)
      }
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
