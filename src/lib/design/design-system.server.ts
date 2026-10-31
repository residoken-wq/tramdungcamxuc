import 'server-only'
import { cache } from 'react'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { DesignSystem } from '@/payload-types'
import { cleanDesignSystem, DEFAULT_DESIGN_SYSTEM, type CleanDesignSystem } from './design-system'

async function readDesignSystem(payloadInstance?: Payload): Promise<CleanDesignSystem> {
  try {
    const payload = payloadInstance ?? (await getPayload({ config }))
    const raw = (await payload.findGlobal({
      slug: 'designSystem',
      depth: 0,
    })) as DesignSystem | null
    return cleanDesignSystem(raw)
  } catch (error) {
    // Never break a public page because the design settings could not be read.
    console.error('[designSystem] read failed, using Brand Book defaults', error)
    return DEFAULT_DESIGN_SYSTEM
  }
}

/**
 * EB-01: cleaned design tokens + brand lock switches for this installation, cached per request.
 * Falls back to the Brand Book 2026 defaults when the global is empty or unreadable.
 */
export const getDesignSystem: (payloadInstance?: Payload) => Promise<CleanDesignSystem> =
  cache(readDesignSystem)
