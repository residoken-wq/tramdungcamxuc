'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'
import { requestOtp, verifyOtp, OtpVerificationError } from './otp.server'
import {
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
  getCurrentCustomer,
  revokeCustomerSession,
} from './session.server'
import { vi } from '../i18n/vi'
import { RateLimitError } from '../forms/ratelimit.server'
import { TurnstileError } from '../forms/turnstile.server'

import { getSafeRedirectUrl } from './redirect'

async function getClientIp(): Promise<string | undefined> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return headerList.get('x-real-ip') || undefined
}

export interface AuthActionResult {
  success: boolean
  message?: string
  error?: string
  redirectTo?: string
}

/**
 * REVIEW-REQUIRED: Server action to request customer login OTP.
 */
export async function requestOtpAction(
  prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  try {
    const email = String(formData.get('email') || '')
    const honeypot = String(formData.get('honeypot') || '')
    const turnstileToken = String(formData.get('turnstileToken') || '')

    const ip = await getClientIp()
    const result = await requestOtp({ email, honeypot, turnstileToken }, { ip })
    return {
      success: true,
      message: result.message,
    }
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { success: false, error: err.message }
    }
    if (err instanceof TurnstileError) {
      return { success: false, error: err.message }
    }
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0]?.message
      return { success: false, error: firstIssue || vi.forms.validation.emailInvalid }
    }
    console.error('[AuthAction] requestOtpAction error:', err)
    return { success: false, error: vi.builder.error }
  }
}

/**
 * REVIEW-REQUIRED: Server action to verify OTP and set customer session cookie.
 */
export async function verifyOtpAction(
  prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  try {
    const email = String(formData.get('email') || '')
    const code = String(formData.get('code') || '')
    const consentPolicy =
      formData.get('consentPolicy') === 'true' || formData.get('consentPolicy') === 'on'
    const consentMarketing =
      formData.get('consentMarketing') === 'true' || formData.get('consentMarketing') === 'on'
    const next = formData.get('next') ? String(formData.get('next')) : null

    const ip = await getClientIp()
    const result = await verifyOtp({ email, code, consentPolicy, consentMarketing }, { ip })

    await setCustomerSessionCookie(result.token)

    return {
      success: true,
      redirectTo: getSafeRedirectUrl(next),
    }
  } catch (err) {
    if (err instanceof OtpVerificationError) {
      return { success: false, error: err.message }
    }
    if (err instanceof RateLimitError) {
      return { success: false, error: err.message }
    }
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0]?.message
      return { success: false, error: firstIssue || vi.auth.invalidCode }
    }
    console.error('[AuthAction] verifyOtpAction error:', err)
    return { success: false, error: vi.builder.error }
  }
}

/**
 * REVIEW-REQUIRED: Server action to log out customer.
 * Revokes customer session server-side across all devices by atomically incrementing sessionVersion
 * via a single UPDATE query (session_version = session_version + 1), then clears the session cookie.
 */
export async function logoutAction(): Promise<void> {
  try {
    // Chỉ phiên còn hiệu lực (đúng sessionVersion) mới được thu hồi: token đã bị thu hồi không thể
    // gọi lại để đăng xuất khách khỏi mọi thiết bị lần nữa.
    const customer = await getCurrentCustomer()
    if (customer?.id) {
      await revokeCustomerSession(customer.id)
    }
  } catch (err) {
    console.error('[AuthAction] logoutAction error revoking session:', err)
  } finally {
    await clearCustomerSessionCookie()
    redirect('/tai-khoan/dang-nhap')
  }
}
