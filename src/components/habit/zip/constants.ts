import type { DailyRoutineItem, IdentityFormData, LoopTechniques } from './types'

export const INITIAL_ROUTINES: DailyRoutineItem[] = [
  { id: '1', activity: 'Thức dậy & uống 1 cốc nước ấm', score: '+' },
  { id: '2', activity: 'Mở điện thoại lướt mạng xã hội', score: '-' },
  { id: '3', activity: 'Đánh răng & rửa mặt', score: '=' },
]

export const INITIAL_IDENTITY_DATA: IdentityFormData = {
  creatorName: '',
  identityAction: '',
  identityRole: '',
  postsPerWeek: 3,
  selectedDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
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
