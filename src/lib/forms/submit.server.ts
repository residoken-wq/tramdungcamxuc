import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { vi } from '../i18n/vi'
import {
  b2bBriefSchema,
  coachingFormSchema,
  leadFormSchema,
  type B2BBriefInput,
  type CoachingFormInput,
  type LeadFormInput,
} from './schemas'
import { checkAndRecordRateLimit } from './ratelimit.server'
import { verifyTurnstile } from './turnstile.server'
import { sendB2BBriefEmails, sendCoachingEmails, sendLeadEmails } from '../email/service.server'
import type { EmailSender } from '../email/types'

export interface SubmissionContext {
  ip?: string
  page?: string
  utm?: string
}

export interface SubmissionOptions {
  payload?: Payload
  emailSender?: EmailSender
}

export interface SubmissionResult {
  success: boolean
  id?: number | string
  message: string
  fake?: boolean
}

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

/**
 * Handles Lead generation form submission (Resource downloads, general leads).
 * Order of checks: honeypot -> Zod -> Turnstile -> rate limit -> create lead -> email.
 */
export async function submitLead(
  input: LeadFormInput | Record<string, unknown>,
  ctx: SubmissionContext = {},
  options: SubmissionOptions = {},
): Promise<SubmissionResult> {
  // 1. Honeypot check (raw input check before validation)
  if (typeof input === 'object' && input !== null && 'honeypot' in input) {
    const rawHp = String(input.honeypot || '').trim()
    if (rawHp.length > 0) {
      return {
        success: true,
        message: vi.forms.success.lead,
        fake: true,
      }
    }
  }

  // 2. Zod validation
  const validated = leadFormSchema.parse(input)

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      message: vi.forms.success.lead,
      fake: true,
    }
  }

  // 3. Turnstile verification (must precede rate limit so invalid tokens do not exhaust rate limits)
  await verifyTurnstile(validated.turnstileToken, ctx.ip)

  // 4. Rate limiting check & record
  const payload = await resolvePayload(options.payload)
  await checkAndRecordRateLimit(payload, {
    form: 'lead',
    ip: ctx.ip,
    email: validated.email,
  })

  const rawTags =
    validated.interestTags && validated.interestTags.length > 0
      ? validated.interestTags
      : ['resource']

  // 5. REVIEW-REQUIRED: Personal data (NĐ 13/2023). Public forms create leads through server code
  // with overrideAccess after server validation.
  const lead = await payload.create({
    collection: 'leads',
    data: {
      name: validated.name,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone || undefined,
      message: validated.message || undefined,
      need: validated.need || 'resource',
      interestTags: rawTags.map((text) => ({ text })),
      consent: true,
      consentAt: new Date().toISOString(),
      source: {
        form: 'lead',
        page: ctx.page || undefined,
        utm: ctx.utm || undefined,
      },
      followUpStatus: 'new',
    },
    overrideAccess: true,
  })

  // 6. Send transactional emails (non-blocking errors)
  await sendLeadEmails(
    payload,
    {
      name: validated.name,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone,
      need: validated.need,
      message: validated.message,
      interestTags: validated.interestTags,
    },
    ctx,
    options.emailSender,
  )

  return {
    success: true,
    id: lead.id,
    message: vi.forms.success.lead,
  }
}

/**
 * Handles 1:1 Coaching form submission.
 * Order of checks: honeypot -> Zod -> Turnstile -> rate limit -> create lead -> email.
 */
export async function submitCoachingForm(
  input: CoachingFormInput | Record<string, unknown>,
  ctx: SubmissionContext = {},
  options: SubmissionOptions = {},
): Promise<SubmissionResult> {
  // 1. Honeypot check
  if (typeof input === 'object' && input !== null && 'honeypot' in input) {
    const rawHp = String(input.honeypot || '').trim()
    if (rawHp.length > 0) {
      return {
        success: true,
        message: vi.forms.success.coaching,
        fake: true,
      }
    }
  }

  // 2. Zod validation
  const validated = coachingFormSchema.parse(input)

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      message: vi.forms.success.coaching,
      fake: true,
    }
  }

  // 3. Turnstile verification
  await verifyTurnstile(validated.turnstileToken, ctx.ip)

  // 4. Rate limiting check & record
  const payload = await resolvePayload(options.payload)
  await checkAndRecordRateLimit(payload, {
    form: 'coaching',
    ip: ctx.ip,
    email: validated.email,
  })

  // Resolve service name from services collection (using field 'name')
  let serviceName: string | undefined
  if (validated.service) {
    try {
      const sDoc = await payload.findByID({
        collection: 'services',
        id: validated.service,
        overrideAccess: true,
      })
      if (sDoc && typeof sDoc === 'object') {
        if ('name' in sDoc && sDoc.name) {
          serviceName = String(sDoc.name)
        } else if ('title' in sDoc && sDoc.title) {
          serviceName = String(sDoc.title)
        }
      }
    } catch {
      // Ignore if service not found
    }
  }

  const serviceId =
    typeof validated.service === 'number'
      ? validated.service
      : typeof validated.service === 'string' && !isNaN(Number(validated.service))
        ? Number(validated.service)
        : undefined

  // 5. REVIEW-REQUIRED: Personal data (NĐ 13/2023). Coaching form creates lead with overrideAccess after validation.
  const lead = await payload.create({
    collection: 'leads',
    data: {
      name: validated.name,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone || undefined,
      message: validated.message,
      service: serviceId,
      need: 'personal',
      interestTags: [{ text: 'coaching' }],
      consent: true,
      consentAt: new Date().toISOString(),
      source: {
        form: 'coaching',
        page: ctx.page || undefined,
        utm: ctx.utm || undefined,
      },
      followUpStatus: 'new',
    },
    overrideAccess: true,
  })

  // 6. Send emails
  await sendCoachingEmails(
    payload,
    {
      name: validated.name,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone,
      serviceName,
      message: validated.message,
    },
    ctx,
    options.emailSender,
  )

  return {
    success: true,
    id: lead.id,
    message: vi.forms.success.coaching,
  }
}

/**
 * Handles B2B corporate brief form submission.
 * Order of checks: honeypot -> Zod -> Turnstile -> rate limit -> create lead -> email.
 */
export async function submitB2BBrief(
  input: B2BBriefInput | Record<string, unknown>,
  ctx: SubmissionContext = {},
  options: SubmissionOptions = {},
): Promise<SubmissionResult> {
  // 1. Honeypot check
  if (typeof input === 'object' && input !== null && 'honeypot' in input) {
    const rawHp = String(input.honeypot || '').trim()
    if (rawHp.length > 0) {
      return {
        success: true,
        message: vi.forms.success.b2b,
        fake: true,
      }
    }
  }

  // 2. Zod validation
  const validated = b2bBriefSchema.parse(input)

  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return {
      success: true,
      message: vi.forms.success.b2b,
      fake: true,
    }
  }

  // 3. Turnstile verification
  await verifyTurnstile(validated.turnstileToken, ctx.ip)

  // 4. Rate limiting check & record
  const payload = await resolvePayload(options.payload)
  await checkAndRecordRateLimit(payload, {
    form: 'b2b',
    ip: ctx.ip,
    email: validated.email,
  })

  // 5. REVIEW-REQUIRED: Personal data (NĐ 13/2023). B2B brief creates lead with overrideAccess after validation.
  const lead = await payload.create({
    collection: 'leads',
    data: {
      name: validated.name,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone || undefined,
      message: validated.message || undefined,
      need: 'business',
      brief: {
        company: validated.company,
        teamSize: validated.teamSize || undefined,
        targetBehaviors: validated.targetBehaviors || undefined,
        timeline: validated.timeline || undefined,
      },
      interestTags: [{ text: 'b2b' }],
      consent: true,
      consentAt: new Date().toISOString(),
      source: {
        form: 'b2b',
        page: ctx.page || undefined,
        utm: ctx.utm || undefined,
      },
      followUpStatus: 'new',
    },
    overrideAccess: true,
  })

  // 6. Send emails
  await sendB2BBriefEmails(
    payload,
    {
      name: validated.name,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone,
      company: validated.company,
      teamSize: validated.teamSize,
      targetBehaviors: validated.targetBehaviors,
      timeline: validated.timeline,
      message: validated.message,
    },
    ctx,
    options.emailSender,
  )

  return {
    success: true,
    id: lead.id,
    message: vi.forms.success.b2b,
  }
}
