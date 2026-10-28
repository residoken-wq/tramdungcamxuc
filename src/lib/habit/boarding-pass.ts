import { z } from 'zod'
import { vi } from '../i18n/vi'
import type { Weekday } from './rhythm'

export const ALL_WEEKDAYS: readonly Weekday[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const

export const HABIT_STAGES = ['cue', 'craving', 'response', 'reward'] as const
export type HabitStage = (typeof HABIT_STAGES)[number]

export const boardingPassInputSchema = z
  .object({
    identityStatement: z
      .string()
      .trim()
      .min(1, vi.habit.wizard.errors.identityRequired)
      .max(500, vi.habit.wizard.errors.identityMax),
    // The "Tôi sẽ [actionText]" part of the identity statement – used for the anchor formula,
    // the same sentence the wizard shows in step 2 (HB-09).
    actionText: z
      .string()
      .trim()
      .max(500, vi.habit.wizard.errors.identityMax)
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    anchorHabit: z
      .string()
      .trim()
      .max(120, vi.hb03.errors.anchorHabitTooLong)
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    twoMinuteAction: z
      .string()
      .trim()
      .max(200, vi.hb03.errors.twoMinuteActionTooLong)
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    rhythmDays: z.preprocess(
      (val) => (val === null || val === undefined ? undefined : val),
      z
        .array(
          z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], {
            errorMap: () => ({ message: vi.hb09.errors.rhythmDaysInvalid }),
          }),
        )
        .min(1, vi.hb09.errors.rhythmDaysEmpty)
        .max(7)
        .refine((days) => new Set(days).size === days.length, {
          message: vi.hb09.errors.rhythmDaysDuplicate,
        })
        .optional()
        .default(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    ),
    techniqueIds: z.preprocess(
      (val) => (val === null || val === undefined ? [] : val),
      z
        .array(z.number().int().positive())
        .max(8, vi.habit.wizard.errors.techniquesTooMany)
        .optional()
        .default([]),
    ),
  })
  .strip()

export type BoardingPassInput = z.infer<typeof boardingPassInputSchema>

export interface BoardingPassRhythmDay {
  day: Weekday
  label: string
  isActive: boolean
}

export interface BoardingPassStageTechniques {
  stage: HabitStage
  stageTitle: string
  techniqueNames: string[]
}

export interface BoardingPassData {
  identityStatement: string
  anchorHabit?: string
  anchorFormula?: string
  twoMinuteAction?: string
  rhythmDays: BoardingPassRhythmDay[]
  activeRhythmCount: number
  startDateStr: string
  journeyDays: number
  techniquesByStage: BoardingPassStageTechniques[]
}

export function truncateText(str: string, maxLength: number): string {
  const trimmed = str.trim()
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength - 1).trimEnd() + '…'
}

export function formatStartDateVN(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
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

export interface BuildBoardingPassOptions {
  journeyDays?: number | null
  startDate?: string | Date | null
  techniques?: Array<{ id: number; name: string; stage?: string }>
}

export function buildBoardingPass(
  input: BoardingPassInput,
  options: BuildBoardingPassOptions = {},
): BoardingPassData {
  const journeyDays =
    typeof options.journeyDays === 'number' && options.journeyDays > 0 ? options.journeyDays : 28

  const startDateStr = formatStartDateVN(options.startDate ?? new Date())

  // Truncate fields for visual balance on the image card
  const identityStatement = truncateText(input.identityStatement, 240)
  const anchorHabit = input.anchorHabit ? truncateText(input.anchorHabit, 100) : undefined
  const twoMinuteAction = input.twoMinuteAction
    ? truncateText(input.twoMinuteAction, 140)
    : undefined

  // Anchor formula only when both parts come from the learner – no filler text on the image.
  let anchorFormula: string | undefined
  if (anchorHabit && input.actionText) {
    anchorFormula = truncateText(vi.hb10.anchorFormula(anchorHabit, input.actionText), 150)
  }

  // Rhythm days mapping (7 days)
  const userRhythmSet = new Set<Weekday>(input.rhythmDays ?? ALL_WEEKDAYS)
  const rhythmDays: BoardingPassRhythmDay[] = ALL_WEEKDAYS.map((day) => ({
    day,
    label: vi.hb10.weekdaysShort[day],
    isActive: userRhythmSet.has(day),
  }))

  const activeRhythmCount = rhythmDays.filter((d) => d.isActive).length

  // Group published techniques by 4 stages
  const selectedIds = new Set(input.techniqueIds || [])
  const publishedList = options.techniques || []
  const matchingTechniques = publishedList.filter((tech) => selectedIds.has(tech.id))

  const techniquesByStage: BoardingPassStageTechniques[] = HABIT_STAGES.map((stage) => {
    const names = matchingTechniques
      .filter((tech) => tech.stage === stage)
      .map((tech) => truncateText(tech.name, 45))

    return {
      stage,
      stageTitle: vi.hb10.stages[stage],
      techniqueNames: names,
    }
  })

  return {
    identityStatement,
    anchorHabit,
    anchorFormula,
    twoMinuteAction,
    rhythmDays,
    activeRhythmCount,
    startDateStr,
    journeyDays,
    techniquesByStage,
  }
}
