import { z } from 'zod'
import { vi } from '../i18n/vi'

/**
 * Chuyển đổi ngày và giờ theo giờ Việt Nam (ICT, UTC+7) thành chuỗi ISO UTC để lưu vào database.
 * Ví dụ: dateStr = "2026-10-25", timeStr = "02:00" -> "2026-10-24T19:00:00.000Z".
 * Trả về null nếu không hợp lệ.
 */
export function vietnamTimeToUtcIso(
  dateStr: string | null | undefined,
  timeStr: string | null | undefined,
): string | null {
  if (!dateStr || !timeStr) return null
  const cleanDate = dateStr.trim()
  const cleanTime = timeStr.trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) || !/^\d{2}:\d{2}$/.test(cleanTime)) {
    return null
  }

  const isoWithIctOffset = `${cleanDate}T${cleanTime}:00+07:00`
  const dateObj = new Date(isoWithIctOffset)

  if (Number.isNaN(dateObj.getTime())) {
    return null
  }

  return dateObj.toISOString()
}

/**
 * Chuyển đổi chuỗi ISO UTC từ database thành ngày và giờ hiển thị theo giờ Việt Nam (ICT, UTC+7).
 * Hoạt động độc lập hoàn toàn với timezone của máy tính/server.
 */
export function utcIsoToVietnamDateTime(isoStr: string | null | undefined): {
  date: string
  time: string
  formatted: string
  utcEquivalent: string
} | null {
  if (!isoStr) return null
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return null

  // Dịch thời gian 7 giờ (ICT = UTC + 7)
  const ictMs = d.getTime() + 7 * 60 * 60 * 1000
  const ictDate = new Date(ictMs)

  const yyyy = ictDate.getUTCFullYear()
  const mm = String(ictDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(ictDate.getUTCDate()).padStart(2, '0')
  const hours = String(ictDate.getUTCHours()).padStart(2, '0')
  const mins = String(ictDate.getUTCMinutes()).padStart(2, '0')

  const dateFormatted = `${yyyy}-${mm}-${dd}`
  const timeFormatted = `${hours}:${mins}`
  const displayFormatted = `${hours}:${mins} ngày ${dd}/${mm}/${yyyy} (Giờ VN - UTC+7)`
  const utcEquivalent = `${d.toISOString().replace('.000Z', 'Z')} UTC`

  return {
    date: dateFormatted,
    time: timeFormatted,
    formatted: displayFormatted,
    utcEquivalent,
  }
}

/**
 * Định dạng chuỗi hiển thị thân thiện cho email hoặc giao diện từ ngày và giờ ICT.
 */
export function formatVietnamDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts
    return `${timeStr} ngày ${dd}/${mm}/${yyyy} (Giờ Việt Nam - ICT UTC+7)`
  }
  return `${timeStr} ${dateStr} (ICT UTC+7)`
}

export const workshopWizardSchema = z.object({
  audienceProductIds: z
    .array(z.union([z.number(), z.string()]))
    .min(1, vi.cms.workshopWizard.errors.missingAudience),
  title: z
    .string()
    .trim()
    .min(1, vi.cms.workshopWizard.errors.missingTitle)
    .max(200, 'Tên workshop không được vượt quá 200 ký tự'),
  vnDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, vi.cms.workshopWizard.errors.missingDate),
  vnTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, vi.cms.workshopWizard.errors.missingTime),
  joinUrl: z
    .string()
    .trim()
    .min(1, vi.cms.workshopWizard.errors.invalidJoinUrl)
    .refine(
      (val) => {
        try {
          const parsed = new URL(val)
          return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        } catch {
          return false
        }
      },
      { message: vi.cms.workshopWizard.errors.invalidJoinUrl },
    ),
})

export type WorkshopWizardInput = z.infer<typeof workshopWizardSchema>

export interface ValidateWorkshopWizardResult {
  success: boolean
  data?: {
    audienceProductIds: (number | string)[]
    title: string
    startsAtUtcIso: string
    joinUrl: string
    vnDate: string
    vnTime: string
  }
  errors?: Record<string, string>
  message?: string
}

export function validateWorkshopWizardData(raw: unknown): ValidateWorkshopWizardResult {
  const result = workshopWizardSchema.safeParse(raw)

  if (!result.success) {
    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() || 'general'
      if (!errors[field]) {
        errors[field] = issue.message
      }
    }
    const firstError = Object.values(errors)[0] || vi.cms.workshopWizard.errors.createFailed
    return {
      success: false,
      errors,
      message: firstError,
    }
  }

  const parsed = result.data
  const startsAtUtcIso = vietnamTimeToUtcIso(parsed.vnDate, parsed.vnTime)

  if (!startsAtUtcIso) {
    return {
      success: false,
      errors: { vnDate: vi.cms.workshopWizard.errors.missingDate },
      message: vi.cms.workshopWizard.errors.missingDate,
    }
  }

  return {
    success: true,
    data: {
      audienceProductIds: parsed.audienceProductIds,
      title: parsed.title,
      startsAtUtcIso,
      joinUrl: parsed.joinUrl,
      vnDate: parsed.vnDate,
      vnTime: parsed.vnTime,
    },
  }
}
