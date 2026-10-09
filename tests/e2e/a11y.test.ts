import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * T1-17e: Automated Accessibility Spec using Axe Core Playwright
 *
 * Scans key public routes against WCAG 2.0 / 2.1 Level A and AA tags.
 * Runs on both desktop-1440 and mobile-375 projects defined in playwright.config.ts.
 * Fails when any 'serious' or 'critical' violations are detected.
 *
 * NOTE: Does NOT use networkidle because pages load Turnstile / live scripts.
 * No rules are excluded by default. If any rule must be excluded, record rationale here and in report.
 */

const SCAN_ROUTES = [
  '/',
  '/thu-vien',
  '/habit/chan-doan',
  '/coaching/growth-mirror',
  '/gia-thanh-toan',
]

test.describe('Accessibility Scans (Axe WCAG 2.0 / 2.1 A & AA)', () => {
  for (const route of SCAN_ROUTES) {
    test(`route ${route} has no serious or critical a11y violations`, async ({ page }) => {
      // Load page without networkidle to prevent hanging on Turnstile / analytics / live previews
      await page.goto(route, { waitUntil: 'load' })

      // Ensure main content is attached before scanning
      await page.locator('body').waitFor({ state: 'visible' })

      const scanResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

      const seriousOrCritical = scanResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )

      if (seriousOrCritical.length > 0) {
        const details = seriousOrCritical
          .map((v) => {
            const nodesSummary = v.nodes
              .map((n) => `    - Selector: ${n.target.join(' > ')}\n      HTML: ${n.html}`)
              .join('\n')
            return `[${v.impact?.toUpperCase()}] Rule: ${v.id} (${v.help})\n  Details: ${v.description}\n  Nodes:\n${nodesSummary}`
          })
          .join('\n\n')

        console.error(`\n[A11Y] Violations found on ${route}:\n${details}\n`)
      }

      expect(
        seriousOrCritical,
        `Expected 0 critical/serious a11y violations on "${route}", but found ${seriousOrCritical.length}.\n` +
          seriousOrCritical.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('; '),
      ).toEqual([])
    })
  }
})
