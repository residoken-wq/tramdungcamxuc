import { z } from 'zod'
import { BUNNY_VIDEO_ID_REGEX } from '../video/bunny'
import { vi } from '../i18n/vi'

export const LESSON_STAGES = ['cue', 'craving', 'response', 'reward', 'none'] as const
export type LessonStage = (typeof LESSON_STAGES)[number]

/**
 * Chuyển đổi chuỗi thời lượng (phút:giây hoặc số giây) thành tổng số giây nguyên dương.
 * Ví dụ: "05:30" -> 330, "1:05" -> 65, "330" -> 330, 330 -> 330.
 * Trả về null nếu không hợp lệ hoặc rỗng.
 */
export function parseDurationToSeconds(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? Math.round(input) : null
  }
  const clean = input.trim()
  if (!clean) return null

  // Dạng mm:ss hoặc h:mm:ss
  if (clean.includes(':')) {
    const parts = clean.split(':').map((p) => p.trim())
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10)
      const seconds = parseInt(parts[1], 10)
      if (
        !Number.isNaN(minutes) &&
        !Number.isNaN(seconds) &&
        minutes >= 0 &&
        seconds >= 0 &&
        seconds < 60
      ) {
        return minutes * 60 + seconds
      }
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const seconds = parseInt(parts[2], 10)
      if (
        !Number.isNaN(hours) &&
        !Number.isNaN(minutes) &&
        !Number.isNaN(seconds) &&
        hours >= 0 &&
        minutes >= 0 &&
        minutes < 60 &&
        seconds >= 0 &&
        seconds < 60
      ) {
        return hours * 3600 + minutes * 60 + seconds
      }
    }
    return null
  }

  // Dạng số giây nguyên
  const totalSeconds = parseInt(clean, 10)
  if (!Number.isNaN(totalSeconds) && totalSeconds >= 0) {
    return totalSeconds
  }

  return null
}

/**
 * Định dạng số giây thành chuỗi "mm:ss" thân thiện với người dùng.
 * Ví dụ: 330 -> "05:30", 65 -> "01:05".
 */
export function formatSecondsToMmSs(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(mins)}:${pad(secs)}`
}

export const lessonWizardSchema = z.object({
  moduleId: z
    .union([z.number(), z.string()])
    .refine((val) => Boolean(val), { message: vi.cms.lessonWizard.errors.missingModule }),
  title: z
    .string()
    .trim()
    .min(1, vi.cms.lessonWizard.errors.missingTitle)
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  summary: z.string().trim().max(2000, 'Tóm tắt không được vượt quá 2000 ký tự').optional(),
  stage: z.enum(LESSON_STAGES).default('none'),
  order: z.number().int().min(0, 'Thứ tự không được âm').default(0),
  videoId: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true
        return BUNNY_VIDEO_ID_REGEX.test(val)
      },
      { message: vi.cms.lessonWizard.errors.invalidVideoId },
    )
    .optional(),
  durationInput: z.string().trim().optional(),
  durationSec: z.number().int().min(0).optional(),
  isFreePreview: z.boolean().default(false),
})

export type LessonWizardInput = z.infer<typeof lessonWizardSchema>

export interface ValidateLessonWizardResult {
  success: boolean
  data?: {
    moduleId: number | string
    title: string
    summary: string
    stage: LessonStage
    order: number
    videoId?: string
    durationSec?: number
    isFreePreview: boolean
  }
  errors?: Record<string, string>
  message?: string
}

export function validateLessonWizardData(
  raw: unknown,
  options: { publish?: boolean } = {},
): ValidateLessonWizardResult {
  const result = lessonWizardSchema.safeParse(raw)

  if (!result.success) {
    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() || 'general'
      if (!errors[field]) {
        errors[field] = issue.message
      }
    }
    const firstError = Object.values(errors)[0] || vi.cms.lessonWizard.errors.createFailed
    return {
      success: false,
      errors,
      message: firstError,
    }
  }

  const parsed = result.data

  // Tính toán thời lượng giây từ durationInput hoặc durationSec
  let finalDurationSec = parsed.durationSec
  if (parsed.durationInput) {
    const converted = parseDurationToSeconds(parsed.durationInput)
    if (converted === null && parsed.durationInput.trim().length > 0) {
      return {
        success: false,
        errors: { durationInput: vi.cms.lessonWizard.errors.invalidDuration },
        message: vi.cms.lessonWizard.errors.invalidDuration,
      }
    }
    finalDurationSec = converted ?? undefined
  }

  // Có videoId thì phải đúng định dạng GUID – cả khi lưu nháp (collection không tự kiểm, bản nháp
  // sai có thể được xuất bản sau qua form thường).
  if (parsed.videoId) {
    if (!BUNNY_VIDEO_ID_REGEX.test(parsed.videoId)) {
      return {
        success: false,
        errors: { videoId: vi.cms.lessonWizard.errors.invalidVideoId },
        message: vi.cms.lessonWizard.errors.invalidVideoId,
      }
    }
  }

  return {
    success: true,
    data: {
      moduleId: parsed.moduleId,
      title: parsed.title,
      summary: parsed.summary || '',
      stage: parsed.stage,
      order: parsed.order,
      videoId: parsed.videoId || undefined,
      durationSec: finalDurationSec,
      isFreePreview: Boolean(parsed.isFreePreview),
    },
  }
}
