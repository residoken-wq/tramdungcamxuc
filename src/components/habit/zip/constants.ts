import type { DailyRoutineItem, IdentityFormData, LoopTechniques } from './types'

// QA DP-01c: the zip starts with 3 empty rows (placeholders only), not pre-scored samples.
export const INITIAL_ROUTINES: DailyRoutineItem[] = [
  { id: 'r-1', activity: '', score: null },
  { id: 'r-2', activity: '', score: null },
  { id: 'r-3', activity: '', score: null },
]

export const INITIAL_IDENTITY_DATA: IdentityFormData = {
  creatorName: '',
  identityAction: '',
  identityRole: '',
  // QA DP-01c: no rhythm chosen yet, as in the zip ('Thứ 2' labels never matched the T2 keys).
  postsPerWeek: null,
  selectedDays: [],
  atomicHabit: '',
  selectedMentor: '',
  mentorTime: '',
  whyImportant: '',
  startDate: '',
  endDate: '',
  partnerName: '',
  companionName: '',
}

export const INITIAL_LOOP_TECHNIQUES: LoopTechniques = {
  cues: [],
  cravings: [],
  responses: [],
  rewards: [],
  customCues: [],
  customCravings: [],
  customResponses: [],
  customRewards: [],
  appliedNotes: {},
}
