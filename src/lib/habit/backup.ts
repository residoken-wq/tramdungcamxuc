/**
 * Định dạng bản sao lưu JSON, xuất CSV 28 ngày và tạo đoạn chữ gửi Coach (HB-13).
 * Module thuần túy, không phụ thuộc database, chạy được trên cả trình duyệt và server.
 */

import { z } from 'zod'
import { EMOTIONS, getEmotion, type EmotionKey } from '@/lib/emotions'
import type { HabitStage } from '@/lib/diagnostic'
import { vi } from '@/lib/i18n/vi'
import {
  currentStreak,
  getDayState,
  getJourneyDays,
  getVotingDays,
  type CheckinStatus,
  type Weekday,
} from './rhythm'
import { countCompletedVotingDays } from './journey'
import { calculateTrackerStats, getVietnamYmd, planDayDate } from './tracker-stats'

export const HABIT_BACKUP_FORMAT = 'tdcx-habit-backup' as const
export const HABIT_BACKUP_VERSION = 1 as const
export const MAX_BACKUP_BYTES = 200 * 1024 // 200 KB
export const MAX_BACKUP_CHECKINS = 366

const WEEKDAY_VALUES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const STAGE_VALUES = ['cue', 'craving', 'response', 'reward'] as const
const STATUS_VALUES = ['voted', 'minimal', 'missed', 'rest'] as const
const EMOTION_KEYS = EMOTIONS.map((e) => e.key) as [EmotionKey, ...EmotionKey[]]

export interface HabitBackupTechnique {
  name: string | null
  stage: HabitStage | null
  action: string
}

export interface HabitBackupPlan {
  identityStatement: string | null
  rhythmDays: Weekday[] | null
  anchorHabit: string | null
  twoMinuteAction: string | null
  privateReason: string | null
  companionName: string | null
  chosenTechniques: HabitBackupTechnique[]
  startDate: string | null
  journeyDays: number
}

export interface HabitBackupCheckin {
  day: number
  status: CheckinStatus
  emotion: EmotionKey | null
  note: string | null
}

export interface HabitBackupReflection {
  stationIndex?: number
  stationName?: string | null
  answers?: {
    question: string
    answer: string
  }[]
  note?: string | null
  updatedAt?: string | null
}

export interface HabitBackupData {
  format: typeof HABIT_BACKUP_FORMAT
  version: typeof HABIT_BACKUP_VERSION
  exportedAt: string
  plan: HabitBackupPlan
  checkins: HabitBackupCheckin[]
  reflections: HabitBackupReflection[]
}

export const habitBackupTechniqueSchema = z.object({
  name: z
    .string()
    .trim()
    .max(200, vi.hb13.errors.invalidSchema)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  stage: z
    .enum(STAGE_VALUES)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  action: z
    .string()
    .trim()
    .min(1, vi.hb13.errors.invalidSchema)
    .max(300, vi.hb13.errors.invalidSchema),
})

export const habitBackupPlanSchema = z.object({
  identityStatement: z
    .string()
    .trim()
    .max(500, vi.hb13.errors.invalidSchema)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  rhythmDays: z
    .array(z.enum(WEEKDAY_VALUES))
    .min(1, vi.hb09.errors.rhythmDaysEmpty)
    .max(7, vi.hb13.errors.invalidSchema)
    .refine((days) => new Set(days).size === days.length, {
      message: vi.hb03.errors.rhythmDaysDuplicate,
    })
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  anchorHabit: z
    .string()
    .trim()
    .max(120, vi.hb03.errors.anchorHabitTooLong)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  twoMinuteAction: z
    .string()
    .trim()
    .max(200, vi.hb03.errors.twoMinuteActionTooLong)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  privateReason: z
    .string()
    .trim()
    .max(1000, vi.hb03.errors.privateReasonTooLong)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  companionName: z
    .string()
    .trim()
    .max(100, vi.hb03.errors.companionNameTooLong)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  chosenTechniques: z
    .array(habitBackupTechniqueSchema)
    .max(20, vi.hb13.errors.invalidSchema)
    .optional()
    .default([]),
  startDate: z
    .string()
    .trim()
    .max(64, vi.hb13.errors.invalidSchema)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  journeyDays: z.number().int().min(1).max(366).optional().default(28),
})

export const habitBackupCheckinSchema = z.object({
  day: z.number().int().min(1).max(366),
  status: z.enum(STATUS_VALUES),
  emotion: z
    .enum(EMOTION_KEYS)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  note: z
    .string()
    .trim()
    .max(500, vi.hb13.errors.invalidSchema)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
})

export const habitBackupReflectionSchema = z.object({
  stationIndex: z.number().int().min(0).max(20).optional(),
  stationName: z.string().trim().max(200).nullable().optional(),
  answers: z
    .array(
      z.object({
        question: z.string().trim().max(500),
        answer: z.string().trim().max(2000),
      }),
    )
    .max(20)
    .optional(),
  note: z.string().trim().max(2000).nullable().optional(),
  updatedAt: z.string().trim().max(64).nullable().optional(),
})

export const habitBackupSchema = z.object({
  format: z.literal(HABIT_BACKUP_FORMAT, {
    errorMap: () => ({ message: vi.hb13.errors.invalidFormat }),
  }),
  version: z.literal(HABIT_BACKUP_VERSION, {
    errorMap: () => ({ message: vi.hb13.errors.unsupportedVersion }),
  }),
  exportedAt: z.string().trim().min(1).max(64),
  plan: habitBackupPlanSchema,
  checkins: z
    .array(habitBackupCheckinSchema)
    .max(MAX_BACKUP_CHECKINS, vi.hb13.errors.tooManyCheckins),
  reflections: z.array(habitBackupReflectionSchema).max(20).optional().default([]),
})

export interface RawBackupPlanSource {
  identityStatement?: string | null
  rhythmDays?: readonly string[] | null
  anchorHabit?: string | null
  twoMinuteAction?: string | null
  privateReason?: string | null
  companionName?: string | null
  chosenTechniques?:
    | readonly {
        technique?:
          | number
          | {
              name?: string | null
              stage?: string | null
            }
          | null
        name?: string | null
        stage?: string | null
        action?: string | null
      }[]
    | null
  startDate?: string | Date | null
  journeyDays?: number | null
}

export interface RawBackupCheckinSource {
  day: number
  done?: boolean | null
  status?: CheckinStatus | string | null
  emotion?: string | null
  note?: string | null
}

function isWeekday(v: unknown): v is Weekday {
  return typeof v === 'string' && (WEEKDAY_VALUES as readonly string[]).includes(v)
}

function isHabitStage(v: unknown): v is HabitStage {
  return typeof v === 'string' && (STAGE_VALUES as readonly string[]).includes(v)
}

function isCheckinStatus(v: unknown): v is CheckinStatus {
  return typeof v === 'string' && (STATUS_VALUES as readonly string[]).includes(v)
}

function isEmotionKey(v: unknown): v is EmotionKey {
  return typeof v === 'string' && (EMOTION_KEYS as readonly string[]).includes(v)
}

const cleanNullableString = (val: unknown, maxLen: number): string | null => {
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLen)
}

/**
 * Xây dựng cấu trúc bản sao lưu chuẩn từ kế hoạch và danh sách check-in.
 * Loại bỏ hoàn toàn id nội bộ, email, customer, token.
 */
export function buildHabitBackup(
  plan: RawBackupPlanSource | null | undefined,
  checkins: RawBackupCheckinSource[] | null | undefined,
  options?: {
    exportedAt?: string | Date
    reflections?: HabitBackupReflection[]
  },
): HabitBackupData {
  const exportedAt =
    options?.exportedAt instanceof Date
      ? options.exportedAt.toISOString()
      : typeof options?.exportedAt === 'string' && options.exportedAt.trim().length > 0
        ? options.exportedAt.trim()
        : new Date().toISOString()

  const rawRhythm = Array.isArray(plan?.rhythmDays)
    ? Array.from(new Set(plan.rhythmDays.filter(isWeekday)))
    : []

  const rawTechs = Array.isArray(plan?.chosenTechniques) ? plan.chosenTechniques : []
  const chosenTechniques: HabitBackupTechnique[] = []
  for (const item of rawTechs) {
    if (!item || typeof item !== 'object') continue
    const action = cleanNullableString(item.action, 300)
    if (!action) continue

    const techObj =
      typeof item.technique === 'object' && item.technique !== null ? item.technique : null
    const name =
      cleanNullableString(item.name, 200) ?? cleanNullableString(techObj?.name, 200) ?? null
    const stage = isHabitStage(item.stage)
      ? item.stage
      : isHabitStage(techObj?.stage)
        ? techObj.stage
        : null

    chosenTechniques.push({
      name,
      stage,
      action,
    })
  }

  const startDate =
    plan?.startDate instanceof Date
      ? plan.startDate.toISOString()
      : cleanNullableString(plan?.startDate, 64)

  const journeyDays =
    typeof plan?.journeyDays === 'number' &&
    Number.isInteger(plan.journeyDays) &&
    plan.journeyDays >= 1 &&
    plan.journeyDays <= 366
      ? plan.journeyDays
      : 28

  const rawCheckins = Array.isArray(checkins) ? checkins : []
  const cleanCheckins: HabitBackupCheckin[] = rawCheckins
    .filter((c): c is RawBackupCheckinSource =>
      Boolean(
        c && typeof c.day === 'number' && Number.isInteger(c.day) && c.day >= 1 && c.day <= 366,
      ),
    )
    .map((c) => {
      const status: CheckinStatus = isCheckinStatus(c.status)
        ? c.status
        : c.done
          ? 'voted'
          : 'missed'
      const emotion: EmotionKey | null = isEmotionKey(c.emotion) ? c.emotion : null
      const note = cleanNullableString(c.note, 500)
      return {
        day: c.day,
        status,
        emotion,
        note,
      }
    })
    .sort((a, b) => a.day - b.day)

  return {
    format: HABIT_BACKUP_FORMAT,
    version: HABIT_BACKUP_VERSION,
    exportedAt,
    plan: {
      identityStatement: cleanNullableString(plan?.identityStatement, 500),
      rhythmDays: rawRhythm.length > 0 ? rawRhythm : null,
      anchorHabit: cleanNullableString(plan?.anchorHabit, 120),
      twoMinuteAction: cleanNullableString(plan?.twoMinuteAction, 200),
      privateReason: cleanNullableString(plan?.privateReason, 1000),
      companionName: cleanNullableString(plan?.companionName, 100),
      chosenTechniques,
      startDate,
      journeyDays,
    },
    checkins: cleanCheckins,
    reflections: Array.isArray(options?.reflections) ? options.reflections : [],
  }
}

/**
 * Chuyển bản sao lưu thành chuỗi JSON định dạng đẹp.
 */
export function serializeHabitBackup(
  plan: RawBackupPlanSource | null | undefined,
  checkins: RawBackupCheckinSource[] | null | undefined,
  options?: {
    exportedAt?: string | Date
    reflections?: HabitBackupReflection[]
  },
): string {
  return JSON.stringify(buildHabitBackup(plan, checkins, options), null, 2)
}

export type ParseHabitBackupResult =
  | {
      success: true
      data: HabitBackupData
    }
  | {
      success: false
      error:
        | 'FILE_TOO_LARGE'
        | 'INVALID_JSON'
        | 'INVALID_FORMAT'
        | 'UNSUPPORTED_VERSION'
        | 'INVALID_SCHEMA'
      message: string
    }

/**
 * Đọc và kiểm tra file sao lưu JSON theo schema Zod và giới hạn dung lượng 200 KB.
 */
export function parseHabitBackup(rawInput: string | Uint8Array): ParseHabitBackupResult {
  const byteLength =
    typeof rawInput === 'string'
      ? new TextEncoder().encode(rawInput).byteLength
      : rawInput.byteLength

  if (byteLength > MAX_BACKUP_BYTES) {
    return {
      success: false,
      error: 'FILE_TOO_LARGE',
      message: vi.hb13.errors.fileTooLarge,
    }
  }

  const text = typeof rawInput === 'string' ? rawInput : new TextDecoder('utf-8').decode(rawInput)

  let rawObj: unknown
  try {
    rawObj = JSON.parse(text)
  } catch {
    return {
      success: false,
      error: 'INVALID_JSON',
      message: vi.hb13.errors.invalidJson,
    }
  }

  if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
    return {
      success: false,
      error: 'INVALID_FORMAT',
      message: vi.hb13.errors.invalidFormat,
    }
  }

  const candidate = rawObj as Record<string, unknown>
  if (candidate.format !== HABIT_BACKUP_FORMAT) {
    return {
      success: false,
      error: 'INVALID_FORMAT',
      message: vi.hb13.errors.invalidFormat,
    }
  }

  if (candidate.version !== HABIT_BACKUP_VERSION) {
    return {
      success: false,
      error: 'UNSUPPORTED_VERSION',
      message: vi.hb13.errors.unsupportedVersion,
    }
  }

  const parsed = habitBackupSchema.safeParse(rawObj)
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_SCHEMA',
      message: parsed.error.issues[0]?.message || vi.hb13.errors.invalidSchema,
    }
  }

  return {
    success: true,
    data: parsed.data,
  }
}

/**
 * Chống CSV injection (ô bắt đầu bằng =, +, -, @ thì thêm dấu nháy đơn ')
 * và bọc dấu ngoặc kép theo chuẩn RFC 4180.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str = String(value)
  if (str.length === 0) return ''

  // Chống CSV formula injection khi mở bằng Excel / LibreOffice Calc
  if (/^[\s]*[=+\-@]/.test(str)) {
    str = `'${str}`
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function toPlanLike(plan: RawBackupPlanSource | null | undefined) {
  if (!plan) return null
  return {
    startDate: plan.startDate ?? null,
    journeyDays: plan.journeyDays ?? null,
    rhythmDays: Array.isArray(plan.rhythmDays) ? [...plan.rhythmDays] : null,
  }
}

/**
 * Tạo nội dung file CSV cho toàn bộ hành trình (mặc định 28 ngày),
 * có BOM UTF-8 (\uFEFF) ở đầu để Excel / LibreOffice đọc đúng dấu tiếng Việt.
 */
export function buildHabitCsv(
  plan: RawBackupPlanSource | null | undefined,
  checkins: RawBackupCheckinSource[] | null | undefined,
  options?: { today?: Date | string },
): string {
  const planLike = toPlanLike(plan)
  const journeyDays = getJourneyDays(planLike)
  const today = options?.today ?? new Date()
  const checkinMap = new Map<number, RawBackupCheckinSource>()

  for (const c of checkins ?? []) {
    if (c && typeof c.day === 'number') {
      checkinMap.set(c.day, c)
    }
  }

  const headerLine = vi.hb13.csv.headers.map((h) => escapeCsvCell(h)).join(',')
  const lines: string[] = [headerLine]

  for (let day = 1; day <= journeyDays; day++) {
    const entry = checkinMap.get(day)
    const dateStr = planDayDate(plan?.startDate, day)?.full ?? ''

    const state = getDayState(planLike, checkins, day, today)
    const statusLabel = vi.hb11.status[state]

    const emotionLabel = entry?.emotion ? (getEmotion(entry.emotion)?.label ?? '') : ''
    const noteText = entry?.note ?? ''

    const row = [
      escapeCsvCell(day),
      escapeCsvCell(dateStr),
      escapeCsvCell(statusLabel),
      escapeCsvCell(emotionLabel),
      escapeCsvCell(noteText),
    ].join(',')

    lines.push(row)
  }

  const utf8Bom = String.fromCharCode(0xfeff)
  return `${utf8Bom}${lines.join('\r\n')}`
}

/**
 * Tạo đoạn chữ tóm tắt hành trình để khách dán gửi Coach.
 * Không bao giờ lộ `privateReason` hoặc suy ngẫm.
 * Chỉ kèm ghi chú check-in khi `options.includeNotes === true`.
 */
export function buildCoachSummary(
  plan: RawBackupPlanSource | null | undefined,
  checkins: RawBackupCheckinSource[] | null | undefined,
  options?: {
    includeNotes?: boolean
    today?: Date | string
  },
): string {
  const planLike = toPlanLike(plan)
  const journeyDays = getJourneyDays(planLike)
  const today = options?.today ?? new Date()
  const includeNotes = Boolean(options?.includeNotes)

  const identity = plan?.identityStatement?.trim() || vi.hb13.coach.datesUnknown

  const rawRhythm = Array.isArray(plan?.rhythmDays) ? plan.rhythmDays.filter(isWeekday) : []
  const rhythmText =
    rawRhythm.length === 0 || rawRhythm.length === 7
      ? vi.hb13.coach.rhythmAllDays
      : `${rawRhythm.map((d) => vi.hb10.weekdaysShort[d]).join(', ')} (${rawRhythm.length}/7 ngày)`

  const startFull = planDayDate(plan?.startDate, 1)?.full
  const finishFull = planDayDate(plan?.startDate, journeyDays)?.full
  const datesLine =
    startFull && finishFull
      ? vi.hb13.coach.datesLine(startFull, finishFull)
      : vi.hb13.coach.datesLine(vi.hb13.coach.datesUnknown, vi.hb13.coach.datesUnknown)

  const votedCount = countCompletedVotingDays(planLike, checkins)
  const votingDaysTotal = getVotingDays(planLike).length
  const streak = currentStreak(planLike, checkins, today)

  const normalizedForStats = (checkins ?? []).map((c) => {
    const status = isCheckinStatus(c.status) ? c.status : c.done ? 'voted' : 'missed'
    return {
      done: status === 'voted' || status === 'minimal',
      emotion: c.emotion ?? null,
    }
  })
  const stats = calculateTrackerStats(normalizedForStats)

  const emotionLine = stats.mostFrequentEmotion
    ? vi.hb13.coach.topEmotionLine(
        stats.mostFrequentEmotion.label,
        stats.mostFrequentEmotion.emoji,
        stats.mostFrequentEmotion.count,
      )
    : vi.hb13.coach.noEmotionLine

  const lines: string[] = [
    vi.hb13.coach.heading,
    vi.hb13.coach.identityLine(identity),
    vi.hb13.coach.rhythmLine(rhythmText),
    datesLine,
    vi.hb13.coach.progressLine(votedCount, votingDaysTotal, journeyDays),
    vi.hb13.coach.streakLine(streak),
    emotionLine,
  ]

  if (includeNotes) {
    const notesWithDay = (checkins ?? [])
      .filter((c): c is RawBackupCheckinSource & { note: string } =>
        Boolean(
          c &&
          typeof c.day === 'number' &&
          c.day >= 1 &&
          c.day <= journeyDays &&
          typeof c.note === 'string' &&
          c.note.trim().length > 0,
        ),
      )
      .sort((a, b) => a.day - b.day)

    if (notesWithDay.length > 0) {
      lines.push(vi.hb13.coach.notesHeading)
      for (const item of notesWithDay) {
        const dayDate = planDayDate(plan?.startDate, item.day)?.short ?? ''
        lines.push(vi.hb13.coach.noteItem(item.day, dayDate, item.note.trim()))
      }
    }
  }

  return lines.join('\n')
}

export function getBackupFilename(now: Date = new Date()): string {
  return `tram-dung-cam-xuc-habit-${getVietnamYmd(now)}.json`
}

export function getCsvFilename(now: Date = new Date()): string {
  return `tram-dung-cam-xuc-habit-${getVietnamYmd(now)}.csv`
}
