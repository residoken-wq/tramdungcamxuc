import { expect, test } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import { LEGACY_REDIRECTS, PATHS } from '@/lib/paths'

// Gate verification for Sitemap v2 (SM-08).
// Runs only on a seeded database:
//   pnpm seed && E2E_SEEDED=1 pnpm exec playwright test tests/e2e/sitemap-v2-gate.test.ts
// Skipped on empty CI databases to prevent false alarms.
test.skip(!process.env.E2E_SEEDED, 'Requires seeded database (run with E2E_SEEDED=1).')

const STATIC_TREE_PAGES = [
  PATHS.home, // '/'
  PATHS.journey, // '/lo-trinh-chuyen-minh'
  '/eq-buddy',
  '/habit/1-percent-better',
  PATHS.coaching, // '/coaching'
  PATHS.about, // '/ve-tram'
  PATHS.resources, // '/tai-nguyen'
  PATHS.community, // '/cong-dong'
  PATHS.contact, // '/lien-he'
  PATHS.faq, // '/cau-hoi-thuong-gap'
] as const

const FALLBACK_BUSINESS_PAGES = [
  '/doanh-nghiep/eq-development-for-clarity',
  '/doanh-nghiep/habit-formation-for-resilience',
] as const

test.describe('Sitemap v2 Gate: Navigation Menu Links', () => {
  test('all navigation links (mainMenu, submenus, footerMenu) return HTTP 200', async ({
    request,
  }) => {
    const navRes = await request.get('/api/globals/navigation?depth=1')
    expect(navRes.status()).toBe(200)
    const navData = await navRes.json()

    const internalLinks = new Set<string>()

    function extractLink(item: {
      linkType?: string
      url?: string | null
      page?: { slug?: string } | string | null
      children?: Array<{
        items?: Array<{
          linkType?: string
          url?: string | null
          page?: { slug?: string } | string | null
        }>
      }>
    }) {
      if (!item) return

      if (item.linkType === 'url' && typeof item.url === 'string') {
        const u = item.url.trim()
        if (u.startsWith('/') && !u.startsWith('//')) {
          internalLinks.add(u)
        }
      } else if (item.linkType === 'page') {
        if (item.page && typeof item.page === 'object' && item.page.slug) {
          const s = String(item.page.slug).trim()
          internalLinks.add(
            s === 'home' || s === 'index' || s === '/' ? '/' : s.startsWith('/') ? s : `/${s}`,
          )
        } else if (typeof item.page === 'string') {
          const s = item.page.trim()
          internalLinks.add(s.startsWith('/') ? s : `/${s}`)
        }
      }

      if (Array.isArray(item.children)) {
        for (const group of item.children) {
          if (Array.isArray(group?.items)) {
            for (const child of group.items) {
              extractLink(child)
            }
          }
        }
      }
    }

    for (const item of navData.mainMenu || []) {
      extractLink(item)
    }
    for (const item of navData.footerMenu || []) {
      extractLink(item)
    }

    expect(internalLinks.size).toBeGreaterThan(0)

    for (const link of internalLinks) {
      const res = await request.get(link, { maxRedirects: 5 })
      expect(res.status(), `Link "${link}" from navigation did not return 200`).toBe(200)
    }
  })
})

test.describe('Sitemap v2 Gate: Legacy Redirects', () => {
  for (const { from, to } of LEGACY_REDIRECTS) {
    test(`legacy route ${from} returns 308 redirecting to ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status(), `Redirect status for ${from} should be 308`).toBe(308)
      expect(res.headers()['location']).toBe(to)
    })
  }
})

test.describe('Sitemap v2 Gate: Submenu Interactions', () => {
  test('mobile 375px: drawer opens "Sản phẩm" with 2 groups (Cá nhân & Doanh nghiệp)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const toggle = page.locator('#mobile-nav-toggle').first()
    await expect(toggle).toBeVisible()
    await toggle.click()

    const drawer = page.locator('#mobile-nav-drawer').first()
    await expect(drawer).toBeVisible()

    const trigger = drawer.getByRole('button', { name: /Sản phẩm/ })
    await expect(trigger).toBeVisible()
    await trigger.click()

    await expect(drawer.getByText(/Dành cho Cá nhân/)).toBeVisible()
    await expect(drawer.getByText(/Dành cho Doanh nghiệp/)).toBeVisible()
  })

  test('desktop 1440px: submenu opens by keyboard Enter and closes with Escape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).first()
    await expect(nav).toBeVisible()

    const trigger = nav.getByRole('button', { name: /Sản phẩm/ })
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })
})

test.describe('Sitemap v2 Gate: 1.1 Tree Pages (200, no horizontal overflow, A11y)', () => {
  // Extract business pages dynamically or use fallback
  let allPages: string[] = [...STATIC_TREE_PAGES, ...FALLBACK_BUSINESS_PAGES]

  test.beforeAll(async ({ request }) => {
    try {
      const navRes = await request.get('/api/globals/navigation?depth=1')
      if (navRes.status() === 200) {
        const navData = await navRes.json()
        const businessLinks: string[] = []
        for (const item of navData.mainMenu || []) {
          for (const group of item.children || []) {
            if (group.groupLabel?.includes('Doanh nghiệp')) {
              for (const child of group.items || []) {
                if (typeof child.url === 'string' && child.url.startsWith('/doanh-nghiep/')) {
                  businessLinks.push(child.url)
                }
              }
            }
          }
        }
        if (businessLinks.length >= 2) {
          allPages = Array.from(new Set([...STATIC_TREE_PAGES, ...businessLinks.slice(0, 2)]))
        }
      }
    } catch {
      // Fallback array remains in place
    }
  })

  for (const pagePath of [...STATIC_TREE_PAGES, ...FALLBACK_BUSINESS_PAGES]) {
    test(`page "${pagePath}" renders 200 without overflow and passes a11y`, async ({ page }) => {
      // Uses domcontentloaded instead of networkidle to prevent hanging on Turnstile/analytics
      const response = await page.goto(pagePath, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `Page ${pagePath} did not return 200`).toBe(200)

      await page.locator('body').waitFor({ state: 'visible' })
      await page.waitForSelector('main', { timeout: 15000 })

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(isOverflowing, `Horizontal overflow detected on ${pagePath}`).toBe(false)

      await expectNoSeriousA11y(page, pagePath)
    })
  }
})
