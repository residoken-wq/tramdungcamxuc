import { describe, it, expect } from 'vitest'
import {
  getBlockLockInfo,
  getLockedComponentPermissions,
  isLastRequiredBlock,
  resolveComponentPermissions,
} from '@/puck/locks'
import { vi } from '@/lib/i18n/vi'
import type { Data } from '@puckeditor/core'

describe('EB-14b: Lock Info & Resolution Rules', () => {
  describe('getBlockLockInfo', () => {
    it('locks HeroTwoEntries on homepage with drag, duplicate, delete blocked and canUnlock true', () => {
      const infoRoot = getBlockLockInfo({ type: 'HeroTwoEntries', pageSlug: '/' })
      expect(infoRoot.locked).toBe(true)
      expect(infoRoot.blocked).toEqual(['drag', 'duplicate', 'delete'])
      expect(infoRoot.reason).toBe(vi.eb14b.reasonHeroHomepage)
      expect(infoRoot.canUnlock).toBe(true)

      const infoAlias = getBlockLockInfo({ type: 'HeroTwoEntries', pageSlug: 'trang-chu' })
      expect(infoAlias.locked).toBe(true)
      expect(infoAlias.canUnlock).toBe(true)
    })

    it('does not lock HeroTwoEntries on other pages', () => {
      const info = getBlockLockInfo({ type: 'HeroTwoEntries', pageSlug: 'gioi-thieu' })
      expect(info.locked).toBe(false)
      expect(info.blocked).toEqual([])
      expect(info.reason).toBe('')
      expect(info.canUnlock).toBe(false)
    })

    it('locks LegalFooter on regular pages (delete blocked)', () => {
      const info = getBlockLockInfo({ type: 'LegalFooter', pageSlug: 'gioi-thieu' })
      expect(info.locked).toBe(true)
      expect(info.blocked).toEqual(['delete'])
      expect(info.reason).toBe(vi.eb14b.reasonLegalFooter)
      expect(info.canUnlock).toBe(true)
    })

    it('locks LegalFooter in footer kind (delete and duplicate blocked)', () => {
      const info = getBlockLockInfo({ type: 'LegalFooter', kind: 'footer' })
      expect(info.locked).toBe(true)
      expect(info.blocked).toEqual(['delete', 'duplicate'])
      expect(info.reason).toBe(vi.eb14b.reasonLegalFooter)
      expect(info.canUnlock).toBe(true)
    })

    it('locks HtmlWidget when htmlLocked is true, with canUnlock always false', () => {
      const infoLocked = getBlockLockInfo({
        type: 'HtmlWidget',
        pageSlug: '/',
        htmlLocked: true,
      })
      expect(infoLocked.locked).toBe(true)
      expect(infoLocked.blocked).toEqual(['edit'])
      expect(infoLocked.reason).toBe(vi.eb14b.reasonHtmlLocked)
      expect(infoLocked.canUnlock).toBe(false)

      const infoOpen = getBlockLockInfo({
        type: 'HtmlWidget',
        pageSlug: '/',
        htmlLocked: false,
      })
      expect(infoOpen.locked).toBe(false)
      expect(infoOpen.canUnlock).toBe(false)
    })
  })

  describe('getLockedComponentPermissions (backward compatibility)', () => {
    it('returns original permissions for HeroTwoEntries on homepage', () => {
      const perms = getLockedComponentPermissions('HeroTwoEntries', '/')
      expect(perms).toEqual({
        drag: false,
        duplicate: false,
        delete: false,
        edit: true,
      })
    })

    it('returns undefined for HeroTwoEntries on other pages', () => {
      expect(getLockedComponentPermissions('HeroTwoEntries', 'dich-vu')).toBeUndefined()
    })

    it('returns delete: false for LegalFooter', () => {
      expect(getLockedComponentPermissions('LegalFooter', 'bat-ky')).toEqual({
        delete: false,
      })
    })

    it('returns edit: false for HtmlWidget when htmlLocked is true', () => {
      expect(
        getLockedComponentPermissions('HtmlWidget', '/', { htmlLocked: true }),
      ).toEqual({
        edit: false,
      })
    })
  })

  describe('isLastRequiredBlock', () => {
    it('identifies 1 Hero on homepage as last required, but not 2 Heroes', () => {
      const singleHeroData: Data = {
        content: [
          { type: 'HeroTwoEntries', props: { id: 'hero-1' } },
          { type: 'RichText', props: { id: 'rt-1' } },
        ],
        root: { props: { title: 'Trang chủ' } },
      }
      expect(isLastRequiredBlock(singleHeroData, 'HeroTwoEntries', '/')).toBe(true)
      expect(isLastRequiredBlock(singleHeroData, 'HeroTwoEntries', 'trang-chu')).toBe(true)
      expect(isLastRequiredBlock(singleHeroData, 'RichText', '/')).toBe(false)

      const twoHeroesData: Data = {
        content: [
          { type: 'HeroTwoEntries', props: { id: 'hero-1' } },
          { type: 'HeroTwoEntries', props: { id: 'hero-2' } },
        ],
        root: { props: { title: 'Trang chủ' } },
      }
      expect(isLastRequiredBlock(twoHeroesData, 'HeroTwoEntries', '/')).toBe(false)
    })

    it('handles HeroTwoEntries nested inside Container using walkPuckItemsSync', () => {
      const nestedHeroData: Data = {
        content: [
          {
            type: 'Container',
            props: {
              id: 'container-1',
              items: [
                {
                  type: 'HeroTwoEntries',
                  props: { id: 'nested-hero' },
                },
              ],
            },
          },
        ],
        root: { props: { title: 'Trang chủ' } },
      }
      expect(isLastRequiredBlock(nestedHeroData, 'HeroTwoEntries', '/')).toBe(true)
    })

    it('identifies LegalFooter on footer kind', () => {
      const singleFooterData: Data = {
        content: [{ type: 'LegalFooter', props: { id: 'legal-1' } }],
        root: { props: { title: 'Footer' } },
      }
      expect(isLastRequiredBlock(singleFooterData, 'LegalFooter', '', 'footer')).toBe(true)
      expect(isLastRequiredBlock(singleFooterData, 'LegalFooter', '', 'page')).toBe(false)
    })
  })

  describe('resolveComponentPermissions', () => {
    it('returns open permissions when id is in unlocked list and user is owner', () => {
      const perms = resolveComponentPermissions({
        type: 'HeroTwoEntries',
        id: 'hero-1',
        pageSlug: '/',
        isOwner: true,
        unlockedBlockIds: new Set(['hero-1']),
      })
      expect(perms).toEqual({
        drag: true,
        duplicate: true,
        delete: true,
        edit: true,
      })
    })

    it('returns locked permissions when id is not in unlocked list', () => {
      const perms = resolveComponentPermissions({
        type: 'HeroTwoEntries',
        id: 'hero-1',
        pageSlug: '/',
        isOwner: true,
        unlockedBlockIds: new Set(['other-id']),
      })
      expect(perms).toEqual({
        drag: false,
        duplicate: false,
        delete: false,
        edit: true,
      })
    })

    it('always returns locked permissions when isOwner is false, even if id is in unlocked list', () => {
      const perms = resolveComponentPermissions({
        type: 'HeroTwoEntries',
        id: 'hero-1',
        pageSlug: '/',
        isOwner: false,
        unlockedBlockIds: new Set(['hero-1']),
      })
      expect(perms).toEqual({
        drag: false,
        duplicate: false,
        delete: false,
        edit: true,
      })
    })

    it('never unlocks HtmlWidget even for owner with unlocked id because canUnlock is false', () => {
      const perms = resolveComponentPermissions({
        type: 'HtmlWidget',
        id: 'html-1',
        pageSlug: '/',
        htmlLocked: true,
        isOwner: true,
        unlockedBlockIds: new Set(['html-1']),
      })
      expect(perms).toEqual({
        edit: false,
      })
    })
  })
})

