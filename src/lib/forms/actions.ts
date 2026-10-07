'use server'

// Server Action modules may only export async functions; shared helpers live in action-errors.ts.
import { handleActionError, type ActionResponse } from './action-errors'

export type { ActionResponse }

import { headers } from 'next/headers'
import {
  submitB2BBrief,
  submitCoachingForm,
  submitLead,
  type SubmissionResult,
} from './submit.server'
import { vi } from '../i18n/vi'

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
