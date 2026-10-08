import { z } from 'zod'
import { vi } from '../i18n/vi'

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, vi.forms.validation.nameRequired)
    .max(100, vi.forms.validation.nameMax),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().max(20, vi.forms.validation.phoneMax).optional(),
  need: z.enum(['personal', 'business', 'resource']).optional().default('resource'),
  interestTags: z
    .array(z.string().trim().max(50, vi.forms.validation.interestTagMaxLength))
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
  name: z
    .string()
    .trim()
    .min(1, vi.forms.validation.nameRequired)
    .max(100, vi.forms.validation.nameMax),
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
  name: z
    .string()
    .trim()
    .min(1, vi.forms.validation.nameRequired)
    .max(100, vi.forms.validation.nameMax),
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
  teamSize: z.string().trim().max(100, vi.forms.validation.teamSizeMax).optional(),
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
  name: z
    .string()
    .trim()
    .min(1, vi.forms.validation.nameRequired)
    .max(100, vi.forms.validation.nameMax),
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
  name: z
    .string()
    .trim()
    .min(1, vi.payment.validation.nameRequired)
    .max(100, vi.forms.validation.nameMax),
  email: z
    .string()
    .trim()
    .min(1, vi.payment.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().max(20, vi.forms.validation.phoneMax).optional(),
  need: z.string().trim().max(1000, vi.payment.validation.needMax).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: vi.payment.validation.termsAcceptedRequired,
  }),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type ExperienceOrderInput = z.infer<typeof experienceOrderSchema>
