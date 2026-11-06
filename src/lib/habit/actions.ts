'use server'

import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, Product } from '@/payload-types'
import { handleActionError, type ActionResponse } from '../forms/action-errors'
import { submitHabitPlan, type HabitPlanSubmissionResult } from '../habit.server'
import { HABIT_OFFER_PATH } from '../habit'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getCurrentCustomer } from '../auth/session.server'
import { startTrialAction } from '../entitlements/actions'
import { getAccess, getTrialEligibility } from '../entitlements/service.server'

export type HabitPlanActionResponse = ActionResponse & {
  planId?: number
  zaloGroupUrl?: string
  trackerDestination?: string
  trialDays?: number
  trialStarted?: boolean
}

export type HabitStageGateStatus = 'login' | 'ok' | 'buy'

export interface HabitStageGateResult {
  status: HabitStageGateStatus
  loginUrl?: string
  trialAvailable?: boolean
  daysLeft?: number | null
  buyUrl?: string
  offerUrl?: string
  price?: number | null
  salePrice?: number | null
  customer?: {
    id: number
    email: string
    name?: string | null
    hasConsent?: boolean
  }
}

/**
 * REVIEW-REQUIRED: DP-03 Đánh giá trạng thái cổng sau Giai đoạn 1 Habit (/habit/5-phut).
 * Helper phía server nhận tùy chọn customer, payload, now phục vụ cả Server Action và Unit Test.
 */
export async function getHabitStageGate(options?: {
  customer?: Customer | null
  payload?: Payload
  now?: Date
}): Promise<HabitStageGateResult> {
  const customer = options && 'customer' in options ? options.customer : await getCurrentCustomer()

  const loginUrl = `/tai-khoan/dang-nhap?next=${encodeURIComponent('/habit/5-phut?buoc=3')}`
  const buyUrl = `/thanh-toan?san-pham=${encodeURIComponent(HABIT_TRACKER_PRODUCT_SLUG)}`
  const offerUrl = HABIT_OFFER_PATH

  if (!customer) {
    return {
      status: 'login',
      loginUrl,
    }
  }

  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const now = options?.now ?? new Date()

  const productRes = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: HABIT_TRACKER_PRODUCT_SLUG },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const product = productRes.docs[0] as Product | undefined

  if (!product || product.saleStatus !== 'on_sale' || product._status !== 'published') {
    console.warn('[HabitStageGate] Product habit-tracker-so not found or not on sale')
    return {
      status: 'ok',
      trialAvailable: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        hasConsent: Boolean(customer.consentAt),
      },
    }
  }

  const access = await getAccess(customer.id, product.id, { payload, now })

  if (access.hasAccess) {
    return {
      status: 'ok',
      trialAvailable: false,
      daysLeft: access.daysLeft,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        hasConsent: Boolean(customer.consentAt),
      },
    }
  }

  const eligibility = await getTrialEligibility(customer.id, product.id, { payload, now })

  if (eligibility.eligible) {
    return {
      status: 'ok',
      trialAvailable: true,
      daysLeft: null,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        hasConsent: Boolean(customer.consentAt),
      },
    }
  }

  return {
    status: 'buy',
    buyUrl,
    offerUrl,
    price: product.price ?? null,
    salePrice: product.salePrice ?? null,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      hasConsent: Boolean(customer.consentAt),
    },
  }
}

/**
 * REVIEW-REQUIRED: DP-03 Server Action lấy trạng thái cổng sau Giai đoạn 1 Habit (/habit/5-phut).
 * Đọc khách từ phiên qua getCurrentCustomer(), không nhận customerId từ trình duyệt.
 */
export async function getHabitStageGateAction(
  overrideCustomer?: Customer | null,
): Promise<HabitStageGateResult> {
  const customer = overrideCustomer !== undefined ? overrideCustomer : await getCurrentCustomer()
  return await getHabitStageGate({ customer })
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
