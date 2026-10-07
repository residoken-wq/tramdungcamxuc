'use server'

import { headers } from 'next/headers'
import { ZodError } from 'zod'
import {
  submitB2BBrief,
  submitCoachingForm,
  submitLead,
  submitResourceRequest,
  type SubmissionResult,
} from './submit.server'
import { RateLimitError } from './ratelimit.server'
import { TurnstileError } from './turnstile.server'
import { vi } from '../i18n/vi'

export interface ActionResponse {
  success: boolean
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
}

async function getClientContext(): Promise<{ ip?: string; page?: string }> {
  try {
    const headerList = await headers()
    const forwardedFor = headerList.get('x-forwarded-for')
    const realIp = headerList.get('x-real-ip')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || undefined
    const page = headerList.get('referer') || undefined
    return { ip, page }
  } catch {
    return {}
  }
}

export function handleActionError(err: unknown): ActionResponse {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of err.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      success: false,
      error: err.issues[0]?.message || 'Dữ liệu không hợp lệ',
      fieldErrors,
    }
  }

  if (err instanceof RateLimitError) {
    return {
      success: false,
      error: err.message,
    }
  }

  if (err instanceof TurnstileError) {
    return {
      success: false,
      error: err.message,
    }
  }

  // REVIEW-REQUIRED: Never leak internal database, server, or unhandled errors to browser client.
  console.error('[Forms] Unhandled server action error:', err)
  return {
    success: false,
    error: vi.forms.serverError,
  }
}

export async function submitLeadAction(
  data: Record<string, unknown>,
  extra?: { utm?: string },
): Promise<ActionResponse> {
  try {
    const ctx = await getClientContext()
    const res: SubmissionResult = await submitLead(data, {
      ...ctx,
      utm: extra?.utm || (typeof data.utm === 'string' ? data.utm : undefined),
    })
    return {
      success: res.success,
      message: res.message,
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function submitCoachingAction(
  data: Record<string, unknown>,
  extra?: { utm?: string },
): Promise<ActionResponse> {
  try {
    const ctx = await getClientContext()
    const res: SubmissionResult = await submitCoachingForm(data, {
      ...ctx,
      utm: extra?.utm || (typeof data.utm === 'string' ? data.utm : undefined),
    })
    return {
      success: res.success,
      message: res.message,
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function submitB2BBriefAction(
  data: Record<string, unknown>,
  extra?: { utm?: string },
): Promise<ActionResponse> {
  try {
    const ctx = await getClientContext()
    const res: SubmissionResult = await submitB2BBrief(data, {
      ...ctx,
      utm: extra?.utm || (typeof data.utm === 'string' ? data.utm : undefined),
    })
    return {
      success: res.success,
      message: res.message,
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function submitResourceRequestAction(
  data: Record<string, unknown>,
  extra?: { utm?: string },
): Promise<ActionResponse> {
  try {
    const ctx = await getClientContext()
    const res: SubmissionResult = await submitResourceRequest(data, {
      ...ctx,
      utm: extra?.utm || (typeof data.utm === 'string' ? data.utm : undefined),
    })
    return {
      success: res.success,
      message: res.message,
    }
  } catch (err) {
    return handleActionError(err)
  }
}
