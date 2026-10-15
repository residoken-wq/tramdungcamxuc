import 'server-only'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product, EqCard } from '@/payload-types'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import { getAuthSecret } from '@/lib/auth/token'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { vi } from '@/lib/i18n/vi'

export const EQ_DRAW_GUEST_COOKIE = 'eq_draw_guest'

export interface GuestDrawCookieData {
  count: number
  timestamp: number
}

/**
 * REVIEW-REQUIRED: Signs guest draw count cookie using HMAC-SHA256 and PAYLOAD_SECRET.
 * Used to securely enforce the "1 free card" trial limit for unauthenticated guests.
 */
export function signGuestDrawCookie(
  data: GuestDrawCookieData,
  secret: string = getAuthSecret(),
): string {
  const payload = `${data.count}:${data.timestamp}`
  const signature = createHmac('sha256', secret).update(`eq-draw:${payload}`).digest('base64url')
  return `${payload}.${signature}`
}

/**
 * REVIEW-REQUIRED: Verifies guest draw count cookie.
 * If signature is invalid, missing or tampered, treats count as exhausted (count = 1)
 * to strictly prevent unauthorized bypass.
 */
export function verifyGuestDrawCookie(
  cookieValue: string | undefined | null,
  secret: string = getAuthSecret(),
): { valid: boolean; count: number } {
  if (!cookieValue) {
    return { valid: true, count: 0 }
  }

  const parts = cookieValue.split('.')
  if (parts.length !== 2) {
    return { valid: false, count: 1 }
  }

  const [payload, signature] = parts
  const expectedSig = createHmac('sha256', secret).update(`eq-draw:${payload}`).digest('base64url')

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSig)

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, count: 1 }
  }

  const [countStr] = payload.split(':')
  const count = parseInt(countStr, 10)
  if (Number.isNaN(count)) {
    return { valid: false, count: 1 }
  }

  return { valid: true, count }
}

export interface CheckAccessOptions {
  guestCookieOverride?: string | null
  customerIdOverride?: number | null
}

/**
 * REVIEW-REQUIRED: Checks entitlement access for EQ Buddy digital tool.
 * - Logged-in customer: getAccess(customer, eq-buddy-so) must be 'trial' or 'active' for unlimited draws.
 * - Unauthenticated guest: Allowed for first draw (count == 0). Blocked on second draw (count >= 1).
 */
export async function checkEqDrawAccess(options?: CheckAccessOptions): Promise<{
  allowed: boolean
  customerState: 'guest' | 'logged_in'
  accessStatus?: string
  trialDays?: number
}> {
  let customer: { id: number } | null = null
  if (options?.customerIdOverride !== undefined) {
    customer = options.customerIdOverride ? { id: options.customerIdOverride } : null
  } else {
    try {
      customer = await getCurrentCustomer()
    } catch {
      customer = null
    }
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const product = products.docs[0] as Product | undefined
  const trialDays = product?.trialDays ?? 21

  if (customer) {
    if (!product) {
      // Product not set up in the CMS yet: behave like "no access" instead of a 500.
      return { allowed: false, customerState: 'logged_in', accessStatus: 'none', trialDays }
    }

    const now = new Date()
    const access = await getAccess(customer.id, product.id, { payload, now })

    if (access.status === 'trial' || access.status === 'active') {
      return {
        allowed: true,
        customerState: 'logged_in',
        accessStatus: access.status,
        trialDays,
      }
    }

    return {
      allowed: false,
      customerState: 'logged_in',
      accessStatus: access.status,
      trialDays,
    }
  }

  // Unauthenticated guest check
  let rawCookie: string | undefined | null = options?.guestCookieOverride
  if (rawCookie === undefined) {
    try {
      const cookieStore = await cookies()
      rawCookie = cookieStore.get(EQ_DRAW_GUEST_COOKIE)?.value
    } catch {
      rawCookie = null
    }
  }

  const { count } = verifyGuestDrawCookie(rawCookie)
  if (count >= 1) {
    return {
      allowed: false,
      customerState: 'guest',
      accessStatus: 'guest_limit_reached',
      trialDays,
    }
  }

  return {
    allowed: true,
    customerState: 'guest',
    accessStatus: 'guest_first_draw',
    trialDays,
  }
}

export type DrawEqCardInput =
  { mode: 'random'; previousCardCode?: string } | { mode: 'keyword'; qrSlug: string }

export type DrawEqCardResult =
  | {
      success: true
      card: PublicEqCard
      mode: 'random' | 'keyword'
    }
  | {
      success: false
      code: 'PAYWALL'
      reason: string
      accessStatus?: string
      productSlug: string
      trialDays?: number
    }
  | {
      success: false
      code: 'NOT_FOUND' | 'ERROR'
      message: string
    }

export interface DrawOptions extends CheckAccessOptions {
  setCookie?: (name: string, value: string) => void
}

/**
 * Core business logic for drawing an EQ Buddy card.
 * Enforces trial limit, queries published cards, avoids repeating previousCardCode on random.
 */
export async function drawEqCardCore(
  input: DrawEqCardInput,
  options?: DrawOptions,
): Promise<DrawEqCardResult> {
  // 1. Kiểm tra quyền truy cập (khách dùng thử 1 thẻ / thành viên có trial/active)
  const access = await checkEqDrawAccess(options)
  if (!access.allowed) {
    return {
      success: false,
      code: 'PAYWALL',
      reason: 'Trial limit reached',
      accessStatus: access.accessStatus,
      productSlug: EQ_BUDDY_PRODUCT_SLUG,
      trialDays: access.trialDays,
    }
  }

  // 2. Truy vấn thẻ từ cơ sở dữ liệu
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let selectedDoc: EqCard | null = null

  if (input.mode === 'keyword') {
    const cleanSlug = (input.qrSlug || '').trim().toLowerCase()
    if (!cleanSlug) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: vi.eqBuddy.draw.errors.cardNotFound,
      }
    }

    const res = await payload.find({
      collection: 'eqCards',
      where: {
        and: [{ qrSlug: { equals: cleanSlug } }, { _status: { equals: 'published' } }],
      },
      limit: 1,
      depth: 0,
      draft: false,
    })

    selectedDoc = res.docs[0] || null
    if (!selectedDoc) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: vi.eqBuddy.draw.errors.cardNotFound,
      }
    }
  } else {
    // mode === 'random'
    // Only codes first (cheap), then load the chosen card.
    const res = await payload.find({
      collection: 'eqCards',
      where: {
        _status: { equals: 'published' },
      },
      select: { code: true },
      depth: 0,
      limit: 200,
      pagination: false,
      draft: false,
    })

    const allPublished = res.docs
    if (allPublished.length === 0) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: vi.eqBuddy.draw.errors.noCardsAvailable,
      }
    }

    let candidates = allPublished
    if (input.previousCardCode && allPublished.length >= 2) {
      const filtered = allPublished.filter((c) => c.code !== input.previousCardCode)
      if (filtered.length > 0) {
        candidates = filtered
      }
    }

    const randomIndex = Math.floor(Math.random() * candidates.length)
    const chosen = await payload.findByID({
      collection: 'eqCards',
      id: candidates[randomIndex].id,
      depth: 0,
      draft: false,
    })
    selectedDoc = chosen || null
    if (!selectedDoc) {
      return { success: false, code: 'NOT_FOUND', message: vi.eqBuddy.draw.errors.noCardsAvailable }
    }
  }

  // 3. Nếu là khách chưa đăng nhập: đặt cookie ký HMAC đếm lượt rút (lần 1)
  if (access.customerState === 'guest') {
    const signedCookie = signGuestDrawCookie({
      count: 1,
      timestamp: Date.now(),
    })

    if (options?.setCookie) {
      options.setCookie(EQ_DRAW_GUEST_COOKIE, signedCookie)
    } else {
      try {
        const cookieStore = await cookies()
        cookieStore.set(EQ_DRAW_GUEST_COOKIE, signedCookie, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        })
      } catch {
        // Outside request context (e.g. scripts/unit tests without cookies mock)
      }
    }
  }

  // 4. Trả về thông tin thẻ an toàn (chỉ các trường hiển thị)
  const card: PublicEqCard = {
    id: selectedDoc.id as number | string,
    code: (selectedDoc.code as string) || '',
    keywordEn: (selectedDoc.keywordEn as string) || null,
    message: (selectedDoc.message as string) || null,
    promptRecall: (selectedDoc.promptRecall as string) || null,
    promptPack: (selectedDoc.promptPack as string) || null,
    promptAcknowledge: (selectedDoc.promptAcknowledge as string) || null,
    story: selectedDoc.story || null,
    smallAction: (selectedDoc.smallAction as string) || null,
    topic: (selectedDoc.topic as string) || null,
    qrSlug: (selectedDoc.qrSlug as string) || '',
    printedAt: selectedDoc.printedAt ? String(selectedDoc.printedAt) : null,
    order: typeof selectedDoc.order === 'number' ? selectedDoc.order : null,
    _status: (selectedDoc._status as string) || null,
  }

  return {
    success: true,
    card,
    mode: input.mode,
  }
}
