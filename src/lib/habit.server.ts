import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Product, SiteSetting } from '@/payload-types'
import type { PublicTechnique } from './habit'
import { HABIT_LOOP_PATH } from './habit'
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
  name: string
  slug: string
  price: number | null
  salePrice: number | null
  trialDays: number | null
  shortDescription?: string | null
  saleStatus: string
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
 */
export async function getHabitProduct(
  payloadInstance?: Payload,
): Promise<HabitProductData | null> {
  try {
    const payload = await resolvePayload(payloadInstance)
    const result = await payload.find({
      collection: 'products',
      where: {
        slug: { equals: 'habit-tracker-so' },
      },
      limit: 1,
      depth: 0,
    })

    if (result.docs.length > 0) {
      const doc = result.docs[0] as Product
      return {
        name: doc.name,
        slug: doc.slug,
        price: doc.price ?? 250000,
        salePrice: doc.salePrice ?? 178000,
        trialDays: doc.trialDays ?? 21,
        shortDescription: doc.shortDescription,
        saleStatus: doc.saleStatus,
      }
    }

    // Fallback nếu chưa seed product
    return {
      name: 'Habit Tracker số (Habit Hack 1% Better)',
      slug: 'habit-tracker-so',
      price: 250000,
      salePrice: 178000,
      trialDays: 21,
      shortDescription: '20 video, 11 kỹ thuật, tracker hành động – cảm xúc 21 ngày.',
      saleStatus: 'coming_soon',
    }
  } catch (err) {
    console.error('[Habit] Error reading habit product:', err)
    return null
  }
}

/**
 * Xử lý nộp kế hoạch Habit Loop:
 * 1. Kiểm tra honeypot (chống bot).
 * 2. Validate dữ liệu qua Zod.
 * 3. Nếu người dùng nhập email:
 *    - Xác minh Turnstile, rate limit.
 *    - Tạo lead trong collection leads (tag: habit-loop).
 *    - Tìm customerId nếu đã có tài khoản.
 * 4. Tạo bản ghi trong habitPlans.
 * 5. Lấy zaloGroupUrl từ siteSettings trả về cho người dùng.
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
  const cleanEmail = validated.email?.trim().toLowerCase() || null

  let customerId: number | undefined = undefined

  // 3. Nếu có email, xử lý Turnstile, rate limit, lead và customer
  if (cleanEmail) {
    await verifyTurnstile(validated.turnstileToken, ctx.ip)
    await checkAndRecordRateLimit(payload, {
      form: 'habit-loop',
      ip: ctx.ip,
      email: cleanEmail,
    })

    // REVIEW-REQUIRED: Tạo lead trong collection leads
    await payload.create({
      collection: 'leads',
      data: {
        email: cleanEmail,
        need: 'personal',
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
      overrideAccess: true,
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

  // 4. Lưu bản ghi habitPlans
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
    overrideAccess: true,
  })

  // 5. Đọc link nhóm Zalo từ siteSettings
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

  return {
    success: true,
    planId: habitPlanDoc.id,
    zaloGroupUrl,
  }
}
