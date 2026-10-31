'use server'

import { getPayload, ValidationError } from 'payload'
import { revalidatePath } from 'next/cache'
import config from '@/payload.config'
import type { HabitCheckin, HabitPlan, Product, Technique } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { vi } from '@/lib/i18n/vi'
import { HABIT_LOOP_PATH } from '@/lib/habit'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { findOwnTrackerPlan } from './tracker.server'
import { getJourneyDays, type CheckinStatus } from './rhythm'
import { getCurrentDayOfPlan, planDayDate } from './tracker-stats'
import { markHabitRestart } from './restart-marker.server'
import {
  buildCoachSummary,
  buildHabitBackup,
  buildHabitCsv,
  getBackupFilename,
  getCsvFilename,
  MAX_BACKUP_BYTES,
  parseHabitBackup,
  type HabitBackupData,
} from './backup'

export interface ExportBackupResult {
  success: boolean
  error?: string
  message?: string
  filename?: string
  json?: string
  data?: HabitBackupData
}

export interface ExportCsvResult {
  success: boolean
  error?: string
  message?: string
  filename?: string
  csv?: string
}

export interface RestoredCheckinSnapshot {
  day: number
  done: boolean
  status: CheckinStatus
  emotion: string | null
  note: string | null
}

export interface RestoreBackupResult {
  success: boolean
  error?: string
  message?: string
  restored: number
  skipped: number
  reasons: string[]
  checkins?: RestoredCheckinSnapshot[]
}

export interface CopyForCoachResult {
  success: boolean
  error?: string
  message?: string
  text?: string
}

export interface RestartJourneyResult {
  success: boolean
  error?: string
  message?: string
  redirectTo?: string
  previousPlanId?: number
}

function getPlanCustomerId(plan: HabitPlan): number {
  return typeof plan.customer === 'object' && plan.customer !== null
    ? plan.customer.id
    : Number(plan.customer)
}

async function extractBackupBytesOrText(
  input: unknown,
): Promise<
  | { ok: true; payload: string | Uint8Array }
  | { ok: false; error: 'FILE_TOO_LARGE' | 'INVALID_JSON'; message: string }
> {
  if (typeof input === 'string') {
    const byteLen = new TextEncoder().encode(input).byteLength
    if (byteLen > MAX_BACKUP_BYTES) {
      return { ok: false, error: 'FILE_TOO_LARGE', message: vi.hb13.errors.fileTooLarge }
    }
    return { ok: true, payload: input }
  }

  if (input instanceof Uint8Array) {
    if (input.byteLength > MAX_BACKUP_BYTES) {
      return { ok: false, error: 'FILE_TOO_LARGE', message: vi.hb13.errors.fileTooLarge }
    }
    return { ok: true, payload: input }
  }

  if (typeof FormData !== 'undefined' && input instanceof FormData) {
    const entry = input.get('file')
    return extractBackupBytesOrText(entry)
  }

  if (
    input &&
    typeof input === 'object' &&
    'arrayBuffer' in input &&
    typeof (input as Blob).arrayBuffer === 'function'
  ) {
    const blob = input as Blob
    if (typeof blob.size === 'number' && blob.size > MAX_BACKUP_BYTES) {
      return { ok: false, error: 'FILE_TOO_LARGE', message: vi.hb13.errors.fileTooLarge }
    }
    const buf = new Uint8Array(await blob.arrayBuffer())
    if (buf.byteLength > MAX_BACKUP_BYTES) {
      return { ok: false, error: 'FILE_TOO_LARGE', message: vi.hb13.errors.fileTooLarge }
    }
    return { ok: true, payload: buf }
  }

  if (input && typeof input === 'object') {
    try {
      const serialized = JSON.stringify(input)
      const byteLen = new TextEncoder().encode(serialized).byteLength
      if (byteLen > MAX_BACKUP_BYTES) {
        return { ok: false, error: 'FILE_TOO_LARGE', message: vi.hb13.errors.fileTooLarge }
      }
      return { ok: true, payload: serialized }
    } catch {
      return { ok: false, error: 'INVALID_JSON', message: vi.hb13.errors.invalidJson }
    }
  }

  return { ok: false, error: 'INVALID_JSON', message: vi.hb13.errors.invalidJson }
}

/**
 * Xuất bản sao lưu JSON cho kế hoạch hiện tại của chính khách hàng.
 * Cho phép tải về ngay cả khi quyền dùng thử đã hết hạn (HB-13).
 */
export async function exportBackup(): Promise<ExportBackupResult> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.hb13.errors.unauthorized,
    }
  }

  const payload = await getPayload({ config: await config })
  const plan = await findOwnTrackerPlan(customer.id, payload)
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.hb13.errors.planNotFound,
    }
  }

  if (getPlanCustomerId(plan) !== customer.id) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: vi.hb13.errors.forbidden,
    }
  }

  const journeyDays = getJourneyDays(plan)
  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: Math.max(366, journeyDays),
    depth: 0,
    overrideAccess: true,
  })

  const now = new Date()
  let reflectionsData: any[] = []
  try {
    const reflectionsRes = await payload.find({
      collection: 'habitReflections',
      where: {
        plan: { equals: plan.id },
      },
      limit: 10,
      depth: 0,
      overrideAccess: true,
    })
    reflectionsData = (reflectionsRes.docs || []).map((doc: any) => ({
      stationIndex: Number(doc.stationIndex),
      answers: (doc.answers || []).map((a: any) => ({
        question: a.question,
        answer: a.answer || '',
      })),
      updatedAt: doc.updatedAt,
    }))
  } catch (_e) {}

  const data = buildHabitBackup(plan, checkinsRes.docs as HabitCheckin[], {
    exportedAt: now,
    reflections: reflectionsData,
  })
  const json = JSON.stringify(data, null, 2)
  const filename = getBackupFilename(now)

  return {
    success: true,
    filename,
    json,
    data,
  }
}

/**
 * Xuất bảng CSV hành trình (mặc định 28 ngày) cho kế hoạch hiện tại của chính khách hàng.
 * Có BOM UTF-8 để Excel / LibreOffice đọc đúng dấu và chống CSV injection.
 */
export async function exportCsv(): Promise<ExportCsvResult> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.hb13.errors.unauthorized,
    }
  }

  const payload = await getPayload({ config: await config })
  const plan = await findOwnTrackerPlan(customer.id, payload)
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.hb13.errors.planNotFound,
    }
  }

  if (getPlanCustomerId(plan) !== customer.id) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: vi.hb13.errors.forbidden,
    }
  }

  const journeyDays = getJourneyDays(plan)
  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: Math.max(366, journeyDays),
    depth: 0,
    overrideAccess: true,
  })

  const now = new Date()
  let reflectionsData: any[] = []
  try {
    const reflectionsRes = await payload.find({
      collection: 'habitReflections',
      where: {
        plan: { equals: plan.id },
      },
      limit: 10,
      depth: 0,
      overrideAccess: true,
    })
    reflectionsData = (reflectionsRes.docs || []).map((doc: any) => ({
      stationIndex: Number(doc.stationIndex),
      answers: (doc.answers || []).map((a: any) => ({
        question: a.question,
        answer: a.answer || '',
      })),
      updatedAt: doc.updatedAt,
    }))
  } catch (_e) {}

  const csv = buildHabitCsv(plan, checkinsRes.docs as HabitCheckin[], {
    today: now,
    reflections: reflectionsData,
  })
  const filename = getCsvFilename(now)

  return {
    success: true,
    filename,
    csv,
  }
}

/**
 * // REVIEW-REQUIRED: Khôi phục dữ liệu kế hoạch và check-in từ file sao lưu JSON của khách hàng (HB-13).
 *
 * Kiểm soát bảo mật & toàn vẹn dữ liệu:
 * 1. Lấy khách hàng trực tiếp từ phiên đăng nhập (getCurrentCustomer).
 * 2. Kiểm tra quyền sử dụng công cụ số còn hiệu lực (trial còn hạn hoặc active).
 * 3. Giới hạn kích thước file <= 200 KB và kiểm tra toàn bộ cấu trúc qua Zod (habitBackupSchema).
 * 4. Chỉ ghi vào kế hoạch hiện tại thuộc sở hữu của chính khách hàng (chặn ghi chéo sang kế hoạch khách khác).
 * 5. Không bao giờ thay đổi `startDate` và `journeyDays` của kế hoạch hiện tại; nếu file khác thì giữ nguyên và báo lại.
 * 6. Chạy qua toàn bộ các hook bảo vệ của `habitPlans` (`lockRhythmDaysAfterCheckins`) và `habitCheckins`
 *    (`verifyPlanOwnership`, `validatePlanJourneyDay`, `validateStatusForRhythm`, `syncDoneFromStatus`).
 * 7. Đếm chính xác số dòng khôi phục (`restored`), số dòng bị bỏ qua (`skipped`) và danh sách lý do (`reasons`).
 */
export async function restoreBackup(
  fileInput: unknown,
  options?: { planId?: number },
): Promise<RestoreBackupResult> {
  // REVIEW-REQUIRED: Xác thực khách hàng từ phiên đăng nhập
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.hb13.errors.unauthorized,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  // REVIEW-REQUIRED: Kiểm tra dung lượng và schema Zod trước khi chạm DB
  const extracted = await extractBackupBytesOrText(fileInput)
  if (!extracted.ok) {
    return {
      success: false,
      error: extracted.error,
      message: extracted.message,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  const parsed = parseHabitBackup(extracted.payload)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      message: parsed.message,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  const backup = parsed.data
  const payload = await getPayload({ config: await config })

  // REVIEW-REQUIRED: Kiểm tra quyền truy cập còn hạn
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })
  const product = products.docs[0] as Product | undefined
  if (!product) {
    return {
      success: false,
      error: 'PRODUCT_NOT_FOUND',
      message: vi.tracker.actions.productNotFound,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  const now = new Date()
  const access = await getAccess(customer.id, product.id, { payload, now })
  if (!access.hasAccess) {
    return {
      success: false,
      error: 'ACCESS_DENIED',
      message: vi.hb13.errors.accessDenied,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  // REVIEW-REQUIRED: Chỉ ghi vào kế hoạch hiện tại của chính khách hàng; chặn truy cập chéo kế hoạch
  let plan: HabitPlan | null = null
  if (typeof options?.planId === 'number') {
    try {
      const candidate = (await payload.findByID({
        collection: 'habitPlans',
        id: options.planId,
        depth: 1,
        overrideAccess: true,
      })) as HabitPlan | null
      if (!candidate) {
        return {
          success: false,
          error: 'PLAN_NOT_FOUND',
          message: vi.hb13.errors.planNotFound,
          restored: 0,
          skipped: 0,
          reasons: [],
        }
      }
      if (getPlanCustomerId(candidate) !== customer.id) {
        return {
          success: false,
          error: 'FORBIDDEN',
          message: vi.hb13.errors.forbidden,
          restored: 0,
          skipped: 0,
          reasons: [],
        }
      }
      plan = candidate
    } catch {
      return {
        success: false,
        error: 'PLAN_NOT_FOUND',
        message: vi.hb13.errors.planNotFound,
        restored: 0,
        skipped: 0,
        reasons: [],
      }
    }
  } else {
    plan = await findOwnTrackerPlan(customer.id, payload)
  }

  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.hb13.errors.planNotFound,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  if (getPlanCustomerId(plan) !== customer.id) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: vi.hb13.errors.forbidden,
      restored: 0,
      skipped: 0,
      reasons: [],
    }
  }

  const reasons: string[] = []
  const currentJourneyDays = getJourneyDays(plan)
  const currentDay = getCurrentDayOfPlan(plan.startDate, now)
  const currentStartFull = planDayDate(plan.startDate, 1)?.full ?? null
  const backupStartFull =
    planDayDate(backup.plan.startDate, 1)?.full ?? backup.plan.startDate ?? null

  if (backupStartFull && currentStartFull && backupStartFull !== currentStartFull) {
    reasons.push(vi.hb13.errors.startDateKeptNotice(backupStartFull, currentStartFull))
  }

  if (
    typeof backup.plan.journeyDays === 'number' &&
    backup.plan.journeyDays !== currentJourneyDays
  ) {
    reasons.push(vi.hb13.errors.journeyDaysKeptNotice(backup.plan.journeyDays, currentJourneyDays))
  }

  // Đọc các check-in hiện có của kế hoạch trước khi cập nhật
  const existingCheckinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: Math.max(366, currentJourneyDays),
    depth: 0,
    overrideAccess: true,
  })
  const existingCheckins = existingCheckinsRes.docs as HabitCheckin[]
  const existingByDay = new Map<number, HabitCheckin>()
  for (const c of existingCheckins) {
    existingByDay.set(c.day, c)
  }

  // Kiểm tra xem rhythmDays có bị khóa bởi hook lockRhythmDaysAfterCheckins không
  const currentRhythm = Array.isArray(plan.rhythmDays) ? plan.rhythmDays : []
  const backupRhythm = Array.isArray(backup.plan.rhythmDays) ? backup.plan.rhythmDays : null
  if (
    existingCheckins.length > 0 &&
    backupRhythm &&
    JSON.stringify([...currentRhythm].sort()) !== JSON.stringify([...backupRhythm].sort())
  ) {
    reasons.push(vi.hb13.errors.rhythmLockedNotice)
  }

  // Đối chiếu tên kỹ thuật trong bản sao lưu với danh sách kỹ thuật đã xuất bản
  let resolvedTechniques: { technique?: number; action: string }[] | undefined
  if (backup.plan.chosenTechniques.length > 0) {
    const publishedTechsRes = await payload.find({
      collection: 'techniques',
      where: { _status: { equals: 'published' } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    const techByName = new Map<string, Technique>()
    for (const doc of publishedTechsRes.docs as Technique[]) {
      if (doc.name) {
        techByName.set(doc.name.trim().toLowerCase(), doc)
      }
    }

    resolvedTechniques = backup.plan.chosenTechniques.map((item) => {
      const matched = item.name ? techByName.get(item.name.trim().toLowerCase()) : undefined
      return {
        ...(matched ? { technique: matched.id } : {}),
        action: item.action,
      }
    })
  }

  // REVIEW-REQUIRED: Cập nhật các field khách được phép sửa trên kế hoạch (không truyền startDate và journeyDays;
  // chạy với user: customer, overrideAccess: false để kích hoạt field access + lockRhythmDaysAfterCheckins).
  const planUpdateData: Record<string, unknown> = {
    anchorHabit: backup.plan.anchorHabit,
    twoMinuteAction: backup.plan.twoMinuteAction,
    privateReason: backup.plan.privateReason,
    companionName: backup.plan.companionName,
  }
  if (backup.plan.identityStatement) {
    planUpdateData.identityStatement = backup.plan.identityStatement
  }
  if (backupRhythm && backupRhythm.length > 0) {
    planUpdateData.rhythmDays = backupRhythm
  }
  if (resolvedTechniques) {
    planUpdateData.chosenTechniques = resolvedTechniques
  }

  await payload.update({
    collection: 'habitPlans',
    id: plan.id,
    data: planUpdateData,
    user: customer,
    overrideAccess: false,
    depth: 0,
  })

  // REVIEW-REQUIRED: Khôi phục từng dòng check-in trong phạm vi journeyDays thông qua các hook của habitCheckins
  let restored = 0
  let skipped = 0
  const seenDays = new Set<number>()

  for (const item of backup.checkins) {
    if (seenDays.has(item.day)) {
      skipped++
      reasons.push(vi.hb13.errors.duplicateDaySkipped(item.day))
      continue
    }
    seenDays.add(item.day)

    if (item.day < 1 || item.day > currentJourneyDays) {
      skipped++
      reasons.push(vi.hb13.errors.dayOutOfRange(item.day, currentJourneyDays))
      continue
    }

    // REVIEW-REQUIRED (HB-13c): same rule as the tracker check-in – no check-in for a day that has not
    // come yet (Vietnam time), so a file cannot pre-fill future days of the journey.
    if (item.day > currentDay) {
      skipped++
      reasons.push(vi.hb13.errors.futureDaySkipped(item.day))
      continue
    }

    const done = item.status === 'voted' || item.status === 'minimal'
    const existing = existingByDay.get(item.day)

    try {
      if (existing) {
        const updatedDoc = (await payload.update({
          collection: 'habitCheckins',
          id: existing.id,
          data: {
            status: item.status,
            done,
            emotion: item.emotion,
            note: item.note,
          },
          user: customer,
          overrideAccess: true,
        })) as HabitCheckin
        existingByDay.set(item.day, updatedDoc)
      } else {
        try {
          const createdDoc = (await payload.create({
            collection: 'habitCheckins',
            data: {
              plan: plan.id,
              day: item.day,
              status: item.status,
              done,
              emotion: item.emotion,
              note: item.note,
            },
            user: customer,
            overrideAccess: true,
          })) as HabitCheckin
          existingByDay.set(item.day, createdDoc)
        } catch (createErr) {
          const isValidationErr =
            createErr instanceof ValidationError ||
            (createErr as { name?: string })?.name === 'ValidationError'

          if (isValidationErr) {
            const raceExisting = await payload.find({
              collection: 'habitCheckins',
              where: {
                and: [{ plan: { equals: plan.id } }, { day: { equals: item.day } }],
              },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })

            if (raceExisting.docs.length > 0) {
              const updatedDoc = (await payload.update({
                collection: 'habitCheckins',
                id: raceExisting.docs[0].id,
                data: {
                  status: item.status,
                  done,
                  emotion: item.emotion,
                  note: item.note,
                },
                user: customer,
                overrideAccess: true,
              })) as HabitCheckin
              existingByDay.set(item.day, updatedDoc)
            } else {
              throw createErr
            }
          } else {
            throw createErr
          }
        }
      }
      restored++
    } catch (err) {
      skipped++
      const msg =
        err instanceof Error && err.message
          ? `Ngày ${item.day}: ${err.message}`
          : vi.hb13.errors.restOnVotingDaySkipped(item.day)
      reasons.push(msg)
    }
  }

  const finalCheckinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: Math.max(366, currentJourneyDays),
    depth: 0,
    overrideAccess: true,
  })

  const finalCheckins: RestoredCheckinSnapshot[] = (finalCheckinsRes.docs as HabitCheckin[]).map(
    (doc) => ({
      day: doc.day,
      done: Boolean(doc.done),
      status: doc.status || (doc.done ? 'voted' : 'missed'),
      emotion: doc.emotion || null,
      note: doc.note || null,
    }),
  )

  // 9. Khôi phục suy ngẫm cuối trạm (HB-12)
  if (Array.isArray(backup.reflections) && backup.reflections.length > 0) {
    for (const ref of backup.reflections) {
      if (typeof ref.stationIndex !== 'number' || !Array.isArray(ref.answers)) continue
      const validAnswers = ref.answers
        .filter((a) => a && typeof a.question === 'string')
        .map((a) => ({
          question: a.question.trim(),
          answer: (a.answer || '').trim(),
        }))
      if (validAnswers.length === 0) continue

      try {
        const existingRefRes = await payload.find({
          collection: 'habitReflections',
          where: {
            and: [{ plan: { equals: plan.id } }, { stationIndex: { equals: ref.stationIndex } }],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })

        if (existingRefRes.docs.length > 0) {
          await payload.update({
            collection: 'habitReflections',
            id: existingRefRes.docs[0].id,
            data: {
              answers: validAnswers,
            },
            overrideAccess: true,
          })
        } else {
          await payload.create({
            collection: 'habitReflections',
            data: {
              customer: customer.id,
              plan: plan.id,
              stationIndex: ref.stationIndex,
              answers: validAnswers,
            },
            overrideAccess: true,
          })
        }
      } catch (refErr) {
        console.error('Failed to restore habit reflection:', refErr)
      }
    }
  }

  try {
    revalidatePath('/habit/tracker')
  } catch {
    // Bỏ qua khi gọi ngoài ngữ cảnh request Next.js (VD: trong Vitest)
  }

  return {
    success: true,
    restored,
    skipped,
    reasons,
    checkins: finalCheckins,
  }
}

/**
 * Tạo đoạn chữ ngắn tóm tắt kết quả để khách sao chép gửi Coach (HB-13).
 * Không bao giờ lộ `privateReason` hoặc suy ngẫm; chỉ kèm ghi chú khi khách tự chọn `includeNotes`.
 */
export async function copyForCoach(options?: {
  includeNotes?: boolean
}): Promise<CopyForCoachResult> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.hb13.errors.unauthorized,
    }
  }

  const payload = await getPayload({ config: await config })
  const plan = await findOwnTrackerPlan(customer.id, payload)
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.hb13.errors.planNotFound,
    }
  }

  if (getPlanCustomerId(plan) !== customer.id) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: vi.hb13.errors.forbidden,
    }
  }

  const journeyDays = getJourneyDays(plan)
  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: Math.max(366, journeyDays),
    depth: 0,
    overrideAccess: true,
  })

  const text = buildCoachSummary(plan, checkinsRes.docs as HabitCheckin[], {
    includeNotes: Boolean(options?.includeNotes),
    today: new Date(),
  })

  return {
    success: true,
    text,
  }
}

/**
 * Bắt đầu lại hành trình (HB-13):
 * - Giữ nguyên kế hoạch cũ và toàn bộ dữ liệu check-in trong DB (không xóa).
 * - Kiểm tra quyền sử dụng công cụ số còn hiệu lực.
 * - Phía client xóa nháp wizard trong localStorage và đưa khách về `/habit/5-phut`.
 * - Khi kế hoạch mới lưu xong, `getOrCreateTrackerPlan` / `findOwnTrackerPlan` tự động chọn kế hoạch mới nhất làm kế hoạch hiện tại.
 */
export async function restartJourney(): Promise<RestartJourneyResult> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.hb13.errors.unauthorized,
    }
  }

  const payload = await getPayload({ config: await config })
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })
  const product = products.docs[0] as Product | undefined
  if (!product) {
    return {
      success: false,
      error: 'PRODUCT_NOT_FOUND',
      message: vi.tracker.actions.productNotFound,
    }
  }

  const access = await getAccess(customer.id, product.id, { payload, now: new Date() })
  if (!access.hasAccess) {
    return {
      success: false,
      error: 'ACCESS_DENIED',
      message: vi.hb13.errors.accessDenied,
    }
  }

  const plan = await findOwnTrackerPlan(customer.id, payload)
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.hb13.errors.planNotFound,
    }
  }

  // REVIEW-REQUIRED (HB-13c): mark the restart in this browser only; the tracker adopts a newer
  // wizard plan (saved by unverified leadEmail) only while this marker is valid.
  await markHabitRestart()

  return {
    success: true,
    redirectTo: HABIT_LOOP_PATH,
    previousPlanId: plan.id,
  }
}
