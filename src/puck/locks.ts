import type { Data, Permissions } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'

/**
 * Kiểm tra xem slug có phải là trang chủ không ('/' hoặc 'trang-chu').
 */
export function isHomepageSlug(slug: string): boolean {
  const normalized = (slug || '').trim().replace(/^\/+|\/+$/g, '')
  return normalized === '' || normalized === 'trang-chu'
}

/**
 * Kiểm tra xem một khối có bị khóa quyền trong Puck editor dựa trên component type và slug trang không.
 */
export function getLockedComponentPermissions(
  componentType: string,
  pageSlug: string,
): Partial<Permissions> | undefined {
  if (isHomepageSlug(pageSlug) && componentType === 'HeroTwoEntries') {
    return {
      drag: false,
      duplicate: false,
      delete: false,
      edit: true,
    }
  }

  // Khối chân trang pháp lý (nếu có trong dữ liệu) không được xóa
  if (componentType === 'Footer' || componentType === 'LegalFooter') {
    return {
      delete: false,
    }
  }

  return undefined
}

/**
 * Xác thực dữ liệu bố cục trang trên server:
 * Trang chủ ('/' hoặc 'trang-chu') bắt buộc phải có ít nhất một khối HeroTwoEntries.
 */
export function validatePageLockedBlocks(
  slug: string,
  data: unknown,
): { valid: boolean; error?: string } {
  if (!isHomepageSlug(slug)) {
    return { valid: true }
  }

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error:
        vi.builder.errorHeroRequired ||
        'Trang chủ bắt buộc phải có khối Hero 2 lối vào (HeroTwoEntries).',
    }
  }

  const puckData = data as Partial<Data>
  const content = Array.isArray(puckData.content) ? puckData.content : []

  const hasHero = content.some(
    (item) => item && typeof item === 'object' && item.type === 'HeroTwoEntries',
  )
  if (!hasHero) {
    return {
      valid: false,
      error:
        vi.builder.errorHeroRequired ||
        'Trang chủ bắt buộc phải có khối Hero 2 lối vào (HeroTwoEntries).',
    }
  }

  return { valid: true }
}
