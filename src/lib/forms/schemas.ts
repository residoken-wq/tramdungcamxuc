import { z } from 'zod'
import { vi } from '../i18n/vi'
import { DIAGNOSTIC_SCALE_MIN, DIAGNOSTIC_SCALE_MAX } from '../diagnostic'

// REVIEW-REQUIRED: Quy tắc kiểm tra họ và tên dùng chung giữa các form và Customers collection (T2-16b C6):
// - Tối đa 100 ký tự sau khi cắt khoảng trắng
// - Không chứa ký tự <, >, {, } hoặc ký tự điều khiển
export function createNameSchema(
  requiredMessage: string = vi.forms.validation.nameRequired,
  maxMessage: string = vi.forms.validation.nameMax,
) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .max(100, maxMessage)
    .refine((val) => !/[<>{}]|[\x00-\x1F\x7F]/.test(val), {
      message: vi.account.validation.nameSpecialChars,
    })
}

export const leadFormSchema = z.object({
  name: createNameSchema(vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().max(20, vi.forms.validation.phoneMax).optional(),
  need: z.enum(['personal', 'business', 'resource']).optional().default('resource'),
  interestTags: z
    .array(z.string().trim().max(120, vi.forms.validation.interestTagMaxLength))
    .max(10, vi.forms.validation.interestTagsMaxCount)
    .optional(),
  message: z.string().trim().max(2000, vi.forms.validation.messageMax).optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type LeadFormInput = z.infer<typeof leadFormSchema>

export const coachingFormSchema = z.object({
  name: createNameSchema(vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().max(20, vi.forms.validation.phoneMax).optional(),
  service: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return undefined
      return typeof val === 'string' && !isNaN(Number(val)) ? Number(val) : val
    }),
  currentStatus: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  message: z
    .string()
    .trim()
    .min(1, vi.forms.validation.messageRequired)
    .max(2000, vi.forms.validation.messageMax),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type CoachingFormInput = z.infer<typeof coachingFormSchema>

export const b2bBriefSchema = z.object({
  name: createNameSchema(vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().max(20, vi.forms.validation.phoneMax).optional(),
  company: z
    .string()
    .trim()
    .min(1, vi.forms.validation.companyRequired)
    .max(200, vi.forms.validation.companyMax),
  contactRole: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  teamSize: z.string().trim().max(100, vi.forms.validation.teamSizeMax).optional(),
  interestedProgram: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return undefined
      return typeof val === 'string' && !isNaN(Number(val)) ? Number(val) : val
    }),
  targetBehaviors: z.string().trim().max(1000, vi.forms.validation.targetBehaviorsMax).optional(),
  timeline: z.string().trim().max(100, vi.forms.validation.timelineMax).optional(),
  message: z.string().trim().max(2000, vi.forms.validation.messageMax).optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type B2BBriefInput = z.infer<typeof b2bBriefSchema>

export const resourceRequestSchema = z.object({
  name: createNameSchema(vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  slug: z.string().trim().min(1, vi.forms.validation.resourceSlugRequired),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type ResourceRequestInput = z.infer<typeof resourceRequestSchema>

export const experienceOrderSchema = z.object({
  productId: z
    .union(
      [
        z.number({ required_error: vi.payment.errors.productNotFound }),
        z
          .string({ required_error: vi.payment.errors.productNotFound })
          .trim()
          .min(1, vi.payment.errors.productNotFound),
      ],
      {
        errorMap: () => ({ message: vi.payment.errors.productNotFound }),
      },
    )
    .transform((val, ctx) => {
      const num = typeof val === 'number' ? val : Number(val)
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: vi.payment.errors.productNotFound,
        })
        return z.NEVER
      }
      return num
    }),
  name: createNameSchema(vi.payment.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.payment.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().max(20, vi.forms.validation.phoneMax).optional(),
  need: z.string().trim().max(1000, vi.payment.validation.needMax).optional(),
  interestedServiceId: z
    .union([
      z.number().int().positive(),
      z
        .string()
        .trim()
        .regex(/^\d+$/)
        .transform((val) => Number(val))
        .refine((n) => n > 0),
    ])
    .optional()
    .nullable()
    .transform((val) => (val === null || val === undefined ? undefined : val)),
  interestedPackageSlug: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === null || val === undefined || val === '' ? undefined : val)),
  termsAccepted: z
    .boolean({
      required_error: vi.payment.validation.termsAcceptedRequired,
      invalid_type_error: vi.payment.validation.termsAcceptedRequired,
    })
    .refine((val) => val === true, {
      message: vi.payment.validation.termsAcceptedRequired,
    }),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type ExperienceOrderInput = z.infer<typeof experienceOrderSchema>
export const diagnosticAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  score: z.number().int().min(DIAGNOSTIC_SCALE_MIN).max(DIAGNOSTIC_SCALE_MAX),
})

export type DiagnosticAnswerInput = z.infer<typeof diagnosticAnswerSchema>

export const diagnosticSubmissionSchema = z
  .object({
    answers: z.array(diagnosticAnswerSchema).min(1, vi.diagnostic.errors.emptyAnswers),
    email: z
      .string()
      .trim()
      .max(254, vi.forms.validation.emailMax)
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val.length === 0) return true
          return z.string().email().safeParse(val).success
        },
        {
          message: vi.forms.validation.emailInvalid,
        },
      ),
    consent: z.boolean().optional().nullable(),
    honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
    turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
    utm: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Nếu có nhập email (không rỗng), BẮT BUỘC consent phải là true (Nghị định 13/2023)
      const hasEmail = Boolean(data.email && data.email.trim().length > 0)
      if (hasEmail) {
        return data.consent === true
      }
      return true
    },
    {
      message: vi.forms.validation.consentRequired,
      path: ['consent'],
    },
  )

export type DiagnosticSubmissionInput = z.infer<typeof diagnosticSubmissionSchema>

export const habitScorecardItemSchema = z.object({
  habit: z
    .string()
    .trim()
    .min(1, vi.habit.wizard.errors.habitRequired)
    .max(200, vi.habit.wizard.errors.habitMax),
  rating: z.enum(['good', 'neutral', 'bad']),
  time: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined))
    .refine((val) => !val || /^([01]\d|2[0-3]):[0-5]\d$/.test(val), {
      message: vi.hb03.errors.timeInvalidFormat,
    }),
})

export type HabitScorecardItemInput = z.infer<typeof habitScorecardItemSchema>

export const habitChosenTechniqueSchema = z.object({
  techniqueId: z.number().int().positive(),
  stage: z.enum(['cue', 'craving', 'response', 'reward']),
  action: z
    .string()
    .trim()
    .min(1, vi.habit.wizard.errors.actionRequired)
    .max(300, vi.habit.wizard.errors.actionMax),
})

export type HabitChosenTechniqueInput = z.infer<typeof habitChosenTechniqueSchema>

export const habitPlanSubmissionSchema = z
  .object({
    scorecard: z
      .array(habitScorecardItemSchema)
      .min(1, vi.habit.wizard.errors.scorecardEmpty)
      .max(20, vi.habit.wizard.errors.scorecardMax),
    identityStatement: z
      .string()
      .trim()
      .min(1, vi.habit.wizard.errors.identityRequired)
      .max(500, vi.habit.wizard.errors.identityMax),
    chosenTechniques: z
      .array(habitChosenTechniqueSchema)
      .max(8, vi.habit.wizard.errors.techniquesTooMany),
    anchorHabit: z
      .string()
      .trim()
      .max(120, vi.hb03.errors.anchorHabitTooLong)
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    rhythmDays: z.preprocess(
      (val) => (val === null || val === undefined ? undefined : val),
      z
        .array(
          z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], {
            errorMap: () => ({ message: vi.hb03.errors.rhythmDaysInvalid }),
          }),
        )
        .min(1, vi.hb09.errors.rhythmDaysEmpty)
        .max(7)
        .refine((days) => new Set(days).size === days.length, {
          message: vi.hb03.errors.rhythmDaysDuplicate,
        })
        .optional()
        .default(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    ),
    twoMinuteAction: z
      .string()
      .trim()
      .max(200, vi.hb03.errors.twoMinuteActionTooLong)
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    name: z
      .string()
      .trim()
      .max(100, vi.account.validation.nameMax100)
      .refine((val) => !/[<>{}]|[\x00-\x1F\x7F]/.test(val), {
        message: vi.account.validation.nameSpecialChars,
      })
      .optional()
      .nullable(),
    email: z
      .string()
      .trim()
      .max(254, vi.forms.validation.emailMax)
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val.length === 0) return true
          return z.string().email().safeParse(val).success
        },
        {
          message: vi.forms.validation.emailInvalid,
        },
      ),
    consent: z.boolean().optional().nullable(),
    honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
    turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
    utm: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      const hasEmail = Boolean(data.email && data.email.trim().length > 0)
      if (hasEmail) {
        return data.consent === true
      }
      return true
    },
    {
      message: vi.forms.validation.consentRequired,
      path: ['consent'],
    },
  )
  .refine(
    (data) => {
      if (!data.anchorHabit) return true
      const goodHabits = data.scorecard
        .filter((item) => item.rating === 'good')
        .map((item) => item.habit.trim())
      return goodHabits.includes(data.anchorHabit.trim())
    },
    {
      message: vi.hb09.errors.anchorHabitNotGood,
      path: ['anchorHabit'],
    },
  )

export type HabitPlanSubmissionInput = z.infer<typeof habitPlanSubmissionSchema>

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  name: z
    .string()
    .trim()
    .max(100, vi.account.validation.nameMax100)
    .refine((val) => !/[<>{}]|[\x00-\x1F\x7F]/.test(val), {
      message: vi.account.validation.nameSpecialChars,
    })
    .optional()
    .nullable(),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  pageSlug: z.string().max(200).optional(),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>
