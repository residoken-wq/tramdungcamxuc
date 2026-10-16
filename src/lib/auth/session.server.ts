import 'server-only'
import { cookies } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import type { Customer } from '@/payload-types'
import {
  CUSTOMER_TOKEN_COOKIE,
  DEFAULT_CUSTOMER_SESSION_EXPIRATION,
  getAuthSecret,
  verifyCustomerToken,
} from './token'

interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

function getDrizzleDb(payload: Payload): DrizzleDbExecutor | null {
  const db = (payload.db as unknown as { drizzle?: DrizzleDbExecutor })?.drizzle
  return db && typeof db.execute === 'function' ? db : null
}

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
 * Returns Customer document if token is valid, customer exists, and sessionVersion matches.
 * Returns null if token sv does not match customer.sessionVersion (session revoked).
 */
export async function getCurrentCustomer(injectedPayload?: Payload): Promise<Customer | null> {
  const token = await getCurrentCustomerToken()
  if (!token) return null

  const secret = getAuthSecret()
  const verified = verifyCustomerToken(token, secret)
  if (!verified) return null

  const payload = injectedPayload || (await getPayload({ config }))
  try {
    const customer = await payload.findByID({
      collection: 'customers',
      id: verified.id,
      overrideAccess: true,
    })
    if (!customer) return null

    // REVIEW-REQUIRED: Check session version to reject revoked sessions
    const customerSv = typeof customer.sessionVersion === 'number' ? customer.sessionVersion : 0
    const tokenSv = typeof verified.sv === 'number' ? verified.sv : 0
    if (tokenSv !== customerSv) {
      return null
    }

    return (customer as Customer) || null
  } catch {
    return null
  }
}

/**
 * REVIEW-REQUIRED: Atomically increment sessionVersion for a customer in the database.
 * Executes a single UPDATE statement: session_version = session_version + 1.
 * Invalidates all active customer sessions across all devices.
 */
export async function revokeCustomerSession(
  customerId: number,
  injectedPayload?: Payload,
): Promise<void> {
  const payload = injectedPayload || (await getPayload({ config }))
  const db = getDrizzleDb(payload)
  const nowIso = new Date().toISOString()
  if (db) {
    await db.execute(
      sql`UPDATE "customers" SET "session_version" = COALESCE("session_version", 0) + 1, "updated_at" = ${nowIso}::timestamptz WHERE "id" = ${customerId}`,
    )
  } else {
    const customer = await payload.findByID({
      collection: 'customers',
      id: customerId,
      overrideAccess: true,
    })
    if (customer) {
      await payload.update({
        collection: 'customers',
        id: customerId,
        data: {
          sessionVersion: ((customer.sessionVersion as number) ?? 0) + 1,
        },
        overrideAccess: true,
      })
    }
  }
}
