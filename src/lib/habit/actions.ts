'use server'

import { headers } from 'next/headers'
import { handleActionError, type ActionResponse } from '../forms/action-errors'
import { submitHabitPlan, type HabitPlanSubmissionResult } from '../habit.server'

export type HabitPlanActionResponse = ActionResponse & {
  planId?: number
  zaloGroupUrl?: string
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

// REVIEW-REQUIRED: submitHabitPlan thực thi lưu kế hoạch và tạo lead trong cùng 1 transaction (T2-17)
export async function submitHabitPlanAction(
  data: Record<string, unknown>,
  extra?: { utm?: string },
): Promise<HabitPlanActionResponse> {
  try {
    const ctx = await getClientContext()
    const res: HabitPlanSubmissionResult = await submitHabitPlan(data, {
      ...ctx,
      utm: extra?.utm || (typeof data.utm === 'string' ? data.utm : undefined),
    })
    return {
      success: res.success,
      planId: res.planId,
      zaloGroupUrl: res.zaloGroupUrl,
    }
  } catch (err) {
    return handleActionError(err)
  }
}
