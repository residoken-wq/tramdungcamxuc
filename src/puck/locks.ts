import type { Permissions } from '@puckeditor/core'
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

export type BlockAction = 'drag' | 'duplicate' | 'delete' | 'edit'

export type BlockLockInfoParams = {
  type?: string
  pageSlug?: string
  kind?: string
  htmlLocked?: boolean
}

export type BlockLockInfo = {
  locked: boolean
  blocked: BlockAction[]
  reason: string
  canUnlock: boolean
}

/**
 * Nguồn luật khoá duy nhất cho các khối trong hệ thống:
 * - Hero 2 lối vào trên trang chủ: không xoá, không đổi chỗ, không nhân bản (có thể mở khoá thủ công).
 * - Chân trang pháp lý: không xoá, ở footer không nhân bản (có thể mở khoá thủ công).
 * - Khối HTML khi Thiết kế hệ thống đang khoá: không sửa (không thể mở khoá ở đây).
 */
export function getBlockLockInfo({
  type,
  pageSlug = '',
  kind = 'page',
  htmlLocked = false,
}: BlockLockInfoParams): BlockLockInfo {
  if (type === 'HeroTwoEntries' && isHomepageSlug(pageSlug)) {
    return {
      locked: true,
      blocked: ['drag', 'duplicate', 'delete'],
      reason: vi.eb14b.reasonHeroHomepage,
      canUnlock: true,
    }
  }

  if (type === 'Footer' || type === 'LegalFooter') {
    if (kind === 'footer') {
      return {
        locked: true,
        blocked: ['delete', 'duplicate'],
        reason: vi.eb14b.reasonLegalFooter,
        canUnlock: true,
      }
    }
    return {
      locked: true,
      blocked: ['delete'],
      reason: vi.eb14b.reasonLegalFooter,
      canUnlock: true,
    }
  }

  if (type === 'HtmlWidget' && htmlLocked) {
    return {
      locked: true,
      blocked: ['edit'],
      reason: vi.eb14b.reasonHtmlLocked,
      canUnlock: false,
    }
  }

  return {
    locked: false,
    blocked: [],
    reason: '',
    canUnlock: false,
  }
}

/**
 * Kiểm tra xem một khối có bị khóa quyền trong Puck editor dựa trên component type và slug trang không.
 */
export function getLockedComponentPermissions(
  componentType: string,
  pageSlug: string = '',
  options?: { kind?: string; htmlLocked?: boolean },
): Partial<Permissions> | undefined {
  const info = getBlockLockInfo({
    type: componentType,
    pageSlug,
    kind: options?.kind,
    htmlLocked: options?.htmlLocked,
  })

  if (!info.locked) {
    return undefined
  }

  const perms: Partial<Permissions> = {}
  for (const b of info.blocked) {
    perms[b] = false
  }

  if (isHomepageSlug(pageSlug) && componentType === 'HeroTwoEntries') {
    perms.edit = true
  }

  return perms
}

/**
 * REVIEW-REQUIRED: Quyết định quyền thao tác khối trong Puck editor dựa trên quyền khoá và trạng thái mở khoá thủ công của owner.
 * - id trong danh sách mở khoá → quyền mở;
 * - không có → quyền khoá;
 * - owner = false thì luôn khoá.
 */
export function resolveComponentPermissions(params: {
  type: string
  id?: string
  pageSlug?: string
  kind?: string
  htmlLocked?: boolean
  isOwner?: boolean
  unlockedBlockIds?: ReadonlySet<string> | string[]
}): Partial<Permissions> | undefined {
  const {
    type,
    id,
    pageSlug = '',
    kind = 'page',
    htmlLocked = false,
    isOwner = false,
    unlockedBlockIds,
  } = params

  const lockInfo = getBlockLockInfo({ type, pageSlug, kind, htmlLocked })
  if (!lockInfo.locked) {
    return undefined
  }

  const isUnlocked = Boolean(
    isOwner &&
      lockInfo.canUnlock &&
      id &&
      (unlockedBlockIds instanceof Set
        ? unlockedBlockIds.has(id)
        : Array.isArray(unlockedBlockIds)
          ? unlockedBlockIds.includes(id)
          : false),
  )

  if (isUnlocked) {
    return {
      drag: true,
      duplicate: true,
      delete: true,
      edit: true,
    }
  }

  const perms: Partial<Permissions> = {}
  for (const b of lockInfo.blocked) {
    perms[b] = false
  }
  if (isHomepageSlug(pageSlug) && type === 'HeroTwoEntries') {
    perms.edit = true
  }
  return perms
}

/**
 * REVIEW-REQUIRED: Kiểm tra xem một khối có phải là khối bắt buộc duy nhất còn lại không.
 * - Trang chủ: HeroTwoEntries (bắt buộc ít nhất 1)
 * - Chân trang (kind='footer'): LegalFooter (bắt buộc đúng 1)
 */
export function isLastRequiredBlock(
  data: unknown,
  type: string,
  pageSlug: string = '',
  kind: string = 'page',
): boolean {
  if (isHomepageSlug(pageSlug) && type === 'HeroTwoEntries') {
    let count = 0
    walkPuckItemsSync(data, (item) => {
      if (item?.type === 'HeroTwoEntries') count++
    })
    return count <= 1
  }

  if (kind === 'footer' && type === 'LegalFooter') {
    let count = 0
    walkPuckItemsSync(data, (item) => {
      if (item?.type === 'LegalFooter') count++
    })
    return count <= 1
  }

  return false
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

    if (isLegalFooterHidden(data)) {
      return { valid: false, error: vi.eb10.errorLegalFooterHidden }
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

const hidesOnSomeDevice = (props: Record<string, unknown>) => {
  const style = props._style
  if (!style || typeof style !== 'object') return false
  const hideOn = (style as { hideOn?: unknown }).hideOn
  return Array.isArray(hideOn) && hideOn.length > 0
}

/**
 * REVIEW-REQUIRED: EB-10c – true when a LegalFooter block, or any block containing it, is hidden on
 * some device through `_style.hideOn`. The legal links must show on every page and screen, so the
 * footer save is refused and the public layout adds the code legal strip.
 */
export function isLegalFooterHidden(data: unknown): boolean {
  let hidden = false
  const walk = (value: unknown, ancestorHidden: boolean): void => {
    if (hidden || !value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (const el of value) walk(el, ancestorHidden)
      return
    }
    const node = value as { type?: unknown; props?: unknown }
    if (typeof node.type === 'string' && node.props && typeof node.props === 'object') {
      const props = node.props as Record<string, unknown>
      const here = ancestorHidden || hidesOnSomeDevice(props)
      if (node.type === 'LegalFooter' && here) {
        hidden = true
        return
      }
      for (const child of Object.values(props)) walk(child, here)
      return
    }
    for (const child of Object.values(value)) walk(child, ancestorHidden)
  }
  const d = data as { content?: unknown; zones?: unknown }
  walk(d?.content, false)
  walk(d?.zones, false)
  return hidden
}
