// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import sitemap, {
  isExcludedFromSitemap,
  getBaseSiteUrl,
  STATIC_SITEMAP_ROUTES,
  EXCLUDED_SITEMAP_PREFIXES,
} from '@/app/sitemap'
import robots, { DISALLOWED_ROBOTS_PATHS } from '@/app/robots'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SEO - Sitemap and Robots', () => {
  describe('isExcludedFromSitemap', () => {
    it('excludes administrative, internal, and private routes', () => {
      for (const prefix of EXCLUDED_SITEMAP_PREFIXES) {
        expect(isExcludedFromSitemap(prefix)).toBe(true)
        expect(isExcludedFromSitemap(`${prefix}/sub-path`)).toBe(true)
      }
    })

    it('permits public routes', () => {
      expect(isExcludedFromSitemap('/')).toBe(false)
      expect(isExcludedFromSitemap('/thu-vien')).toBe(false)
      expect(isExcludedFromSitemap('/coaching/growth-mirror')).toBe(false)
      expect(isExcludedFromSitemap('/blog/bai-viet-1')).toBe(false)
      expect(isExcludedFromSitemap('/chinh-sach-bao-mat')).toBe(false)
    })
  })

  describe('getBaseSiteUrl', () => {
    it('defaults to https://tramdungcamxuc.com when env is empty', () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
      expect(getBaseSiteUrl()).toBe('https://tramdungcamxuc.com')
    })

    it('respects NEXT_PUBLIC_SITE_URL with or without protocol and trailing slashes', () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com/')
      expect(getBaseSiteUrl()).toBe('https://example.com')

      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'example.org')
      expect(getBaseSiteUrl()).toBe('https://example.org')
    })
  })

  describe('sitemap()', () => {
    it('returns empty array when SITE_NOINDEX is true', async () => {
      vi.stubEnv('SITE_NOINDEX', 'true')
      const result = await sitemap()
      expect(result).toEqual([])
    })

    it('includes static routes (home, library, legal pages) when indexable', async () => {
      vi.stubEnv('SITE_NOINDEX', '')
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://tramdungcamxuc.com')

      const result = await sitemap()
      expect(result.length).toBeGreaterThanOrEqual(STATIC_SITEMAP_ROUTES.length)

      const urls = result.map((entry) => entry.url)

      // Home and Library
      expect(urls).toContain('https://tramdungcamxuc.com')
      expect(urls).toContain('https://tramdungcamxuc.com/thu-vien')

      // 6 Legal Pages
      expect(urls).toContain('https://tramdungcamxuc.com/chinh-sach-bao-mat')
      expect(urls).toContain('https://tramdungcamxuc.com/chinh-sach-cung-cap-dich-vu')
      expect(urls).toContain('https://tramdungcamxuc.com/dieu-khoan-su-dung')
      expect(urls).toContain('https://tramdungcamxuc.com/gia-thanh-toan')
      expect(urls).toContain('https://tramdungcamxuc.com/phan-anh-khieu-nai')
      expect(urls).toContain('https://tramdungcamxuc.com/thong-tin-phap-ly')

      // Ensure no excluded prefixes are in sitemap URLs
      for (const entry of result) {
        const path = new URL(entry.url).pathname
        for (const disallowed of EXCLUDED_SITEMAP_PREFIXES) {
          expect(path.startsWith(disallowed)).toBe(false)
        }
      }
    })
  })

  describe('robots()', () => {
    it('blocks all crawlers when SITE_NOINDEX is true', () => {
      vi.stubEnv('SITE_NOINDEX', 'true')
      const result = robots()
      expect(result.rules).toEqual({ userAgent: '*', disallow: '/' })
      expect(result.sitemap).toBeUndefined()
    })

    it('allows indexing public routes and disallows private routes when indexable', () => {
      vi.stubEnv('SITE_NOINDEX', '')
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://tramdungcamxuc.com')

      const result = robots()
      expect(result.rules).toEqual({
        userAgent: '*',
        allow: '/',
        disallow: [...DISALLOWED_ROBOTS_PATHS],
      })
      expect(result.sitemap).toBe('https://tramdungcamxuc.com/sitemap.xml')
    })
  })
})
