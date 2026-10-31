/**
 * HB-24: pure helpers for the CMS content of the new habit flow (HB v2) – step 1 "Khám đúng bệnh"
 * scoring and the step 6 Boarding Pass caption. Client-safe (no Payload imports).
 */
import { HABIT_STAGES, scoreDiagnostic, type HabitStage } from '../diagnostic'

export interface FlowDiagnoseQuestion {
  statement: string
  stage: HabitStage
}

export interface FlowDiagnoseScore {
  answeredCount: number
  totalCount: number
  isComplete: boolean
  averageScores: Record<HabitStage, number>
  /** Stage with the highest average (the "bottleneck"); null until every question is answered. */
  topStage: HabitStage | null
}

/**
 * Scores the step-1 survey with the same rule as the `/habit/chan-doan` quiz (decision 10/10:
 * scale 1–5, highest average per stage, ties broken Cue → Craving → Response → Reward).
 * `answers[i]` belongs to `questions[i]`; `null` / missing = not answered yet.
 */
export function scoreFlowDiagnose(
  answers: readonly (number | null | undefined)[],
  questions: readonly FlowDiagnoseQuestion[],
): FlowDiagnoseScore {
  const items = questions.map((q, index) => ({ id: index, stage: q.stage }))
  const answered = questions
    .map((_, index) => ({ questionId: index, score: answers[index] }))
    .filter((a): a is { questionId: number; score: number } => {
      return typeof a.score === 'number' && Number.isFinite(a.score)
    })
  const result = scoreDiagnostic(answered, items)
  const isComplete = questions.length > 0 && answered.length === questions.length
  return {
    answeredCount: answered.length,
    totalCount: questions.length,
    isComplete,
    averageScores: result.averageScores,
    topStage: isComplete ? result.topStage : null,
  }
}

export function isHabitStage(value: unknown): value is HabitStage {
  return typeof value === 'string' && (HABIT_STAGES as readonly string[]).includes(value)
}

/** Placeholders Hana may use in the Boarding Pass caption. Never add private fields here. */
export const CAPTION_PLACEHOLDERS = ['tuyen_ngon', 'so_ngay', 'ngay_bat_dau'] as const
export type CaptionPlaceholder = (typeof CAPTION_PLACEHOLDERS)[number]
export const CAPTION_MAX_LENGTH = 2200

const PLACEHOLDER_PATTERN = /\{([^{}\s]*)\}/g

/** Placeholder names in the template that are not in `CAPTION_PLACEHOLDERS`. */
export function unknownCaptionPlaceholders(template: string): string[] {
  const unknown = new Set<string>()
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    const name = match[1] ?? ''
    if (!(CAPTION_PLACEHOLDERS as readonly string[]).includes(name)) unknown.add(`{${name}}`)
  }
  return [...unknown]
}

/**
 * Fills the caption template. A placeholder without a value is removed (no "undefined" in the
 * copied text) and the extra spaces it leaves are collapsed.
 */
export function fillBoardingCaption(
  template: string,
  values: Partial<Record<CaptionPlaceholder, string | number | null | undefined>>,
): string {
  const filled = template.replace(PLACEHOLDER_PATTERN, (whole, name: string) => {
    if (!(CAPTION_PLACEHOLDERS as readonly string[]).includes(name)) return whole
    const value = values[name as CaptionPlaceholder]
    return value === null || value === undefined ? '' : String(value).trim()
  })
  return filled
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n')
    .trim()
}
