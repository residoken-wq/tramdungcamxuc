import 'server-only'
import { getPayload, type Payload } from 'payload'
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

export interface HabitProductData {
  id: number | string
  name: string
  slug: string
  price: number | null
  salePrice: number | null
  saleEndsAt?: string | null
  trialDays: number | null
  shortDescription?: string | null
  saleStatus: Product['saleStatus']
  includes: string[]
  faq: Array<{ question: string; answer?: string | null }>
  coverImage?: { url?: string | null; alt?: string | null } | null
  cta: ProductCta | null
  videoCount: number
  techniqueCount: number
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
export async function getHabitProduct(payloadInstance?: Payload): Promise<HabitProductData | null> {
  try {
    const payload = await resolvePayload(payloadInstance)

    const [productRes, lessonCountRes, techniqueCountRes] = await Promise.all([
      payload.find({
        collection: 'products',
        where: {
          slug: { equals: HABIT_TRACKER_PRODUCT_SLUG },
        },
        limit: 1,
        depth: 1,
      }),
      payload.count({
        collection: 'lessons',
        where: {
          _status: { equals: 'published' },
        },
      }),
      payload.count({
        collection: 'techniques',
        where: {
          _status: { equals: 'published' },
        },
      }),
    ])

    if (productRes.docs.length === 0) {
      return null
    }

    const doc = productRes.docs[0] as Product

    // Sản phẩm ở trạng thái hidden -> ẩn khỏi trang công khai (theo AGENTS.md)
    if (doc.saleStatus === 'hidden') {
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
      trialDays: doc.trialDays ?? 21,
      shortDescription: doc.shortDescription,
      saleStatus: doc.saleStatus,
      includes,
      faq,
      coverImage,
      cta,
      videoCount: lessonCountRes.totalDocs,
      techniqueCount: techniqueCountRes.totalDocs,
    }
  } catch (err) {
    console.error('[Habit] Error reading habit product:', err)
    return null
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
  options: SubmissionOptions = {},
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

  // 3. Kiểm tra technique: không trùng lặp, tối đa 2 kỹ thuật mỗi stage, có thật và đúng stage đã xuất bản
  const techniqueIds = validated.chosenTechniques.map((t) => t.techniqueId)
  const uniqueIds = new Set(techniqueIds)
  if (uniqueIds.size !== techniqueIds.length) {
    throw new Error('Không được chọn trùng kỹ thuật.')
  }

  const stageCounts: Record<string, number> = {}
  for (const item of validated.chosenTechniques) {
    stageCounts[item.stage] = (stageCounts[item.stage] || 0) + 1
  }
  for (const [stg, count] of Object.entries(stageCounts)) {
    if (count > 2) {
      throw new Error(`Giai đoạn ${stg} chỉ được chọn tối đa 2 kỹ thuật.`)
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
        throw new Error(`Kỹ thuật #${item.techniqueId} không tồn tại hoặc chưa xuất bản.`)
      }
      if (tech.stage !== item.stage) {
        throw new Error(
          `Kỹ thuật "${tech.name}" thuộc giai đoạn ${tech.stage}, không phải ${item.stage}.`,
        )
      }
    }
  }

  const cleanEmail = validated.email?.trim().toLowerCase() || null
  let customerId: number | undefined = undefined

  // 4. Nếu có email, xử lý Turnstile, rate limit, lead và customer
  if (cleanEmail) {
    await verifyTurnstile(validated.turnstileToken, ctx.ip)
    await checkAndRecordRateLimit(payload, {
      form: 'habit-loop',
      ip: ctx.ip,
      email: cleanEmail,
    })

    // REVIEW-REQUIRED: Tạo lead trong collection leads với need 'resource' và tag 'habit-loop'
    await payload.create({
      collection: 'leads',
      data: {
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
    })

    // Kiểm tra khách hàng hiện có
    const existingCustomer = await payload.find({
      collection: 'customers',
      where: { email: { equals: cleanEmail } },
      limit: 1,
      depth: 0,
    })
    if (existingCustomer.docs.length > 0) {
      customerId = existingCustomer.docs[0].id
    }
  }

  // 5. Lưu bản ghi habitPlans
  // REVIEW-REQUIRED: Lưu kế hoạch thói quen của người dùng (có thể ẩn danh hoặc kèm leadEmail)
  const habitPlanDoc = await payload.create({
    collection: 'habitPlans',
    data: {
      customer: customerId,
      leadEmail: cleanEmail ?? undefined,
      scorecard: validated.scorecard.map((item) => ({
        habit: item.habit,
        rating: item.rating,
      })),
      identityStatement: validated.identityStatement,
      chosenTechniques: validated.chosenTechniques.map((item) => ({
        technique: item.techniqueId,
        action: item.action,
      })),
      startDate: validated.startDate || new Date().toISOString(),
    },
    overrideAccess: true, // overrideAccess cho phép server action lưu kế hoạch của học viên chưa đăng nhập
  })

  // 6. Đọc link nhóm Zalo từ siteSettings
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
