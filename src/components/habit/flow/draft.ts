import {
  DEFAULT_RHYTHM_DAYS,
  formatIdentityStatement,
  getDefaultHabitDraft,
  type HabitChosenTechnique,
  type HabitPlanDraft,
  type HabitScorecardItem,
} from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'
import type { Weekday } from '@/lib/habit/rhythm'

export const HABIT_FLOW_DRAFT_VERSION = 2 as const

export type HabitFlowStep = 1 | 2 | 3 | 4 | 5 | 6

export interface HabitFlowDraft extends HabitPlanDraft {
  version: typeof HABIT_FLOW_DRAFT_VERSION
  step: HabitFlowStep
}

export const LEGACY_STEP_MAP: Readonly<Record<1 | 2 | 3 | 4, HabitFlowStep>> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const VALID_WEEKDAYS = new Set<string>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

export function getDefaultHabitFlowDraft(): HabitFlowDraft {
  return {
    ...getDefaultHabitDraft(),
    version: HABIT_FLOW_DRAFT_VERSION,
    step: 1,
  }
}

export function mapLegacyStepToFlowStep(rawStep: unknown, rawVersion: unknown): HabitFlowStep {
  if (rawVersion === HABIT_FLOW_DRAFT_VERSION) {
    if (
      typeof rawStep === 'number' &&
      Number.isInteger(rawStep) &&
      rawStep >= 1 &&
      rawStep <= 6
    ) {
      return rawStep as HabitFlowStep
    }
    return 1
  }

  if (
    typeof rawStep === 'number' &&
    Number.isInteger(rawStep) &&
    (rawStep === 1 || rawStep === 2 || rawStep === 3 || rawStep === 4)
  ) {
    return LEGACY_STEP_MAP[rawStep]
  }

  return 1
}

/**
 * Chuyển đổi và làm sạch nháp từ localStorage (hỗ trợ cả bản cũ không có version và bản v2).
 * Bản cũ: bước 1->3, 2->4, 3->5, 4->6; giữ toàn bộ trường dữ liệu hợp lệ.
 * Không khôi phục name, email, consent theo quy tắc T2-03 & Nghị định 13/2023.
 */
export function migrateHabitDraft(
  raw: unknown,
  knownTechniqueIds?: ReadonlySet<number>,
): HabitFlowDraft {
  const base = getDefaultHabitFlowDraft()
  if (!raw || typeof raw !== 'object') {
    return base
  }

  const parsed = raw as Partial<HabitPlanDraft> & { version?: unknown }

  const rawScorecard = Array.isArray(parsed.scorecard) ? parsed.scorecard : []
  const cleanedScorecard: HabitScorecardItem[] = rawScorecard
    .filter((item): item is HabitScorecardItem =>
      Boolean(
        item &&
        typeof item === 'object' &&
        typeof (item as { habit: unknown }).habit === 'string' &&
        ['good', 'neutral', 'bad'].includes((item as { rating: unknown }).rating as string),
      ),
    )
    .map((item) => {
      const rawTime = typeof item.time === 'string' ? item.time.trim() : undefined
      const validTime = rawTime && TIME_REGEX.test(rawTime) ? rawTime : undefined
      return {
        habit: item.habit.trim(),
        rating: item.rating,
        ...(validTime ? { time: validTime } : {}),
      }
    })

  let cleanedAnchor = typeof parsed.anchorHabit === 'string' ? parsed.anchorHabit.trim() : ''
  const goodHabits = new Set(
    cleanedScorecard
      .filter((s) => s.rating === 'good' && s.habit.length <= 120)
      .map((s) => s.habit),
  )
  if (!goodHabits.has(cleanedAnchor)) {
    cleanedAnchor = ''
  }

  let cleanedRhythm: Weekday[] = [...DEFAULT_RHYTHM_DAYS]
  if (Array.isArray(parsed.rhythmDays)) {
    const filtered = parsed.rhythmDays.filter(
      (d): d is Weekday => typeof d === 'string' && VALID_WEEKDAYS.has(d),
    )
    const unique = Array.from(new Set(filtered))
    if (unique.length > 0) {
      cleanedRhythm = unique
    }
  }

  const cleanedTwoMinuteAction =
    typeof parsed.twoMinuteAction === 'string' ? parsed.twoMinuteAction.slice(0, 200) : ''

  const actionText = typeof parsed.actionText === 'string' ? parsed.actionText : ''
  const personText = typeof parsed.personText === 'string' ? parsed.personText : ''
  const identityStatement =
    typeof parsed.identityStatement === 'string' && parsed.identityStatement
      ? parsed.identityStatement
      : formatIdentityStatement(actionText, personText)

  const keepValidTechniques = (items: unknown): HabitChosenTechnique[] => {
    if (!Array.isArray(items)) return []
    return items.filter(
      (item): item is HabitChosenTechnique =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { techniqueId: unknown }).techniqueId === 'number' &&
        (!knownTechniqueIds ||
          knownTechniqueIds.has((item as { techniqueId: number }).techniqueId)) &&
        typeof (item as { action: unknown }).action === 'string',
    )
  }

  const chosenTechniques: Record<HabitStage, HabitChosenTechnique[]> = parsed.chosenTechniques
    ? {
        cue: keepValidTechniques(parsed.chosenTechniques.cue),
        craving: keepValidTechniques(parsed.chosenTechniques.craving),
        response: keepValidTechniques(parsed.chosenTechniques.response),
        reward: keepValidTechniques(parsed.chosenTechniques.reward),
      }
    : base.chosenTechniques

  const step = mapLegacyStepToFlowStep(parsed.step, parsed.version)

  return {
    version: HABIT_FLOW_DRAFT_VERSION,
    step,
    scorecard: cleanedScorecard,
    anchorHabit: cleanedAnchor,
    rhythmDays: cleanedRhythm,
    twoMinuteAction: cleanedTwoMinuteAction,
    actionText,
    personText,
    identityStatement,
    chosenTechniques,
    name: '',
    email: '',
    consent: false,
  }
}

export function serializeHabitDraftForStorage(draft: HabitFlowDraft): string {
  const {
    consent: _ignoredConsent,
    name: _ignoredName,
    email: _ignoredEmail,
    ...draftToPersist
  } = draft
  return JSON.stringify({
    ...draftToPersist,
    version: HABIT_FLOW_DRAFT_VERSION,
  })
}
