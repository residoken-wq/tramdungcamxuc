import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { getSiteUrl } from '@/lib/site-url'
import { type AnalyticsEvent, sanitizeAnalyticsProps } from '@/lib/analytics/track'
import type { SiteSetting } from '@/payload-types'

export const PLAUSIBLE_EVENT_API = 'https://plausible.io/api/event'
export const DEFAULT_SERVER_USER_AGENT = 'TDCX-Server'

export interface TrackServerContext {
  /**
   * Optional Payload instance if caller already has one, avoiding re-initialization.
   */
  payload?: Payload
  /**
   * Optional plausibleDomain to avoid global settings lookup.
   */
  plausibleDomain?: string
  /**
   * Path component of the event URL (e.g. '/thanh-toan', '/api/download').
   * Query params, tokens, and hashes will be stripped.
   */
  path?: string
  /**
   * Request object or header collection to extract User-Agent and X-Forwarded-For.
   */
  req?: Request | { headers?: Headers | Record<string, string | string[] | undefined> }
  headers?: Headers | Record<string, string | string[] | undefined>
  userAgent?: string
  ip?: string
  /**
   * For unit tests: allow bypassing the test environment check (NODE_ENV === 'test' || VITEST).
   */
  bypassTestEnv?: boolean
}

const EVENT_DEFAULT_PATHS: Partial<Record<AnalyticsEvent, string>> = {
  order_paid: '/thanh-toan',
  trial_converted: '/habit',
  trial_expired: '/habit',
  resource_downloaded: '/api/download',
}

function getHeader(
  source: Headers | Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!source) return undefined
  if (typeof (source as Headers).get === 'function') {
    return (source as Headers).get(name) || undefined
  }
  const record = source as Record<string, string | string[] | undefined>
  const val = record[name] ?? record[name.toLowerCase()]
  if (Array.isArray(val)) return val[0]
  return typeof val === 'string' ? val : undefined
}

async function resolvePlausibleDomain(ctx?: TrackServerContext): Promise<string | null> {
  if (ctx?.plausibleDomain !== undefined) {
    return ctx.plausibleDomain.trim() || null
  }
  try {
    const payload = ctx?.payload ?? (await getPayload({ config: await config }))
    const siteSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
      overrideAccess: true,
    })) as SiteSetting | null
    return siteSettings?.analytics?.plausibleDomain?.trim() || null
  } catch {
    return null
  }
}

/**
 * REVIEW-REQUIRED: Gửi sự kiện đo lường từ phía server tới Plausible Events API (AGENTS.md §11).
 * Tuân thủ bảo mật tuyệt đối:
 * - Áp dụng sanitizeAnalyticsProps loại bỏ mọi trường nhạy cảm, PII, email, cảm xúc, reflection.
 * - Không đưa token, mã đơn hay email vào URL sự kiện.
 * - Non-blocking: timeout 2 giây, không ném lỗi nếu mạng trục trặc (console.warn không in props).
 * - Chỉ gửi khi: có plausibleDomain trong siteSettings, SITE_NOINDEX !== 'true', không phải test environment.
 */
export async function trackServer(
  event: AnalyticsEvent,
  props?: Record<string, unknown>,
  ctx?: TrackServerContext,
): Promise<void> {
  // 1. Kiểm tra môi trường test
  const isTestEnv =
    (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST)) && !ctx?.bypassTestEnv
  if (isTestEnv) {
    return
  }

  // 2. Kiểm tra cờ cấm index / đo lường
  if (process.env.SITE_NOINDEX === 'true') {
    return
  }

  // 3. Kiểm tra domain Plausible
  const domain = await resolvePlausibleDomain(ctx)
  if (!domain) {
    return
  }

  // 4. Chuẩn bị URL sự kiện an toàn (không token, không query string, không email)
  const rawPath = ctx?.path || EVENT_DEFAULT_PATHS[event] || '/'
  const cleanPath = rawPath.split('?')[0].split('#')[0].trim() || '/'
  const siteUrl = getSiteUrl().replace(/\/+$/, '')
  const eventUrl = `${siteUrl}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`

  // 5. Làm sạch thuộc tính qua danh sách trắng (whitelist)
  const sanitizedProps = sanitizeAnalyticsProps(event, props)

  // 6. Trích xuất User-Agent & X-Forwarded-For
  const userAgent =
    ctx?.userAgent ||
    getHeader(ctx?.headers, 'user-agent') ||
    (ctx?.req && 'headers' in ctx.req ? getHeader(ctx.req.headers, 'user-agent') : undefined) ||
    DEFAULT_SERVER_USER_AGENT

  const forwardedFor =
    ctx?.ip ||
    getHeader(ctx?.headers, 'x-forwarded-for') ||
    (ctx?.req && 'headers' in ctx.req ? getHeader(ctx.req.headers, 'x-forwarded-for') : undefined)

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': userAgent,
  }
  if (forwardedFor) {
    requestHeaders['X-Forwarded-For'] = forwardedFor
  }

  const payloadBody: {
    name: string
    url: string
    domain: string
    props?: Record<string, string | number | boolean>
  } = {
    name: event,
    url: eventUrl,
    domain,
  }
  if (sanitizedProps) {
    payloadBody.props = sanitizedProps
  }

  try {
    const res = await fetch(PLAUSIBLE_EVENT_API, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payloadBody),
      signal: AbortSignal.timeout(2000),
    })

    if (!res.ok) {
      console.warn(`[AnalyticsServer] Plausible responded with status ${res.status}`)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[AnalyticsServer] Lỗi gửi sự kiện Plausible: ${message}`)
  }
}
