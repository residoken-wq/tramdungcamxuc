import { describe, it, expect } from 'vitest'
import {
  isHomepageSlug,
  getLockedComponentPermissions,
  validatePageLockedBlocks,
} from '@/puck/locks'
import type { Data } from '@puckeditor/core'

describe('Puck Locked Blocks & Permissions (T1-04)', () => {
  describe('isHomepageSlug', () => {
    it('identifies homepage variants', () => {
      expect(isHomepageSlug('/')).toBe(true)
      expect(isHomepageSlug('')).toBe(true)
      expect(isHomepageSlug('trang-chu')).toBe(true)
      expect(isHomepageSlug('/trang-chu/')).toBe(true)
      expect(isHomepageSlug('gioi-thieu')).toBe(false)
      expect(isHomepageSlug('/coaching')).toBe(false)
    })
  })

  describe('getLockedComponentPermissions', () => {
    it('locks drag, duplicate, and delete for HeroTwoEntries on homepage', () => {
      const permsRoot = getLockedComponentPermissions('HeroTwoEntries', '/')
      expect(permsRoot).toEqual({
        drag: false,
        duplicate: false,
        delete: false,
        edit: true,
      })

      const permsAlias = getLockedComponentPermissions('HeroTwoEntries', 'trang-chu')
      expect(permsAlias).toEqual({
        drag: false,
        duplicate: false,
        delete: false,
        edit: true,
      })
    })

    it('does not lock HeroTwoEntries on other pages', () => {
      const perms = getLockedComponentPermissions('HeroTwoEntries', 'dich-vu')
      expect(perms).toBeUndefined()
    })

    it('locks delete for legal footer blocks', () => {
      expect(getLockedComponentPermissions('Footer', '/')).toEqual({ delete: false })
      expect(getLockedComponentPermissions('LegalFooter', 'gioi-thieu')).toEqual({
        delete: false,
      })
    })

    it('returns undefined for normal components', () => {
      expect(getLockedComponentPermissions('RichText', '/')).toBeUndefined()
      expect(getLockedComponentPermissions('LeadForm', '/')).toBeUndefined()
    })
  })

  describe('validatePageLockedBlocks (Server validation)', () => {
    const validHomepageData: Data = {
      root: { props: { title: 'Trang chủ' } },
      content: [
        {
          type: 'HeroTwoEntries',
          props: {
            id: 'hero-1',
            titleLine1: 'DÒNG 1',
            titleLine2: 'DÒNG 2',
          },
        },
        {
          type: 'RichText',
          props: {
            id: 'text-1',
            content: 'Nội dung',
          },
        },
      ],
    }

    const invalidHomepageData: Data = {
      root: { props: { title: 'Trang chủ' } },
      content: [
        {
          type: 'HeroImage',
          props: {
            id: 'hero-img-1',
            titleLine1: 'DÒNG 1',
            titleLine2: 'DÒNG 2',
          },
        },
      ],
    }

    it('allows homepage when HeroTwoEntries is present', () => {
      const resRoot = validatePageLockedBlocks('/', validHomepageData)
      expect(resRoot.valid).toBe(true)
      expect(resRoot.error).toBeUndefined()

      const resAlias = validatePageLockedBlocks('trang-chu', validHomepageData)
      expect(resAlias.valid).toBe(true)
    })

    it('rejects homepage when HeroTwoEntries is missing with Vietnamese error', () => {
      const resRoot = validatePageLockedBlocks('/', invalidHomepageData)
      expect(resRoot.valid).toBe(false)
      expect(resRoot.error).toContain('Hero 2 lối vào (HeroTwoEntries)')

      const resEmpty = validatePageLockedBlocks('/', { content: [] })
      expect(resEmpty.valid).toBe(false)
      expect(resEmpty.error).toBeDefined()
    })

    it('allows non-homepage slugs without HeroTwoEntries', () => {
      const res = validatePageLockedBlocks('gioi-thieu', invalidHomepageData)
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })
  })
})
