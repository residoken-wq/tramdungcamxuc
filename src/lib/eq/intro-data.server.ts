import 'server-only'
import type { Payload } from 'payload'
import { EQ_INTRO_CONTENT_KEYS, type EqIntroContent } from './intro-view'

export interface EqIntroData {
  /** Intro fields of the "Nội dung EQ Buddy" global; `shopeeUrl` already falls back to the deck. */
  content: EqIntroContent
  /** `eqAccessMode = free`: no trial banner. */
  isFreeMode: boolean
}

/**
 * Data of the /eq-buddy intro, used by the coded page, the "EQ Buddy" builder blocks (BX-08b)
 * and their builder preview. Only the public intro fields are returned.
 */
export async function getEqIntroData(payload: Payload): Promise<EqIntroData> {
  const [physicalRes, eqContent] = await Promise.all([
    payload
      .find({
        collection: 'products',
        where: {
          and: [
            { type: { equals: 'physical_external' } },
            { web: { equals: 'eq' } },
            { saleStatus: { not_equals: 'hidden' } },
            { _status: { equals: 'published' } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null),
    payload
      .findGlobal({ slug: 'eqBuddyContent', depth: 0, overrideAccess: true })
      .catch(() => null),
  ])
  const raw = (eqContent || {}) as Record<string, unknown>
  const physical = physicalRes?.docs[0] as { externalUrl?: string | null } | undefined

  const content: EqIntroContent = {}
  for (const key of EQ_INTRO_CONTENT_KEYS) {
    const value = raw[key]
    if (value !== undefined) (content as Record<string, unknown>)[key] = value
  }
  content.shopeeUrl =
    (typeof raw.shopeeUrl === 'string' && raw.shopeeUrl.trim()) ||
    physical?.externalUrl?.trim() ||
    ''

  return { content, isFreeMode: raw.eqAccessMode === 'free' }
}
