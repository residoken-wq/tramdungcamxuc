import type { Data, Permissions } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { walkPuckItemsSync } from './walk'

export const SITE_HEADER_BLOCKS = ['SiteLogo', 'NavMenu', 'HeaderCTA', 'AccountLink'] as const

export const SITE_FOOTER_BLOCKS = [
  'SiteLogo',
  'NavMenu',
  'HeaderCTA',
  'AccountLink',
  'LegalFooter',
  'SocialLinks',
  'Tagline',
] as const

export const COMMON_THEME_BLOCKS = [
  'Container',
  'HeadingWidget',
  'TextWidget',
  'ImageWidget',
  'ButtonWidget',
  'IconWidget',
  'IconListWidget',
  'Spacer',
  'Divider',
  'HtmlWidget',
] as const

export const ALL_SITE_BLOCKS = [
  'SiteLogo',
  'NavMenu',
  'HeaderCTA',
  'AccountLink',
  'LegalFooter',
  'SocialLinks',
  'Tagline',
] as const

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

  // Khối chân trang pháp lý không được xóa (EB-10 & T1-04)
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

  let hasHero = false
  walkPuckItemsSync(data, (item) => {
    if (item?.type === 'HeroTwoEntries') hasHero = true
  })

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

/**
 * REVIEW-REQUIRED: Xác thực tính hợp lệ của các khối dựa trên loại trang (header / footer / page):
 * - footer: bắt buộc phải có đúng 1 khối LegalFooter, chỉ chứa khối theme cho phép.
 * - header: chỉ chứa khối theme cho phép (không chứa khối bán hàng/form/footer).
 * - page: không chứa các khối dành riêng cho đầu trang/chân trang.
 */
export function validatePageKindBlocks(
  kind: string = 'page',
  data: unknown,
): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: true }
  }

  const blockTypes: string[] = []
  walkPuckItemsSync(data, (item) => {
    if (item?.type) {
      blockTypes.push(item.type)
    }
  })

  if (kind === 'header') {
    const allowed = new Set<string>([...COMMON_THEME_BLOCKS, ...SITE_HEADER_BLOCKS])
    for (const type of blockTypes) {
      if (!allowed.has(type)) {
        return {
          valid: false,
          error: vi.eb10.errorDisallowedBlock(type, vi.eb10.headerRootLabel),
        }
      }
    }
    return { valid: true }
  }

  if (kind === 'footer') {
    const allowed = new Set<string>([...COMMON_THEME_BLOCKS, ...SITE_FOOTER_BLOCKS])
    let legalFooterCount = 0

    for (const type of blockTypes) {
      if (type === 'LegalFooter') {
        legalFooterCount++
      }
      if (!allowed.has(type)) {
        return {
          valid: false,
          error: vi.eb10.errorDisallowedBlock(type, vi.eb10.footerRootLabel),
        }
      }
    }

    if (legalFooterCount === 0) {
      return {
        valid: false,
        error: vi.eb10.errorLegalFooterRequired,
      }
    }

    if (legalFooterCount > 1) {
      return {
        valid: false,
        error: vi.eb10.errorLegalFooterMaxOne,
      }
    }

    return { valid: true }
  }

  // Regular page: cannot contain site blocks
  const disallowedOnPage = new Set<string>(ALL_SITE_BLOCKS)
  for (const type of blockTypes) {
    if (disallowedOnPage.has(type)) {
      return {
        valid: false,
        error: vi.eb10.errorDisallowedBlock(type, vi.eb10.pageBadge),
      }
    }
  }

  return { valid: true }
}
