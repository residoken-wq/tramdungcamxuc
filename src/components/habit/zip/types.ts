export type HabitStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'result'

export interface DiagnoseQuestion {
  id: number
  text: string
  category: string
}

export interface DailyRoutineItem {
  id: string
  activity: string
  score: '+' | '-' | '=' | null
}

export interface IdentityFormData {
  creatorName: string
  identityAction: string
  identityRole: string
  postsPerWeek?: number | null
  selectedDays: string[]
  atomicHabit: string
  selectedMentor: string
  mentorTime?: string
  whyImportant: string
  startDate: string
  endDate: string
  partnerName: string
  companionName?: string
}

export interface LoopTechniques {
  cues: string[]
  cravings: string[]
  responses: string[]
  rewards: string[]
  customCues?: string[]
  customCravings?: string[]
  customResponses?: string[]
  customRewards?: string[]
  appliedNotes?: Record<string, string>
}

export interface TrackerDayItem {
  dayNumber: number
  dateStr: string
  fullDate: string
  dayOfWeek: string
  isPostDay: boolean
  completed: boolean
  isMinimal?: boolean
  isMissed?: boolean
  postPublished: boolean
  emoji?: string
  moodLabel?: string
  emotion?: string | null
  emotionLabel?: string | null
  note?: string | null
}

export interface WeeklyReflections {
  station1: string
  station2: string
  station3: string
  station4: string
}
