import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { DiagnosticQuestion, Product } from '@/payload-types'
import {
  scoreDiagnostic,
  selectDiagnosticSuggestions,
  type DiagnosticScoreResult,
  type DiagnosticSuggestionItem,
  type HabitStage,
} from './diagnostic'
import { diagnosticSubmissionSchema, type DiagnosticSubmissionInput } from './forms/schemas'
import { checkAndRecordRateLimit } from './forms/ratelimit.server'
import { verifyTurnstile } from './forms/turnstile.server'
import { GROWTH_MIRROR_PATH, resolveProductCta } from './products'
import { HABIT_TRACKER_PRODUCT_SLUG } from './habit/config'
import { vi } from './i18n/vi'
import type { SubmissionContext, SubmissionOptions } from './forms/submit.server'

export interface PublicDiagnosticQuestion {
  id: number
  statement: string
  stage: HabitStage
  order: number
}

export interface DiagnosticResultData {
  topStage: HabitStage
  secondaryStage: HabitStage | null
  scores: Record<HabitStage, number>
  averageScores: Record<HabitStage, number>
  suggestions: DiagnosticSuggestionItem[]
  secondarySuggestions: DiagnosticSuggestionItem[]
  ctaHref: string
  ctaLabel?: string
}

export interface DiagnosticSubmissionResult {
  success: boolean
  data?: DiagnosticResultData
  fake?: boolean
}

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

/**
 * Đọc danh sách câu hỏi chẩn đoán đã xuất bản từ Payload CMS (phía server).
 * CHỈ trả về các trường cần thiết: id, statement, stage, order.
 * TUYỆT ĐỐI KHÔNG gửi trường `suggestion` xuống trình duyệt trước khi có kết quả.
 */
export async function getDiagnosticQuestions(
  payloadInstance?: Payload,
): Promise<PublicDiagnosticQuestion[]> {
  try {
    const payload = await resolvePayload(payloadInstance)
    const result = await payload.find({
      collection: 'diagnosticQuestions',
      where: {
        _status: { equals: 'published' },
      },
      sort: 'order',
      limit: 100,
      depth: 0,
      draft: false,
    })

    const questions: PublicDiagnosticQuestion[] = []

    for (const doc of result.docs) {
      if (
        typeof doc.id === 'number' &&
        typeof doc.statement === 'string' &&
        doc.stage &&
        ['cue', 'craving', 'response', 'reward'].includes(doc.stage)
      ) {
        questions.push({
          id: doc.id,
          statement: doc.statement,
          stage: doc.stage as HabitStage,
          order: doc.order ?? 0,
        })
      }
    }

    return questions.sort((a, b) => a.order - b.order)
  } catch (err) {
    console.error('[Diagnostic] Error reading diagnostic questions:', err)
    return []
  }
}

/**
 * Xử lý nộp kết quả bài test chẩn đoán (server-side):
 * 1. Chấm lại toàn bộ điểm phía SERVER từ câu trả lời (không tin điểm client gửi).
 * 2. Lấy gợi ý (suggestion) từ CMS cho giai đoạn điểm cao nhất.
 * 3. Nếu người dùng nhập email (tùy chọn) + đồng ý:
 *    - Xác minh Turnstile -> Rate limit -> Tạo lead (tag diagnostic, need=personal).
 *    - Lưu bản ghi diagnosticResults (kèm email).
 * 4. Nếu bỏ qua email:
 *    - Không tạo lead, không bắt Turnstile.
 *    - Vẫn lưu diagnosticResults (không email).
 * 5. Trả về giai đoạn nổi bật, giai đoạn thứ 2 (nếu có), gợi ý và link CTA Growth Mirror.
 */
export async function submitDiagnostic(
  input: DiagnosticSubmissionInput | Record<string, unknown>,
  ctx: SubmissionContext = {},
  options: SubmissionOptions = {},
): Promise<DiagnosticSubmissionResult> {
  // 1. Kiểm tra Honeypot (chặn bot)
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
  const validated = diagnosticSubmissionSchema.parse(input)

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      fake: true,
    }
  }

  const payload = await resolvePayload(options.payload)

  // 3. Đọc toàn bộ câu hỏi (bao gồm trường suggestion) từ database để chấm điểm chính xác
  const dbQuestionsResult = await payload.find({
    collection: 'diagnosticQuestions',
    where: {
      _status: { equals: 'published' },
    },
    limit: 100,
    depth: 0,
    draft: false,
  })

  const allQuestions = dbQuestionsResult.docs as DiagnosticQuestion[]

  // 4. CHẤM LẠI ĐIỂM PHÍA SERVER (Không tin điểm client gửi)
  const scoreResult: DiagnosticScoreResult = scoreDiagnostic(validated.answers, allQuestions)
  const { topStage, secondaryStage, scores, averageScores } = scoreResult

  // 5. Trích xuất gợi ý (suggestion) cho topStage (và secondaryStage nếu có)
  const suggestions = selectDiagnosticSuggestions(topStage, allQuestions, validated.answers)
  const secondarySuggestions = secondaryStage
    ? selectDiagnosticSuggestions(secondaryStage, allQuestions, validated.answers)
    : []

  const cleanEmail = validated.email?.trim().toLowerCase() || null

  // 6. Every submission writes a diagnosticResults row, so Turnstile and the per-IP rate limit
  // apply with or without an email (otherwise bots could fill the table anonymously).
  await verifyTurnstile(validated.turnstileToken, ctx.ip)
  await checkAndRecordRateLimit(payload, {
    form: 'diagnostic',
    ip: ctx.ip,
    email: cleanEmail ?? undefined,
  })

  // 6b. Lưu Email & Tạo Lead (nếu người dùng cung cấp email)
  if (cleanEmail) {
    // 6c. REVIEW-REQUIRED: Tạo lead trong collection leads với overrideAccess
    await payload.create({
      collection: 'leads',
      data: {
        email: cleanEmail,
        need: 'personal',
        consent: true,
        consentAt: new Date().toISOString(),
        source: {
          form: 'diagnostic',
          page: ctx.page || '/habit/chan-doan',
          utm: ctx.utm || undefined,
        },
        interestTags: [
          { text: 'diagnostic' },
          { text: `stage:${topStage}` },
          ...(secondaryStage ? [{ text: `stage:${secondaryStage}` }] : []),
        ],
        followUpStatus: 'new',
      },
      overrideAccess: true,
    })
  }

  // 7. Lưu bản ghi diagnosticResults (có email nếu cung cấp, null nếu bỏ qua)
  await payload.create({
    collection: 'diagnosticResults',
    data: {
      email: cleanEmail,
      answers: validated.answers.map((a) => ({
        question: a.questionId,
        score: a.score,
      })),
      topStage,
    },
    overrideAccess: true,
  })

  // 8. Xác định CTA kết quả: ưu tiên dẫn tới luồng dùng thử nếu Habit Tracker số mở dùng thử
  // Hana's fallback CTA from siteSettings; an open Habit Tracker trial still takes priority.
  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
    overrideAccess: true,
  })
  let ctaHref = settings.quizCtaPath?.trim() || GROWTH_MIRROR_PATH
  let ctaLabel: string = vi.diagnostic.result.ctaButton

  const habitProductRes = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })

  const habitProduct = habitProductRes.docs[0] as Product | undefined
  if (
    habitProduct &&
    habitProduct._status === 'published' &&
    habitProduct.saleStatus === 'on_sale' &&
    typeof habitProduct.trialDays === 'number' &&
    habitProduct.trialDays > 0
  ) {
    const resolvedCta = resolveProductCta(habitProduct)
    if (resolvedCta) {
      ctaHref = resolvedCta.href
      ctaLabel = vi.diagnostic.result.trialCtaButton(habitProduct.trialDays)
    }
  }

  return {
    success: true,
    data: {
      topStage,
      secondaryStage,
      scores,
      averageScores,
      suggestions,
      secondarySuggestions,
      ctaHref,
      ctaLabel,
    },
  }
}
