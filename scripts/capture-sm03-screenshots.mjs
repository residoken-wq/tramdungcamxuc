import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

async function run() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/sm03')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const browser = await chromium.launch()
  
  // 1. Desktop 1440px
  console.log('Capturing Desktop 1440px...')
  const pageDesktop = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  })
  await pageDesktop.goto('http://localhost:3000/styleguide', { waitUntil: 'networkidle' })
  await pageDesktop.waitForTimeout(1000)

  // 1. HeroTwoEntries v2 (with image)
  const heroH3 = pageDesktop.locator('text=5. HeroTwoEntries v2')
  if (await heroH3.count() > 0) {
    const heroBox = heroH3.locator('..')
    await heroBox.scrollIntoViewIfNeeded()
    await pageDesktop.waitForTimeout(500)
    await heroBox.screenshot({ path: path.join(outDir, '01-hero-two-entries-desktop-1440.png') })
    console.log('Saved 01-hero-two-entries-desktop-1440.png')
  }

  // 2. PackageCards
  const pkgCardsH3 = pageDesktop.locator('text=7. PackageCards')
  if (await pkgCardsH3.count() > 0) {
    const pkgCardsBox = pkgCardsH3.locator('..')
    await pkgCardsBox.scrollIntoViewIfNeeded()
    await pageDesktop.waitForTimeout(500)
    await pkgCardsBox.screenshot({ path: path.join(outDir, '02-package-cards-desktop-1440.png') })
    console.log('Saved 02-package-cards-desktop-1440.png')
  }

  // 3. SolutionEcosystem
  const ecoH3 = pageDesktop.locator('text=9. SolutionEcosystem')
  if (await ecoH3.count() > 0) {
    const ecoBox = ecoH3.locator('..')
    await ecoBox.scrollIntoViewIfNeeded()
    await pageDesktop.waitForTimeout(500)
    await ecoBox.screenshot({ path: path.join(outDir, '03-solution-ecosystem-desktop-1440.png') })
    console.log('Saved 03-solution-ecosystem-desktop-1440.png')
  }

  // 4. TestimonialGrid story variant
  const testH3 = pageDesktop.locator('text=10. TestimonialGrid v2')
  if (await testH3.count() > 0) {
    const testBox = testH3.locator('..')
    await testBox.scrollIntoViewIfNeeded()
    await pageDesktop.waitForTimeout(500)
    await testBox.screenshot({ path: path.join(outDir, '04-testimonial-grid-story-desktop-1440.png') })
    console.log('Saved 04-testimonial-grid-story-desktop-1440.png')
  }

  // 2. Mobile 375px
  console.log('Capturing Mobile 375px...')
  const pageMobile = await browser.newPage({
    viewport: { width: 375, height: 812 },
    isMobile: true
  })
  await pageMobile.goto('http://localhost:3000/styleguide', { waitUntil: 'networkidle' })
  await pageMobile.waitForTimeout(1000)

  // 5. PackageComparison mobile (3 cards stacked)
  const pkgCompH3M = pageMobile.locator('text=8. PackageComparison v3')
  if (await pkgCompH3M.count() > 0) {
    const pkgCompBoxM = pkgCompH3M.locator('..')
    await pkgCompBoxM.scrollIntoViewIfNeeded()
    await pageMobile.waitForTimeout(500)
    await pkgCompBoxM.screenshot({ path: path.join(outDir, '05-package-comparison-mobile-375.png') })
    console.log('Saved 05-package-comparison-mobile-375.png')
  }

  // 6. HeroTwoEntries mobile
  const heroH3M = pageMobile.locator('text=5. HeroTwoEntries v2')
  if (await heroH3M.count() > 0) {
    const heroBoxM = heroH3M.locator('..')
    await heroBoxM.scrollIntoViewIfNeeded()
    await pageMobile.waitForTimeout(500)
    await heroBoxM.screenshot({ path: path.join(outDir, '06-hero-two-entries-mobile-375.png') })
    console.log('Saved 06-hero-two-entries-mobile-375.png')
  }

  // 7. SolutionEcosystem mobile
  const ecoH3M = pageMobile.locator('text=9. SolutionEcosystem')
  if (await ecoH3M.count() > 0) {
    const ecoBoxM = ecoH3M.locator('..')
    await ecoBoxM.scrollIntoViewIfNeeded()
    await pageMobile.waitForTimeout(500)
    await ecoBoxM.screenshot({ path: path.join(outDir, '07-solution-ecosystem-mobile-375.png') })
    console.log('Saved 07-solution-ecosystem-mobile-375.png')
  }

  await browser.close()
  console.log('Done capturing all requested screenshots!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
