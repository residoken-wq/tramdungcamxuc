import type { CollectionConfig, GlobalConfig } from 'payload'
import { vi } from '@/lib/i18n/vi'
import { PATHS } from '@/lib/paths'

export type PreviewCollection =
  | 'services'
  | 'programs'
  | 'posts'
  | 'products'
  | 'lessons'
  | 'eqCards'
  | 'testimonials'
  | 'legalPages'
  | 'workshops'

export type PreviewGlobal = 'siteSettings' | 'navigation'

export type PreviewTarget = PreviewCollection | PreviewGlobal

export type PreviewSearchParams = Record<string, string | string[] | undefined>

export const LIVE_PREVIEW_BREAKPOINTS = [
  { name: 'mobile', label: vi.livePreview.mobile, width: 375, height: 667 },
  { name: 'tablet', label: vi.livePreview.tablet, width: 768, height: 1024 },
  { name: 'desktop', label: vi.livePreview.desktop, width: 1440, height: 900 },
]

function getValidString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getValidId(value: unknown): string | number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

function appendPreviewQuery(path: string, previewId?: string | number | null): string {
  const query = new URLSearchParams({ preview: '1' })
  if (previewId !== undefined && previewId !== null) {
    query.set('previewId', String(previewId))
  }
  return `${path}?${query.toString()}`
}

/**
 * Xây dựng URL xem trước (Live Preview) cho bản ghi hoặc global trong CMS.
 *
 * Quy tắc ánh xạ (docs/plan/CMS_UX.md mục 7):
 * - `products`:
 *   - digital_tool + habit -> `/habit/1-percent-better`
 *   - ebook | toolkit -> `/tai-nguyen/[slug]` (bắt buộc slug)
 *   - package -> `/lo-trinh-chuyen-minh` (PATHS.journey)
 *   - còn lại -> `/xem-truoc/san-pham/[id]` (bắt buộc id)
 * - `lessons`: `/habit/hoc/[id]` (bắt buộc id)
 * - `eqCards`: `/eq-buddy/the/[qrSlug]` (bắt buộc qrSlug)
 * - `testimonials`: `/xem-truoc/loi-chia-se/[id]` (bắt buộc id)
 * - `legalPages`: `/[slug]` (bắt buộc slug)
 * - `workshops`: `/xem-truoc/workshop/[id]` (bắt buộc id)
 * - `siteSettings` / `navigation`: `/`
 * - `services`: `/coaching/[slug]` (bắt buộc slug)
 * - `programs`: `/doanh-nghiep/[slug]` (bắt buộc slug)
 * - `posts`: `/blog/[slug]` (bắt buộc slug)
 *
 * Trả về `null` nếu thiếu thông tin bắt buộc (slug/qrSlug/id) -> Payload hiển thị "Lưu nháp để xem trước".
 */
export function buildPreviewUrl(
  target: PreviewTarget,
  data?: Record<string, unknown> | null,
): string | null {
  // Global settings luôn trỏ về trang chủ
  if (target === 'siteSettings' || target === 'navigation') {
    return appendPreviewQuery('/')
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const id = getValidId(data.id)

  switch (target) {
    case 'services': {
      const slug = getValidString(data.slug)
      if (!slug) return null
      return appendPreviewQuery(`/coaching/${encodeURIComponent(slug)}`, id)
    }

    case 'programs': {
      const slug = getValidString(data.slug)
      if (!slug) return null
      return appendPreviewQuery(`/doanh-nghiep/${encodeURIComponent(slug)}`, id)
    }

    case 'posts': {
      const slug = getValidString(data.slug)
      if (!slug) return null
      return appendPreviewQuery(`/blog/${encodeURIComponent(slug)}`, id)
    }

    case 'products': {
      const type = typeof data.type === 'string' ? data.type : ''
      const web = typeof data.web === 'string' ? data.web : ''

      if (type === 'digital_tool' && web === 'habit') {
        return appendPreviewQuery('/habit/1-percent-better', id)
      }

      if (type === 'ebook' || type === 'toolkit') {
        const slug = getValidString(data.slug)
        if (!slug) return null
        return appendPreviewQuery(`/tai-nguyen/${encodeURIComponent(slug)}`, id)
      }

      if (type === 'package') {
        return appendPreviewQuery(PATHS.journey, id)
      }

      // Còn lại: sản phẩm Shopee, workshop, coaching trial, B2B, hoặc digital_tool khác
      if (id === null) return null
      return appendPreviewQuery(`/xem-truoc/san-pham/${encodeURIComponent(String(id))}`)
    }

    case 'lessons': {
      if (id === null) return null
      return appendPreviewQuery(`/habit/hoc/${encodeURIComponent(String(id))}`)
    }

    case 'eqCards': {
      const qrSlug = getValidString(data.qrSlug)
      if (!qrSlug) return null
      return appendPreviewQuery(`/eq-buddy/the/${encodeURIComponent(qrSlug)}`, id)
    }

    case 'testimonials': {
      if (id === null) return null
      return appendPreviewQuery(`/xem-truoc/loi-chia-se/${encodeURIComponent(String(id))}`)
    }

    case 'legalPages': {
      const slug = getValidString(data.slug)
      if (!slug) return null
      return appendPreviewQuery(`/${encodeURIComponent(slug)}`, id)
    }

    case 'workshops': {
      if (id === null) return null
      return appendPreviewQuery(`/xem-truoc/workshop/${encodeURIComponent(String(id))}`)
    }

    default:
      return null
  }
}

/** Giữ nguyên alias tương thích cho các lệnh gọi từ T1-10b */
export function buildDetailPreviewUrl(
  collection: PreviewCollection,
  data?: Record<string, unknown> | null,
): string | null {
  return buildPreviewUrl(collection, data)
}

export function collectionLivePreview(
  collection: PreviewCollection,
): NonNullable<CollectionConfig['admin']>['livePreview'] {
  return {
    url: ({ data }) => buildPreviewUrl(collection, data as Record<string, unknown>),
    breakpoints: LIVE_PREVIEW_BREAKPOINTS,
  }
}

export function globalLivePreview(
  globalSlug: PreviewGlobal,
): NonNullable<GlobalConfig['admin']>['livePreview'] {
  return {
    url: ({ data }) => buildPreviewUrl(globalSlug, data as Record<string, unknown>),
    breakpoints: LIVE_PREVIEW_BREAKPOINTS,
  }
}

/** Giữ nguyên alias tương thích cho các collection từ T1-10b */
export const detailLivePreview = collectionLivePreview
