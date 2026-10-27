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
  howTo?: unknown
  example?: unknown
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
 */
export function flattenChosenTechniques(
  byStage: Record<HabitStage, HabitChosenTechnique[]>,
): HabitChosenTechniqueInput[] {
  const result: HabitChosenTechniqueInput[] = []
  for (const stage of HABIT_STAGES) {
    const list = byStage[stage] || []
    for (const item of list) {
      if (item.techniqueId && item.action.trim()) {
        result.push({
          techniqueId: item.techniqueId,
          stage,
          action: item.action.trim(),
        })
      }
    }
  }
  return result
}
