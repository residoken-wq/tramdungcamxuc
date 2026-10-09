import type { CollectionConfig } from 'payload'
import { vi } from '@/lib/i18n/vi'

export type PreviewCollection = 'services' | 'programs' | 'posts'
export type PreviewSearchParams = Record<string, string | string[] | undefined>

const routes = { services: 'coaching', programs: 'doanh-nghiep', posts: 'blog' } as const

export function buildDetailPreviewUrl(
  collection: PreviewCollection,
  data: { slug?: unknown; id?: unknown },
): string | null {
  if (typeof data.slug !== 'string' || !data.slug.trim()) return null
  const query = new URLSearchParams({ preview: '1' })
  if (typeof data.id === 'number' || typeof data.id === 'string') {
    query.set('previewId', String(data.id))
  }
  return `/${routes[collection]}/${encodeURIComponent(data.slug.trim())}?${query}`
}

export function detailLivePreview(
  collection: PreviewCollection,
): NonNullable<CollectionConfig['admin']>['livePreview'] {
  return {
    url: ({ data }) => buildDetailPreviewUrl(collection, data),
    breakpoints: [
      { name: 'mobile', label: vi.livePreview.mobile, width: 375, height: 667 },
      { name: 'tablet', label: vi.livePreview.tablet, width: 768, height: 1024 },
      { name: 'desktop', label: vi.livePreview.desktop, width: 1440, height: 900 },
    ],
  }
}
