import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

async function run() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/eb14')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const browser = await chromium.launch()

  try {
    // 1. Desktop 1440px
    console.log('Capturing Desktop 1440px...')
    const pageDesktop = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await pageDesktop.goto('http://localhost:3000/styleguide', { waitUntil: 'networkidle' })
    await pageDesktop.waitForTimeout(1000)

    // Capture Split Cũ
    const splitCu = pageDesktop.locator('#demo-eb14-split-cu')
    if ((await splitCu.count()) > 0) {
      await splitCu.scrollIntoViewIfNeeded()
      await pageDesktop.waitForTimeout(300)
      await splitCu.screenshot({ path: path.join(outDir, 'split-cu-1440.png') })
      console.log('Saved split-cu-1440.png')
    }

    // Capture Backdrop Tối
    const backdropToi = pageDesktop.locator('#demo-eb14-backdrop-toi')
    if ((await backdropToi.count()) > 0) {
      await backdropToi.scrollIntoViewIfNeeded()
      await pageDesktop.waitForTimeout(300)
      await backdropToi.screenshot({ path: path.join(outDir, 'backdrop-toi-1440.png') })
      console.log('Saved backdrop-toi-1440.png')
    }

    // Capture Backdrop Sáng
    const backdropSang = pageDesktop.locator('#demo-eb14-backdrop-sang')
    if ((await backdropSang.count()) > 0) {
      await backdropSang.scrollIntoViewIfNeeded()
      await pageDesktop.waitForTimeout(300)
      await backdropSang.screenshot({ path: path.join(outDir, 'backdrop-sang-1440.png') })
      console.log('Saved backdrop-sang-1440.png')
    }

    // Capture Rows Text Column
    const rowsTextCol = pageDesktop.locator('#demo-eb14-rows-text-column')
    if ((await rowsTextCol.count()) > 0) {
      await rowsTextCol.scrollIntoViewIfNeeded()
      await pageDesktop.waitForTimeout(300)
      await rowsTextCol.screenshot({ path: path.join(outDir, 'rows-text-column-1440.png') })
      console.log('Saved rows-text-column-1440.png')
    }

    await pageDesktop.close()

    // 2. Mobile 375px
    console.log('Capturing Mobile 375px...')
    const pageMobile = await browser.newPage({
      viewport: { width: 375, height: 667 },
    })
    await pageMobile.goto('http://localhost:3000/styleguide', { waitUntil: 'networkidle' })
    await pageMobile.waitForTimeout(1000)

    const mobileToi = pageMobile.locator('#demo-eb14-backdrop-toi')
    if ((await mobileToi.count()) > 0) {
      await mobileToi.scrollIntoViewIfNeeded()
      await pageMobile.waitForTimeout(300)
      await mobileToi.screenshot({ path: path.join(outDir, 'backdrop-toi-375.png') })
      console.log('Saved backdrop-toi-375.png')
    }

    const mobileSang = pageMobile.locator('#demo-eb14-backdrop-sang')
    if ((await mobileSang.count()) > 0) {
      await mobileSang.scrollIntoViewIfNeeded()
      await pageMobile.waitForTimeout(300)
      await mobileSang.screenshot({ path: path.join(outDir, 'backdrop-sang-375.png') })
      console.log('Saved backdrop-sang-375.png')
    }

    const mobileRows = pageMobile.locator('#demo-eb14-rows-text-column')
    if ((await mobileRows.count()) > 0) {
      await mobileRows.scrollIntoViewIfNeeded()
      await pageMobile.waitForTimeout(300)
      await mobileRows.screenshot({ path: path.join(outDir, 'rows-text-column-375.png') })
      console.log('Saved rows-text-column-375.png')
    }

    await pageMobile.close()
    console.log('All screenshots captured successfully!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err)
  process.exit(1)
})
