import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, Product } from '@/payload-types'
import { HABIT_OFFER_PATH } from '../habit'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getCurrentCustomer } from '../auth/session.server'
import { getAccess, getTrialEligibility } from '../entitlements/service.server'
import { HABIT_GATE_LOGIN_URL, type HabitStageGateResult } from './stage-gate'

/**
 * REVIEW-REQUIRED: DP-03 Đánh giá trạng thái cổng sau Giai đoạn 1 Habit (/habit/5-phut).
 * Server-only (không nằm trong file 'use server'), nên trình duyệt không gọi được với
 * `customer` tự đặt. `customer` / `payload` / `now` chỉ dành cho unit test; bỏ trống thì
 * khách đọc từ phiên.
 */
export async function getHabitStageGate(options?: {
  customer?: Customer | null
  payload?: Payload
  now?: Date
}): Promise<HabitStageGateResult> {
  const customer =
    options && 'customer' in options ? (options.customer ?? null) : await getCurrentCustomer()

  if (!customer) return { status: 'login', loginUrl: HABIT_GATE_LOGIN_URL }

  const self = {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    hasConsent: Boolean(customer.consentAt),
  }
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const now = options?.now ?? new Date()

  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const product = docs[0] as Product | undefined

  if (!product || product.saleStatus !== 'on_sale' || product._status !== 'published') {
    // Configuration problem: do not block the customer (DP-03 §1.1). No customer data logged.
    console.warn('[HabitStageGate] Product habit-tracker-so not found or not on sale')
    return { status: 'ok', trialAvailable: true, customer: self }
  }

  const access = await getAccess(customer.id, product.id, { payload, now })
  if (access.hasAccess) {
    return { status: 'ok', trialAvailable: false, daysLeft: access.daysLeft, customer: self }
  }

  const eligibility = await getTrialEligibility(customer.id, product.id, { payload, now })
  if (eligibility.eligible) {
    return { status: 'ok', trialAvailable: true, daysLeft: null, customer: self }
  }

  return {
    status: 'buy',
    buyUrl: `/thanh-toan?san-pham=${encodeURIComponent(HABIT_TRACKER_PRODUCT_SLUG)}`,
    offerUrl: HABIT_OFFER_PATH,
    price: product.price ?? null,
    salePrice: product.salePrice ?? null,
    customer: self,
  }
}
