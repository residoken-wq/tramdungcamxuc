import {
  type HabitFlowDraft,
  getDefaultHabitFlowDraft,
  migrateHabitDraft,
  serializeHabitDraftForStorage,
} from '@/components/habit/flow/draft'
import type { Weekday } from '@/lib/habit/rhythm'
import { formatIdentityStatement } from '@/lib/habit'
import type { HabitScorecardItem, HabitScorecardRating } from '@/lib/habit'
import type { DailyRoutineItem, IdentityFormData, LoopTechniques } from './types'

export const DAY_TO_WEEKDAY: Record<string, Weekday> = {
  T2: 'mon',
  T3: 'tue',
  T4: 'wed',
  T5: 'thu',
  T6: 'fri',
  T7: 'sat',
  CN: 'sun',
}

export const WEEKDAY_TO_DAY: Record<Weekday, string> = {
  mon: 'T2',
  tue: 'T3',
  wed: 'T4',
  thu: 'T5',
  fri: 'T6',
  sat: 'T7',
  sun: 'CN',
}

export const SCORE_TO_RATING: Record<'+' | '-' | '=', HabitScorecardRating> = {
  '+': 'good',
  '-': 'bad',
  '=': 'neutral',
}

export const RATING_TO_SCORE: Record<HabitScorecardRating, '+' | '-' | '='> = {
  good: '+',
  bad: '-',
  neutral: '=',
}

export function routineItemsToScorecard(items: DailyRoutineItem[]): HabitScorecardItem[] {
  return items
    .filter((it) => it.activity.trim().length > 0 && it.score !== null)
    .map((it) => ({
      habit: it.activity.trim(),
      rating: it.score ? SCORE_TO_RATING[it.score] : 'neutral',
    }))
}

export function scorecardToRoutineItems(scorecard: HabitScorecardItem[]): DailyRoutineItem[] {
  if (!scorecard || scorecard.length === 0) {
    return [
      { id: '1', activity: '', score: null },
      { id: '2', activity: '', score: null },
      { id: '3', activity: '', score: null },
    ]
  }
  return scorecard.map((item, idx) => ({
    id: String(idx + 1),
    activity: item.habit,
    score: RATING_TO_SCORE[item.rating] || null,
  }))
}

export function daysToWeekdays(days: string[]): Weekday[] {
  return days.map((d) => DAY_TO_WEEKDAY[d]).filter((w): w is Weekday => Boolean(w))
}

export function weekdaysToDays(weekdays: Weekday[]): string[] {
  return weekdays.map((w) => WEEKDAY_TO_DAY[w]).filter(Boolean)
}

export function recordAnswersToArray(
  record: Record<number, number>,
  totalQuestions = 8,
): (number | null)[] {
  const result: (number | null)[] = []
  for (let i = 1; i <= totalQuestions; i++) {
    result.push(typeof record[i] === 'number' ? record[i] : null)
  }
  return result
}

export function arrayAnswersToRecord(arr?: (number | null)[]): Record<number, number> {
  const rec: Record<number, number> = {}
  if (!arr) return rec
  arr.forEach((val, idx) => {
    if (typeof val === 'number') {
      rec[idx + 1] = val
    }
  })
  return rec
}

export interface ZipState {
  diagnoseAnswers: Record<number, number>
  routines: DailyRoutineItem[]
  identity: IdentityFormData
  loopTechniques: LoopTechniques
}

export function zipStateToFlowDraft(
  zipState: ZipState,
  baseDraft: HabitFlowDraft = getDefaultHabitFlowDraft(),
): HabitFlowDraft {
  const draft = { ...baseDraft }

  draft.diagnoseAnswers = recordAnswersToArray(zipState.diagnoseAnswers, 8)
  draft.scorecard = routineItemsToScorecard(zipState.routines).map((item) =>
    // QA DP-01c: the Mentor time lives on the anchor item of the scorecard.
    item.habit === (zipState.identity.selectedMentor || '').trim() && zipState.identity.mentorTime
      ? { ...item, time: zipState.identity.mentorTime }
      : item,
  )
  draft.privateReason = zipState.identity.whyImportant || ''

  draft.actionText = zipState.identity.identityAction || ''
  draft.personText = zipState.identity.identityRole || ''
  // QA DP-01e: the server needs the full statement; without it every plan save was refused.
  draft.identityStatement = formatIdentityStatement(draft.actionText, draft.personText)
  draft.anchorHabit = zipState.identity.selectedMentor || ''
  draft.twoMinuteAction = zipState.identity.atomicHabit || ''
  draft.companionName = zipState.identity.companionName || ''
  draft.startDate = zipState.identity.startDate || ''
  draft.rhythmDays = daysToWeekdays(zipState.identity.selectedDays || [])

  // Map chosen techniques using real technique IDs
  const stageMap: Record<'cue' | 'craving' | 'response' | 'reward', (string | number)[]> = {
    cue: zipState.loopTechniques.cues || [],
    craving: zipState.loopTechniques.cravings || [],
    response: zipState.loopTechniques.responses || [],
    reward: zipState.loopTechniques.rewards || [],
  }

  const chosen: Record<
    'cue' | 'craving' | 'response' | 'reward',
    Array<{ techniqueId: number; action: string }>
  > = {
    cue: [],
    craving: [],
    response: [],
    reward: [],
  }

  for (const stage of ['cue', 'craving', 'response', 'reward'] as const) {
    for (const rawId of stageMap[stage]) {
      const techId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10)
      if (!isNaN(techId) && techId > 0) {
        const note =
          zipState.loopTechniques.appliedNotes?.[String(techId)] ??
          zipState.loopTechniques.appliedNotes?.[String(rawId)] ??
          ''
        chosen[stage].push({ techniqueId: techId, action: note.trim() })
      }
    }
  }

  draft.chosenTechniques = chosen

  return draft
}

export function flowDraftToZipState(draft: HabitFlowDraft): ZipState {
  const diagnoseAnswers = arrayAnswersToRecord(draft.diagnoseAnswers)
  const routines = scorecardToRoutineItems(draft.scorecard)

  const identity: IdentityFormData = {
    creatorName: '',
    identityAction: draft.actionText || '',
    identityRole: draft.personText || '',
    postsPerWeek: draft.rhythmDays?.length || null,
    selectedDays: weekdaysToDays(draft.rhythmDays || []),
    atomicHabit: draft.twoMinuteAction || '',
    selectedMentor: draft.anchorHabit || '',
    mentorTime: draft.scorecard?.find((i) => i.habit === draft.anchorHabit)?.time || '',
    whyImportant: draft.privateReason || '',
    startDate: draft.startDate || '',
    endDate: '',
    partnerName: '',
    companionName: draft.companionName || '',
  }

  const cues: string[] = []
  const cravings: string[] = []
  const responses: string[] = []
  const rewards: string[] = []
  const appliedNotes: Record<string, string> = {}

  if (draft.chosenTechniques) {
    draft.chosenTechniques.cue?.forEach((t) => {
      cues.push(String(t.techniqueId))
      appliedNotes[String(t.techniqueId)] = t.action || ''
    })
    draft.chosenTechniques.craving?.forEach((t) => {
      cravings.push(String(t.techniqueId))
      appliedNotes[String(t.techniqueId)] = t.action || ''
    })
    draft.chosenTechniques.response?.forEach((t) => {
      responses.push(String(t.techniqueId))
      appliedNotes[String(t.techniqueId)] = t.action || ''
    })
    draft.chosenTechniques.reward?.forEach((t) => {
      rewards.push(String(t.techniqueId))
      appliedNotes[String(t.techniqueId)] = t.action || ''
    })
  }

  return {
    diagnoseAnswers,
    routines,
    identity,
    loopTechniques: {
      cues,
      cravings,
      responses,
      rewards,
      appliedNotes,
    },
  }
}
