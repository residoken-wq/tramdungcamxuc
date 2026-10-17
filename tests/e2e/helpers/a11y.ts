import { expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export interface A11yCheckOptions {
  include?: string[]
  exclude?: string[]
}

/**
 * Runs Axe Core analysis on the given page targeting WCAG 2.0 / 2.1 Level A & AA.
 * Asserts that there are 0 violations with 'serious' or 'critical' impact.
 *
 * @param page Playwright Page instance
 * @param label Optional route or context description for error reporting
 * @param options Optional AxeBuilder configuration (include, exclude)
 */
export async function expectNoSeriousA11y(
  page: Page,
  label?: string,
  options?: A11yCheckOptions,
): Promise<void> {
  // Finish CSS transitions at once (motion-reduce:transition-none) so axe does not measure
  // colours mid-fade, e.g. a button fading in from its pre-hydration disabled opacity.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Next streams <title> in after the shell; wait for it so document-title reflects the real page.
  await expect(page).toHaveTitle(/\S/, { timeout: 10000 })

  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])

  if (options?.include) {
    for (const sel of options.include) {
      builder = builder.include(sel)
    }
  }

  if (options?.exclude) {
    for (const sel of options.exclude) {
      builder = builder.exclude(sel)
    }
  }

  const scanResults = await builder.analyze()

  const seriousOrCritical = scanResults.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )

  const contextName = label || page.url() || 'page'

  if (seriousOrCritical.length > 0) {
    const details = seriousOrCritical
      .map((v) => {
        const nodesSummary = v.nodes
          .map((n) => `    - Selector: ${n.target.join(' > ')}\n      HTML: ${n.html}`)
          .join('\n')
        return `[${v.impact?.toUpperCase()}] Rule: ${v.id} (${v.help} - ${v.helpUrl})\n  Details: ${v.description}\n  Nodes:\n${nodesSummary}`
      })
      .join('\n\n')

    console.error(`\n[A11Y] Violations found on ${contextName}:\n${details}\n`)
  }

  expect(
    seriousOrCritical,
    `Expected 0 critical/serious a11y violations on "${contextName}", but found ${seriousOrCritical.length}.\n` +
      seriousOrCritical.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('; '),
  ).toEqual([])
}
