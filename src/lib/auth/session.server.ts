import 'server-only'
import { cookies } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer } from '@/payload-types'
import {
  CUSTOMER_TOKEN_COOKIE,
  DEFAULT_CUSTOMER_SESSION_EXPIRATION,
  verifyCustomerToken,
} from './token'

/**
 * REVIEW-REQUIRED: Set customer session cookie (httpOnly, secure in prod, sameSite=lax).
 */
export async function setCustomerSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === 'production'
  cookieStore.set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: DEFAULT_CUSTOMER_SESSION_EXPIRATION,
  })
}

/**
 * REVIEW-REQUIRED: Clear customer session cookie on logout.
 */
export async function clearCustomerSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CUSTOMER_TOKEN_COOKIE)
}

/**
 * Reads the customer session token from request cookies.
 */
export async function getCurrentCustomerToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value || null
}

/**
 * REVIEW-REQUIRED: Resolves the authenticated customer from session cookie.
 * Returns Customer document if token is valid and customer exists, null otherwise.
 */
export async function getCurrentCustomer(injectedPayload?: Payload): Promise<Customer | null> {
  const token = await getCurrentCustomerToken()
  if (!token) return null

  const secret = process.env.PAYLOAD_SECRET || 'tramdungcamxuc-default-secret'
  const verified = verifyCustomerToken(token, secret)
  if (!verified) return null

  const payload = injectedPayload || (await getPayload({ config }))
  try {
    const customer = await payload.findByID({
      collection: 'customers',
      id: verified.id,
      overrideAccess: true,
    })
    return (customer as Customer) || null
  } catch {
    return null
  }
}
