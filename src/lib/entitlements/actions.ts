'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { startTrial } from '@/lib/entitlements/service.server'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { getToolUrl } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'

export interface StartTrialActionResult {
  success: boolean
  code:
    | 'TRIAL_STARTED'
    | 'TRIAL_ACTIVE'
    | 'TRIAL_ALREADY_USED'
    | 'ALREADY_HAVE_ACTIVE'
    | 'NOT_ELIGIBLE'
    | 'PRODUCT_NOT_FOUND'
    | 'RATE_LIMITED'
    | 'UNAUTHENTICATED'
    | 'ERROR'
  message: string
  toolUrl?: string
  days?: number
}

// REVIEW-REQUIRED: Server action bắt đầu dùng thử công cụ số cho khách hàng.
// - Khách hàng xác thực từ phiên server (getCurrentCustomer), không nhận customer ID từ client.
// - Kiểm tra giới hạn tần suất (rate limit) chống lạm dụng kích hoạt tự động.
// - Kích hoạt trial thông qua startTrial (bảo toàn ràng buộc unique trialKey).
export async function startTrialAction(productSlug: string): Promise<StartTrialActionResult> {
  try {
    const customer = await getCurrentCustomer()
    if (!customer) {
      return {
        success: false,
        code: 'UNAUTHENTICATED',
        message: vi.auth.unauthorizedNotice,
      }
    }

    const payload = await getPayload({ config: await config })

    let ip: string | undefined
    try {
      const headerStore = await getHeaders()
      const forwarded = headerStore.get('x-forwarded-for')
      ip =
        (forwarded ? forwarded.split(',')[0].trim() : headerStore.get('x-real-ip')?.trim()) ||
        undefined
    } catch {
      // Ngoài request scope
    }

    // Rate limiting: tối đa 5 lần mỗi 10 phút theo IP / email
    try {
      await checkAndRecordRateLimit(payload, {
        form: 'trial_start',
        email: customer.email,
        ip,
        maxHits: 5,
        windowMinutes: 10,
      })
    } catch (err) {
      if (err instanceof RateLimitError) {
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: err.message,
        }
      }
      throw err
    }

    const trimmedSlug = (productSlug || '').trim()
    if (!trimmedSlug) {
      return {
        success: false,
        code: 'NOT_ELIGIBLE',
        message: vi.trial.productNotFound,
      }
    }

    const productsRes = await payload.find({
      collection: 'products',
      where: { slug: { equals: trimmedSlug } },
      overrideAccess: true,
      limit: 1,
    })

    const product = productsRes.docs[0] as Product | undefined
    if (
      !product ||
      product._status !== 'published' ||
      product.type !== 'digital_tool' ||
      product.saleStatus !== 'on_sale' ||
      typeof product.trialDays !== 'number' ||
      product.trialDays <= 0
    ) {
      return {
        success: false,
        code: 'NOT_ELIGIBLE',
        message: vi.trial.productNotFound,
      }
    }

    const now = new Date()
    const result = await startTrial(customer.id, product.id, { payload, now })

    const toolUrl = getToolUrl(product)

    if (result.code === 'TRIAL_STARTED') {
      return {
        success: true,
        code: 'TRIAL_STARTED',
        message: result.message,
        toolUrl,
        days: product.trialDays,
      }
    }

    if (result.code === 'TRIAL_ACTIVE' || result.code === 'ALREADY_HAVE_ACTIVE') {
      return {
        success: true,
        code: result.code,
        message: result.message,
        toolUrl,
        days: result.daysLeft ?? undefined,
      }
    }

    return {
      success: false,
      code: result.code,
      message: result.message,
    }
  } catch (err: unknown) {
    console.error('[TrialAction] Unexpected error in startTrialAction:', err)
    return {
      success: false,
      code: 'ERROR',
      message: vi.trial.generalError,
    }
  }
}
