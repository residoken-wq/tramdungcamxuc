import { z } from 'zod'
import { vi } from '../i18n/vi'

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().optional(),
  need: z.enum(['personal', 'business', 'resource']).optional().default('resource'),
  interestTags: z.array(z.string()).optional(),
  message: z.string().trim().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().optional(),
  turnstileToken: z.string().optional(),
})

export type LeadFormInput = z.infer<typeof leadFormSchema>

export const coachingFormSchema = z.object({
  name: z.string().trim().min(1, vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().optional(),
  service: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return undefined
      return typeof val === 'string' && !isNaN(Number(val)) ? Number(val) : val
    }),
  message: z.string().trim().min(1, vi.forms.validation.messageRequired),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().optional(),
  turnstileToken: z.string().optional(),
})

export type CoachingFormInput = z.infer<typeof coachingFormSchema>

export const b2bBriefSchema = z.object({
  name: z.string().trim().min(1, vi.forms.validation.nameRequired),
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .email(vi.forms.validation.emailInvalid),
  phone: z.string().trim().optional(),
  company: z.string().trim().min(1, vi.forms.validation.companyRequired),
  teamSize: z.string().trim().optional(),
  targetBehaviors: z.string().trim().optional(),
  timeline: z.string().trim().optional(),
  message: z.string().trim().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: vi.forms.validation.consentRequired,
  }),
  honeypot: z.string().optional(),
  turnstileToken: z.string().optional(),
})

export type B2BBriefInput = z.infer<typeof b2bBriefSchema>
