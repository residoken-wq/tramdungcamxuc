'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { loadLeadMagnetItems } from '@/lib/lead-magnets.server'
import type { LeadMagnetItem } from '@/components/site/LeadMagnetCarousel'

/**
 * QA PK-27b: builder preview of the "Tài nguyên miễn phí" block. The public page gets its cards
 * from `resolve.server.ts`; the builder has no server resolve, so it asks here. Admins only.
 */
export async function previewLeadMagnetsAction(
  mode: 'auto' | 'manual',
  manualIds: Array<string | number>,
): Promise<LeadMagnetItem[]> {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user || !isAdminUser(user)) return []
  return loadLeadMagnetItems(payload, mode === 'manual' ? 'manual' : 'auto', manualIds)
}
