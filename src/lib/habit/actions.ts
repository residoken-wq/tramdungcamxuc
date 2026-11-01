'use server'

import { headers } from 'next/headers'
import { handleActionError, type ActionResponse } from '../forms/action-errors'
import { submitHabitPlan, type HabitPlanSubmissionResult } from '../habit.server'
import { HABIT_OFFER_PATH } from '../habit'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getCurrentCustomer } from '../auth/session.server'
import { startTrialAction } from '../entitlements/actions'

export type HabitPlanActionResponse = ActionResponse & {
  planId?: number
  zaloGroupUrl?: string
  trackerDestination?: string
  trialDays?: number
  trialStarted?: boolean
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

// REVIEW-REQUIRED: submitHabitPlan thực thi lưu kế hoạch và tạo lead trong cùng 1 transaction (T2-17, HB-22, HB-25)
// HB-25: Lấy customer từ phiên qua getCurrentCustomer(), truyền customerId qua options xuống submitHabitPlan (không tin dữ liệu client).
export async function submitHabitPlanAction(
  data: Record<string, unknown>,
  extra?: { utm?: string },
): Promise<HabitPlanActionResponse> {
  try {
    const ctx = await getClientContext()
    const customer = await getCurrentCustomer()

    const res: HabitPlanSubmissionResult = await submitHabitPlan(
      data,
      {
        ...ctx,
        utm: extra?.utm || (typeof data.utm === 'string' ? data.utm : undefined),
      },
      {
        customerId: customer ? customer.id : undefined,
      },
    )

    if (!res.success) {
      return { success: false }
    }

    // HB-22: Điều hướng tới tracker:
    // - Khách đã đăng nhập: thử kích hoạt dùng thử hoặc vào thẳng tracker nếu đã có quyền.
    // - Khách chưa đăng nhập: đi luồng OTP với ?next=/habit/tracker.
    let trackerDestination = '/tai-khoan/dang-nhap?next=/habit/tracker'
    let trialStarted = false
    let trialDays: number | undefined

    try {
      if (customer) {
        const trialRes = await startTrialAction(HABIT_TRACKER_PRODUCT_SLUG)
        if (trialRes.success && trialRes.code === 'TRIAL_STARTED') {
          trialStarted = true
          trialDays = trialRes.days
          trackerDestination = '/habit/tracker'
        } else if (trialRes.code === 'TRIAL_ACTIVE' || trialRes.code === 'ALREADY_HAVE_ACTIVE') {
          trackerDestination = '/habit/tracker'
        } else if (trialRes.code === 'NOT_ELIGIBLE') {
          trackerDestination = HABIT_OFFER_PATH
        } else {
          trackerDestination = '/habit/tracker'
        }
      }
    } catch {
      // Giữ destination mặc định
    }

    return {
      success: true,
      planId: res.planId,
      zaloGroupUrl: res.zaloGroupUrl,
      trackerDestination,
      trialDays,
      trialStarted,
    }
  } catch (err) {
    return handleActionError(err)
  }
}
