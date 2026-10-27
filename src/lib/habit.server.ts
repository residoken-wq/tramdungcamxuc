import 'server-only'
import { sql } from '@payloadcms/db-postgres'
import { ZodError } from 'zod'
import { vi } from './i18n/vi'
import {
  getPayload,
  initTransaction,
  commitTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
  type Where,
} from 'payload'
import type { RequiredDataFromCollectionSlug } from 'payload'
import config from '@/payload.config'
import type { Product, SiteSetting, Technique } from '@/payload-types'
import type { PublicTechnique } from './habit'
import { HABIT_LOOP_PATH } from './habit'
import { HABIT_TRACKER_PRODUCT_SLUG } from './habit/config'
import { resolveProductCta, type ProductCta } from './products'
import { sendHabitPlanEmail } from './email/service.server'
import { habitPlanSubmissionSchema, type HabitPlanSubmissionInput } from './forms/schemas'
import { checkAndRecordRateLimit } from './forms/ratelimit.server'
import { verifyTurnstile } from './forms/turnstile.server'
import type { SubmissionContext, SubmissionOptions } from './forms/submit.server'

export interface HabitPlanSubmissionResult {
  success: boolean
  planId?: number
  zaloGroupUrl?: string
  fake?: boolean
}

export type HabitPlanSubmissionOptions = SubmissionOptions & {
  req?: Partial<PayloadRequest>
  disableTransaction?: boolean
}

export interface HabitProductData {
  id: number | string
  name: string
  slug: string
  price: number | null
  salePrice: number | null
  saleEndsAt?: string | null
  trialDays: number | null
  accessDurationDays?: number | null
  shortDescription?: string | null
  saleStatus: Product['saleStatus']
  includes: string[]
  faq: Array<{ question: string; answer?: string | null }>
  coverImage?: { url?: string | null; alt?: string | null } | null
  cta: ProductCta | null
  videoCount: number
  techniqueCount: number
}

/** Lỗi kỹ thuật dạng ZodError để action trả câu tiếng Việt cho người dùng (không thành lỗi máy chủ). */
function techniqueError(message: string): ZodError {
  return new ZodError([{ code: 'custom', path: ['chosenTechniques'], message }])
}

/** Ngày hôm nay theo giờ Việt Nam (00:00 +07:00): lưu lúc 0h–7h sáng không bị lùi về hôm qua. */
function vietnamTodayIso(now: Date = new Date()): string {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return new Date(`${ymd}T00:00:00+07:00`).toISOString()
}

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

/**
 * Đọc danh sách các kỹ thuật thực hành đã xuất bản từ Payload CMS.
 */
export async function getTechniques(payloadInstance?: Payload): Promise<PublicTechnique[]> {
  try {
    const payload = await resolvePayload(payloadInstance)
    const result = await payload.find({
      collection: 'techniques',
      where: {
        _status: { equals: 'published' },
      },
      sort: 'id',
      limit: 100,
      depth: 0,
      draft: false,
    })

    const techniques: PublicTechnique[] = []
    for (const doc of result.docs) {
      if (
        typeof doc.id === 'number' &&
        typeof doc.name === 'string' &&
        doc.stage &&
        ['cue', 'craving', 'response', 'reward'].includes(doc.stage)
      ) {
        techniques.push({
          id: doc.id,
          name: doc.name,
          stage: doc.stage as PublicTechnique['stage'],
          howTo: doc.howTo,
          example: doc.example,
        })
      }
    }

    return techniques
  } catch (err) {
    console.error('[Habit] Error reading techniques:', err)
    return []
  }
}

/**
 * Đọc thông tin sản phẩm Habit Tracker số (Habit Hack 1% Better) từ CMS.
 * Nếu sản phẩm không tồn tại hoặc có trạng thái hidden -> trả về null (trang offer gọi notFound()).
 */
export async function getHabitProduct(
  payloadInstance?: Payload,
  options?: { draft?: boolean; previewId?: string | number; user?: unknown },
): Promise<HabitProductData | null> {
  const payload = await resolvePayload(payloadInstance)
  const isDraft = Boolean(options?.draft)

  const productWhere = isDraft
    ? options?.previewId
      ? { id: { equals: options.previewId } }
      : { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } }
    : {
        and: [
          { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
          { _status: { equals: 'published' } },
        ],
      }

  const [productRes, lessonCountRes, techniqueCountRes] = await Promise.all([
    payload.find({
      collection: 'products',
      where: productWhere as unknown as Where,
      limit: 1,
      depth: 1,
      draft: isDraft,
      // Draft preview: enforce the admin's access. Public read keeps the previous behaviour
      // (field access such as products.files is admin-only and must not blank the public page).
      ...(isDraft ? { overrideAccess: false, user: options?.user as never } : {}),
    }),
    payload.count({
      collection: 'lessons',
      where: isDraft ? {} : { _status: { equals: 'published' } },
    }),
    payload.count({
      collection: 'techniques',
      where: isDraft ? {} : { _status: { equals: 'published' } },
    }),
  ])

  if (productRes.docs.length === 0) {
    return null
  }

  const doc = productRes.docs[0] as Product

  // Sản phẩm ở trạng thái hidden -> ẩn khỏi trang công khai (theo AGENTS.md), trừ khi xem trước
  if (doc.saleStatus === 'hidden' && !isDraft) {
    return null
  }

  // Trích xuất includes
  const includes: string[] = []
  if (Array.isArray(doc.includes)) {
    for (const item of doc.includes) {
      if (typeof item === 'string') {
        includes.push(item)
      } else if (
        item &&
        typeof item === 'object' &&
        'text' in item &&
        typeof item.text === 'string'
      ) {
        includes.push(item.text)
      }
    }
  }

  // Trích xuất FAQ
  const faq: Array<{ question: string; answer?: string | null }> = []
  if (Array.isArray(doc.faq)) {
    for (const f of doc.faq) {
      if (f && typeof f.question === 'string') {
        faq.push({
          question: f.question,
          answer: f.answer,
        })
      }
    }
  }

  // Trích xuất coverImage
  let coverImage: { url?: string | null; alt?: string | null } | null = null
  if (doc.coverImage && typeof doc.coverImage === 'object') {
    const img = doc.coverImage as unknown as Record<string, unknown>
    coverImage = {
      url: typeof img.url === 'string' ? img.url : null,
      alt: typeof img.alt === 'string' ? img.alt : doc.name,
    }
  }

  // Nút CTA động
  const cta = resolveProductCta(doc)

  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    price: doc.price ?? null,
    salePrice: doc.salePrice ?? null,
    saleEndsAt: doc.saleEndsAt,
    trialDays: doc.trialDays ?? null,
    accessDurationDays: doc.accessDurationDays ?? null,
    shortDescription: doc.shortDescription,
    saleStatus: doc.saleStatus,
    includes,
    faq,
    coverImage,
    cta,
    videoCount: lessonCountRes.totalDocs,
    techniqueCount: techniqueCountRes.totalDocs,
  }
}

/**
 * Xử lý nộp kế hoạch Habit Loop:
 * 1. Kiểm tra honeypot (chống bot).
 * 2. Validate dữ liệu qua Zod (giới hạn ký tự, số lượng).
 * 3. Kiểm tra technique ID có thật và đúng giai đoạn trong collection techniques (không tin client).
 * 4. Nếu người dùng nhập email:
 *    - Xác minh Turnstile, rate limit per-IP.
 *    - Tạo lead trong collection leads (need: 'resource', tag: habit-loop).
 *    - Gửi email xác nhận kế hoạch qua React Email (HabitPlanEmail).
 * 5. Tạo bản ghi trong habitPlans (overrideAccess: true phục vụ server action cho khách).
 * 6. Lấy zaloGroupUrl từ siteSettings trả về cho người dùng.
 */
export async function submitHabitPlan(
  input: HabitPlanSubmissionInput | Record<string, unknown>,
  ctx: SubmissionContext = {},
  options: HabitPlanSubmissionOptions = {},
): Promise<HabitPlanSubmissionResult> {
  // 1. Honeypot check
  if (typeof input === 'object' && input !== null && 'honeypot' in input) {
    const rawHp = String(input.honeypot || '').trim()
    if (rawHp.length > 0) {
      return {
        success: true,
        fake: true,
      }
    }
  }

  // 2. Validate dữ liệu qua Zod
  const validated = habitPlanSubmissionSchema.parse(input)

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      fake: true,
    }
  }

  const payload = await resolvePayload(options.payload)

  const cleanEmail = validated.email?.trim().toLowerCase() || null

  // 4. Luôn xác minh Turnstile và kiểm tra Rate limit (ngay cả khi không có email)
  await verifyTurnstile(validated.turnstileToken, ctx.ip)
  await checkAndRecordRateLimit(payload, {
    form: 'habit-loop',
    ip: ctx.ip,
    email: cleanEmail || undefined,
  })

  // 3. Kiểm tra technique: không trùng lặp, tối đa 2 kỹ thuật mỗi stage, có thật và đúng stage đã xuất bản
  const techniqueIds = validated.chosenTechniques.map((t) => t.techniqueId)
  const uniqueIds = new Set(techniqueIds)
  if (uniqueIds.size !== techniqueIds.length) {
    throw techniqueError(vi.habit.wizard.errors.techniqueDuplicate)
  }

  const stageCounts: Record<string, number> = {}
  for (const item of validated.chosenTechniques) {
    stageCounts[item.stage] = (stageCounts[item.stage] || 0) + 1
  }
  for (const count of Object.values(stageCounts)) {
    if (count > 2) {
      throw techniqueError(vi.habit.wizard.errors.techniquesTooMany)
    }
  }

  const techMap = new Map<number, Technique>()
  if (techniqueIds.length > 0) {
    const foundTechniques = await payload.find({
      collection: 'techniques',
      where: {
        id: { in: techniqueIds },
        _status: { equals: 'published' },
      },
      limit: 100,
      depth: 0,
      draft: false,
    })

    for (const doc of foundTechniques.docs) {
      techMap.set(doc.id, doc as Technique)
    }

    for (const item of validated.chosenTechniques) {
      const tech = techMap.get(item.techniqueId)
      if (!tech) {
        throw techniqueError(vi.habit.wizard.errors.techniqueInvalid)
      }
      if (tech.stage !== item.stage) {
        throw techniqueError(vi.habit.wizard.errors.techniqueInvalid)
      }
    }
  }

  // Đọc link nhóm Zalo từ siteSettings
  let zaloGroupUrl = ''
  try {
    const siteSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })) as SiteSetting | null
    if (siteSettings?.zaloGroupUrl) {
      zaloGroupUrl = siteSettings.zaloGroupUrl
    }
  } catch (err) {
    console.error('[Habit] Error reading siteSettings zaloGroupUrl:', err)
  }

  // Nếu người dùng không nhập email: không lưu gì vào DB (kế hoạch chỉ nằm trong trình duyệt)
  if (!cleanEmail) {
    return {
      success: true,
      zaloGroupUrl,
    }
  }

  // 5. Lưu bản ghi habitPlans và leads trong cùng 1 transaction (T2-17: lead lỗi -> rollback kế hoạch, không có kế hoạch thừa)
  // REVIEW-REQUIRED: Transaction đảm bảo lưu kế hoạch và tạo lead nguyên tử
  const req = {
    ...(options.req as Partial<PayloadRequest>),
    payload: (options.req as Partial<PayloadRequest>)?.payload ?? payload,
  }
  const hasDb = typeof payload?.db?.beginTransaction === 'function'
  const shouldCommit = !options.disableTransaction && hasDb && (await initTransaction(req))
  const cleanName = validated.name?.trim() || undefined

  let habitPlanDoc: { id: number }
  try {
    // T2-17 / T2-18: Cùng email (không phân biệt hoa thường) + cùng câu định danh gửi lại trong 10 phút
    // -> trả về kế hoạch đã có, không tạo thêm kế hoạch / lead, không gửi lại email.
    // Serialize submits for the same email inside this transaction so two parallel clicks
    // cannot both miss the duplicate check (lock released at commit / rollback).
    const txId = await req.transactionID
    const txDb = txId
      ? (
          payload.db as unknown as {
            sessions?: Record<string, { db?: { execute: (q: unknown) => Promise<unknown> } }>
          }
        ).sessions?.[String(txId)]?.db
      : undefined
    if (txDb) {
      await txDb.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${'habit-plan:' + cleanEmail}))`)
    }
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const existing = await payload.find({
      collection: 'habitPlans',
      where: {
        and: [
          { leadEmail: { equals: cleanEmail } },
          { identityStatement: { equals: validated.identityStatement } },
          { createdAt: { greater_than_equal: tenMinutesAgo } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (existing.docs.length > 0) {
      if (shouldCommit) {
        await commitTransaction(req)
      }
      return {
        success: true,
        planId: existing.docs[0].id,
        zaloGroupUrl,
      }
    }

    // REVIEW-REQUIRED: Lưu kế hoạch cho khách chưa đăng nhập (leadEmail) với 4 nhóm field: scorecard.time, anchorHabit, rhythmDays, twoMinuteAction
    const planData: RequiredDataFromCollectionSlug<'habitPlans'> = {
      leadEmail: cleanEmail,
      scorecard: validated.scorecard.map((item) => ({
        habit: item.habit,
        rating: item.rating,
        ...(item.time ? { time: item.time } : {}),
      })),
      identityStatement: validated.identityStatement,
      chosenTechniques: validated.chosenTechniques.map((item) => ({
        technique: item.techniqueId,
        action: item.action,
      })),
      startDate: vietnamTodayIso(),
    }
    if (validated.anchorHabit) {
      planData.anchorHabit = validated.anchorHabit
    }
    if (validated.rhythmDays && validated.rhythmDays.length > 0) {
      planData.rhythmDays = validated.rhythmDays
    }
    if (validated.twoMinuteAction) {
      planData.twoMinuteAction = validated.twoMinuteAction
    }

    habitPlanDoc = (await payload.create({
      collection: 'habitPlans',
      data: planData,
      overrideAccess: true, // overrideAccess cho phép server action lưu kế hoạch của học viên chưa đăng nhập
      req,
    })) as { id: number }

    // 6. Tạo lead trong collection leads với need 'resource' và tag 'habit-loop'
    // REVIEW-REQUIRED: Tạo lead trong collection leads sau khi đã lưu xong kế hoạch trong cùng transaction
    await payload.create({
      collection: 'leads',
      data: {
        name: cleanName,
        email: cleanEmail,
        need: 'resource',
        consent: true,
        consentAt: new Date().toISOString(),
        source: {
          form: 'habit-loop',
          page: ctx.page || HABIT_LOOP_PATH,
          utm: ctx.utm,
        },
        interestTags: [{ text: 'habit-loop' }],
        followUpStatus: 'new',
      },
      overrideAccess: true, // overrideAccess cho phép server action ghi nhận khách tiềm năng mà không yêu cầu user login
      req,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }
  } catch (err) {
    if (shouldCommit) {
      await killTransaction(req)
    }
    throw err
  }

  // 7. Gửi email xác nhận kế hoạch nếu người dùng có email
  if (cleanEmail) {
    const emailTechniques = validated.chosenTechniques.map((item) => {
      const tech = techMap.get(item.techniqueId)
      return {
        name: tech?.name || `Kỹ thuật #${item.techniqueId}`,
        stage: tech?.stage || item.stage || '',
        action: item.action,
      }
    })

    try {
      await sendHabitPlanEmail(
        {
          email: cleanEmail,
          name: cleanName,
          identityStatement: validated.identityStatement,
          techniques: emailTechniques,
          zaloGroupUrl: zaloGroupUrl || undefined,
        },
        options.emailSender,
      )
    } catch (emailErr) {
      console.error('[Habit] Error sending habit plan email:', emailErr)
      // Lỗi gửi email không làm gián đoạn việc lưu kế hoạch
    }
  }

  return {
    success: true,
    planId: habitPlanDoc.id,
    zaloGroupUrl,
  }
}
