import 'server-only'
import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import { vi } from '../i18n/vi'
import { getAuthSecret } from '../auth/token'

export class RateLimitError extends Error {
  constructor(message = vi.forms.rateLimited) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export function hashRateLimitKey(prefix: string, form: string, rawValue: string): string {
  const secret = getAuthSecret()
  return createHash('sha256')
    .update(`${form}:${prefix}:${rawValue.trim().toLowerCase()}:${secret}`)
    .digest('hex')
}

export interface CheckRateLimitParams {
  form: string
  ip?: string
  email?: string
  windowMinutes?: number
  maxHits?: number
}

export async function checkAndRecordRateLimit(
  payload: Payload,
  params: CheckRateLimitParams,
): Promise<void> {
  const windowMinutes = params.windowMinutes ?? 10
  const maxHits = params.maxHits ?? 5
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const keys: string[] = []
  if (params.ip && params.ip.trim().length > 0) {
    keys.push(hashRateLimitKey('ip', params.form, params.ip))
  }
  if (params.email && params.email.trim().length > 0) {
    keys.push(hashRateLimitKey('email', params.form, params.email))
  }

  // Check rate limit for each key
  for (const key of keys) {
    const result = await payload.count({
      collection: 'rateLimitHits',
      where: {
        and: [{ key: { equals: key } }, { createdAt: { greater_than_equal: cutoff } }],
      },
      overrideAccess: true,
    })

    if (result.totalDocs >= maxHits) {
      throw new RateLimitError()
    }
  }

  // Record hits for current submission
  for (const key of keys) {
    await payload.create({
      collection: 'rateLimitHits',
      data: { key },
      overrideAccess: true,
    })
  }

  // Clean up records older than 1 day
  try {
    await payload.delete({
      collection: 'rateLimitHits',
      where: {
        createdAt: { less_than: oneDayAgo },
      },
      overrideAccess: true,
    })
  } catch (err) {
    console.warn('[RateLimit] Failed to prune records older than 1 day:', err)
  }
}
