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
import { extractIdentityParts, HABIT_LOOP_PATH } from './habit'
import { HABIT_TRACKER_PRODUCT_SLUG } from './habit/config'
import { addVietnamDays, getVietnamYmd, vietnamTodayIso } from './habit/tracker-stats'
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
  customerId?: number
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
  offerSeriesLabel?: string | null
  offerTitleLine1?: string | null
  offerTitleLine2?: string | null
  offerEmotionLine?: string | null
  curriculumHeading?: string | null
  curriculumSubheading?: string | null
  curriculumModules?: Array<{ title: string; description?: string | null }> | null
  featuresHeading?: string | null
  featuresSubheading?: string | null
  featureItems?: Array<{ title: string; description?: string | null }> | null
  bottomTitle?: string | null
  bottomDescription?: string | null
}

/** Lỗi kỹ thuật dạng ZodError để action trả câu tiếng Việt cho người dùng (không thành lỗi máy chủ). */
function techniqueError(message: string): ZodError {
  return new ZodError([{ code: 'custom', path: ['chosenTechniques'], message }])
}

/** Lỗi ngày bắt đầu dạng ZodError để action trả câu tiếng Việt cho người dùng. */
function startDateError(message: string): ZodError {
  return new ZodError([{ code: 'custom', path: ['startDate'], message }])
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
      sort: ['order', 'id'],
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
        const docRecord = doc as unknown as Record<string, unknown>
        const rawExamples = Array.isArray(docRecord.examples)
          ? (docRecord.examples as unknown[])
          : []
        const examples = rawExamples
          .map((item) =>
            typeof item === 'string'
              ? item
              : typeof item === 'object' && item !== null && 'text' in item
                ? String((item as { text?: unknown }).text || '')
                : '',
          )
          .filter((t) => t.trim().length > 0)

        techniques.push({
          id: doc.id,
          name: doc.name,
          stage: doc.stage as PublicTechnique['stage'],
          description:
            typeof docRecord.description === 'string' ? (docRecord.description as string) : null,
          examples,
          applyTemplate:
            typeof docRecord.applyTemplate === 'string'
              ? (docRecord.applyTemplate as string)
              : null,
          order: typeof docRecord.order === 'number' ? (docRecord.order as number) : null,
          howTo: doc.howTo,
          example: doc.example,
          exampleVideoUrl:
            typeof doc.exampleVideoUrl === 'string' && doc.exampleVideoUrl.trim().length > 0
              ? doc.exampleVideoUrl.trim()
              : null,
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

  // Trích xuất curriculumModules (PK-30)
  const curriculumModules: Array<{ title: string; description?: string | null }> = []
  if (Array.isArray(doc.curriculumModules)) {
    for (const m of doc.curriculumModules) {
      if (m && typeof m.title === 'string' && m.title.trim().length > 0) {
        curriculumModules.push({
          title: m.title.trim(),
          description: typeof m.description === 'string' ? m.description.trim() : null,
        })
      }
    }
  }

  // Trích xuất featureItems (PK-30)
  const featureItems: Array<{ title: string; description?: string | null }> = []
  if (Array.isArray(doc.featureItems)) {
    for (const item of doc.featureItems) {
      if (item && typeof item.title === 'string' && item.title.trim().length > 0) {
        featureItems.push({
          title: item.title.trim(),
          description: typeof item.description === 'string' ? item.description.trim() : null,
        })
      }
    }
  }

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
    offerSeriesLabel: doc.offerSeriesLabel?.trim() || null,
    offerTitleLine1: doc.offerTitleLine1?.trim() || null,
    offerTitleLine2: doc.offerTitleLine2?.trim() || null,
    offerEmotionLine: doc.offerEmotionLine?.trim() || null,
    curriculumHeading: doc.curriculumHeading?.trim() || null,
    curriculumSubheading: doc.curriculumSubheading?.trim() || null,
    curriculumModules: curriculumModules.length > 0 ? curriculumModules : null,
    featuresHeading: doc.featuresHeading?.trim() || null,
    featuresSubheading: doc.featuresSubheading?.trim() || null,
    featureItems: featureItems.length > 0 ? featureItems : null,
    bottomTitle: doc.bottomTitle?.trim() || null,
    bottomDescription: doc.bottomDescription?.trim() || null,
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

  // REVIEW-REQUIRED: HB-20 Kiểm tra startDate: hôm nay -> hôm nay + 14 ngày theo giờ Việt Nam
  let planStartDate = vietnamTodayIso()
  if (validated.startDate) {
    const todayYmd = getVietnamYmd()
    const maxStartDayYmd = getVietnamYmd(new Date(addVietnamDays(todayYmd, 14)))
    let candidateYmd = validated.startDate
    if (candidateYmd.length > 10) {
      const parsedDate = new Date(candidateYmd)
      if (Number.isNaN(parsedDate.getTime())) {
        throw startDateError(vi.hb20.errors.startDateInvalid)
      }
      candidateYmd = getVietnamYmd(parsedDate)
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(candidateYmd)) {
        throw startDateError(vi.hb20.errors.startDateInvalid)
      }
      const parsedDate = new Date(`${candidateYmd}T00:00:00+07:00`)
      if (Number.isNaN(parsedDate.getTime())) {
        throw startDateError(vi.hb20.errors.startDateInvalid)
      }
    }

    if (candidateYmd < todayYmd || candidateYmd > maxStartDayYmd) {
      throw startDateError(vi.hb20.errors.startDateOutOfRange)
    }

    planStartDate = new Date(`${candidateYmd}T00:00:00+07:00`).toISOString()
  }

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      fake: true,
    }
  }

  const payload = await resolvePayload(options.payload)

  let cleanEmail = validated.email?.trim().toLowerCase() || null

  if (options.customerId) {
    // REVIEW-REQUIRED: DP-03 Khi có khách trong phiên, email lấy từ phiên (customer), bỏ qua email trình duyệt gửi
    const customerDoc = await payload.findByID({
      collection: 'customers',
      id: options.customerId,
      depth: 0,
      overrideAccess: true,
    })
    if (customerDoc?.email) {
      cleanEmail = customerDoc.email.trim().toLowerCase()
    }
  }

  // 4. Luôn xác minh Turnstile và kiểm tra Rate limit (ngay cả khi không có email)
  // REVIEW-REQUIRED: DP-03 Bỏ qua Turnstile cho khách đã đăng nhập (đã chống bot ở đăng nhập)
  if (!options.customerId) {
    await verifyTurnstile(validated.turnstileToken, ctx.ip)
  }
  await checkAndRecordRateLimit(payload, {
    form: 'habit-loop',
    ip: ctx.ip,
    email: cleanEmail || undefined,
  })

  // 3. Kiểm tra technique: không trùng lặp, có thật và đúng stage đã xuất bản
  // REVIEW-REQUIRED: Bỏ giới hạn 2 / giai đoạn theo DP-01d (H6 = A, cho phép chọn cả 3 kỹ thuật Cue)
  const techniqueIds = validated.chosenTechniques.map((t) => t.techniqueId)
  const uniqueIds = new Set(techniqueIds)
  if (uniqueIds.size !== techniqueIds.length) {
    throw techniqueError(vi.habit.wizard.errors.techniqueDuplicate)
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
    const lockKey = options.customerId
      ? `habit-plan:customer:${options.customerId}`
      : `habit-plan:${cleanEmail}`
    if (txDb) {
      await txDb.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`)
    }
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    // REVIEW-REQUIRED: HB-25 So trùng 10 phút: khách đã đăng nhập so theo customer + identityStatement,
    // khách vãng lai so theo leadEmail + identityStatement.
    const duplicateWhere: Where = options.customerId
      ? {
          and: [
            { customer: { equals: options.customerId } },
            { identityStatement: { equals: validated.identityStatement } },
            { createdAt: { greater_than_equal: tenMinutesAgo } },
          ],
        }
      : {
          and: [
            { leadEmail: { equals: cleanEmail } },
            { identityStatement: { equals: validated.identityStatement } },
            { createdAt: { greater_than_equal: tenMinutesAgo } },
          ],
        }
    const existing = await payload.find({
      collection: 'habitPlans',
      where: duplicateWhere,
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

    // REVIEW-REQUIRED: HB-25 Lưu kế hoạch. Nếu có customerId (lấy từ phiên đăng nhập), gắn thẳng customer = customerId.
    // Vẫn ghi leadEmail = cleanEmail để giữ lead / email xác nhận. Không nhận customer hay customerId từ client input.
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
      startDate: planStartDate,
    }
    if (options.customerId) {
      planData.customer = options.customerId
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
    // REVIEW-REQUIRED: HB-20 privateReason bảo mật, chỉ học viên đọc, tối đa 500 ký tự
    if (validated.privateReason) {
      planData.privateReason = validated.privateReason
    }
    // REVIEW-REQUIRED: HB-20 companionName chỉ dùng để nhắc nhở học viên
    if (validated.companionName) {
      planData.companionName = validated.companionName
    }

    // REVIEW-REQUIRED: Z1 Lưu actionText và personText vào habitPlans; fallback tách từ identityStatement
    const extractedParts = extractIdentityParts(validated.identityStatement)
    const finalActionText = validated.actionText || extractedParts.actionText
    if (finalActionText) {
      planData.actionText = finalActionText
    }
    const finalPersonText = validated.personText || extractedParts.personText
    if (finalPersonText) {
      planData.personText = finalPersonText
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
