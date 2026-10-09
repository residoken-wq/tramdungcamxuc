import 'server-only'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import {
  SERVICE_PUBLIC_SELECT,
  PROGRAM_PUBLIC_SELECT,
  POST_PUBLIC_SELECT,
} from '@/lib/detail-pages'
import type { PreviewCollection, PreviewSearchParams } from '@/lib/live-preview'

const selects = {
  services: SERVICE_PUBLIC_SELECT,
  programs: PROGRAM_PUBLIC_SELECT,
  posts: POST_PUBLIC_SELECT,
} as const

/** Request-scoped only: callers use force-dynamic; never put drafts in a shared cache. */
export async function getDetailPreview(
  collection: PreviewCollection,
  slug: string,
  search: PreviewSearchParams,
): Promise<Record<string, unknown> | null> {
  if (search.preview !== '1') return null
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  // REVIEW-REQUIRED: Query parameters never authorize drafts. Only authenticated Payload admins
  // may read them; also enforce collection/field access with overrideAccess: false.
  if (!isAdminUser(user)) return null
  const result = await payload.find({
    collection,
    where:
      typeof search.previewId === 'string'
        ? { id: { equals: search.previewId } }
        : { slug: { equals: slug } },
    select: selects[collection],
    draft: true,
    overrideAccess: false,
    user,
    depth: 1,
    limit: 1,
  })
  return (result.docs[0] as unknown as Record<string, unknown>) ?? null
}
