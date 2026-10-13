import type { VideoPlayback } from '@/lib/video'

export type LessonAccessReason =
  'not_found' | 'not_published' | 'unauthenticated' | 'entitlement_required'

export interface LessonSummary {
  id: number
  title: string
  summary?: string | null
  durationSec?: number | null
  order?: number | null
  stage?: string | null
  isFreePreview: boolean
  module?:
    | {
        id: number
        title: string
        group?: 'insight' | 'principle' | 'technique' | null
        order?: number | null
      }
    | number
    | null
  _status?: 'draft' | 'published' | null
}

export interface LessonPlaybackResult {
  allowed: boolean
  reason: LessonAccessReason | null
  lesson: LessonSummary | null
  playback: VideoPlayback | null
}

export interface CourseDashboardLesson {
  id: number
  title: string
  summary?: string | null
  durationSec?: number | null
  order: number
  isFreePreview: boolean
  isCompleted: boolean
  watchedPercent: number
  canAccess: boolean
}

export interface CourseModuleItem {
  id: number
  title: string
  group: 'insight' | 'principle' | 'technique'
  order: number
  lessons: CourseDashboardLesson[]
}

export interface CourseDashboardData {
  hasTrackerAccess: boolean
  totalLessons: number
  completedLessons: number
  progressPercent: number
  modules: CourseModuleItem[]
}
