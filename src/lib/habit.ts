import type { HabitStage } from './diagnostic'
import type { HabitChosenTechniqueInput } from './forms/schemas'
import type { Weekday } from './habit/rhythm'

export const HABIT_LOOP_STORAGE_KEY = 'tdcx_habit_loop_v1'
export const HABIT_LOOP_PATH = '/habit/5-phut'
export const HABIT_OFFER_PATH = '/habit/1-percent-better'
export const HABIT_STAGES: readonly HabitStage[] = ['cue', 'craving', 'response', 'reward'] as const
export const DEFAULT_RHYTHM_DAYS: readonly Weekday[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const

export interface PublicTechnique {
  id: number
  name: string
  stage: HabitStage
  description?: string | null
  examples?: string[]
  applyTemplate?: string | null
  applyLabel?: string | null
  applyPlaceholder?: string | null
  order?: number | null
  howTo?: unknown
  example?: unknown
  exampleVideoUrl?: string | null
}

export type HabitScorecardRating = 'good' | 'neutral' | 'bad'

export interface HabitScorecardItem {
  habit: string
  rating: HabitScorecardRating
  time?: string
}

export interface HabitChosenTechnique {
  techniqueId: number
  action: string
}

export interface HabitPlanDraft {
  step: number
  scorecard: HabitScorecardItem[]
  anchorHabit: string
  rhythmDays: Weekday[]
  twoMinuteAction: string
  actionText: string
  personText: string
  identityStatement: string
  chosenTechniques: Record<HabitStage, HabitChosenTechnique[]>
  name?: string
  email?: string
  consent?: boolean
}

/**
 * Xây dựng câu định danh chuẩn: "Tôi sẽ [hành động] để trở thành [con người]"
 */
export function formatIdentityStatement(actionText: string, personText: string): string {
  const action = actionText.trim()
  const person = personText.trim()
  if (!action && !person) return ''
  if (action && !person) return `Tôi sẽ ${action}`
  if (!action && person) return `Để trở thành ${person}`
  return `Tôi sẽ ${action} để trở thành ${person}`
}

/**
 * Tách hành động cụ thể và con người muốn trở thành từ câu định danh (Z1).
 * Hỗ trợ kế hoạch cũ chưa lưu riêng trường personText / actionText trong habitPlans.
 */
export function extractIdentityParts(identityStatement?: string | null): {
  actionText: string
  personText: string
} {
  if (!identityStatement || typeof identityStatement !== 'string') {
    return { actionText: '', personText: '' }
  }

  const trimmed = identityStatement.trim()
  if (!trimmed) {
    return { actionText: '', personText: '' }
  }

  // 1. Khớp chỉ có "Để trở thành [con người]" hoặc "Trở thành [con người]"
  const deTroThanhOnlyRegex = /^(?:để trở thành|trở thành)\s+(.+)$/i
  const matchPersonOnly = trimmed.match(deTroThanhOnlyRegex)
  if (matchPersonOnly) {
    return {
      actionText: '',
      personText: matchPersonOnly[1].trim(),
    }
  }

  // 2. Khớp: [Tôi sẽ ...] để trở thành [con người ...]
  const deTroThanhRegex = /^(?:tôi sẽ\s+)?(.*?)(?:\s+để trở thành\s+|\s+trở thành\s+)(.+)$/i
  const match = trimmed.match(deTroThanhRegex)
  if (match) {
    return {
      actionText: match[1].trim(),
      personText: match[2].trim(),
    }
  }

  // Khớp chỉ có "Tôi sẽ [hành động]"
  const toiSeOnlyRegex = /^tôi sẽ\s+(.+)$/i
  const matchActionOnly = trimmed.match(toiSeOnlyRegex)
  if (matchActionOnly) {
    return {
      actionText: matchActionOnly[1].trim(),
      personText: '',
    }
  }

  return {
    actionText: trimmed,
    personText: '',
  }
}

/**
 * Khởi tạo dữ liệu nháp mặc định cho Habit Loop
 */
export function getDefaultHabitDraft(): HabitPlanDraft {
  return {
    step: 1,
    scorecard: [],
    anchorHabit: '',
    rhythmDays: [...DEFAULT_RHYTHM_DAYS],
    twoMinuteAction: '',
    actionText: '',
    personText: '',
    identityStatement: '',
    chosenTechniques: {
      cue: [],
      craving: [],
      response: [],
      reward: [],
    },
    name: '',
    email: '',
    consent: false,
  }
}

/**
 * Gom danh sách kỹ thuật đã chọn thành mảng phẳng để gửi lên Server
 * // REVIEW-REQUIRED: Giữ kỹ thuật khi action rỗng theo DP-01d (H6 = A)
 */
export function flattenChosenTechniques(
  byStage: Record<HabitStage, HabitChosenTechnique[]>,
): HabitChosenTechniqueInput[] {
  const result: HabitChosenTechniqueInput[] = []
  for (const stage of HABIT_STAGES) {
    const list = byStage[stage] || []
    for (const item of list) {
      if (typeof item.techniqueId === 'number' && item.techniqueId > 0) {
        result.push({
          techniqueId: item.techniqueId,
          stage,
          action: (item.action || '').trim(),
        })
      }
    }
  }
  return result
}
