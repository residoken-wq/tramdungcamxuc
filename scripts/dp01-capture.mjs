import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const REPO_URL = 'http://localhost:3000'
const ZIP_URL = 'http://localhost:3100'

const OUT_REPO_DIR = path.resolve(process.cwd(), 'docs/screenshots/dp01')
const OUT_COMPARE_DIR = path.resolve(process.cwd(), '../dp01-compare')

// Ensure directories exist
for (const dir of [OUT_REPO_DIR, OUT_COMPARE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Stitch two image buffers side by side: left (zip), right (repo)
 */
async function stitchSideBySide(leftBuffer, rightBuffer, outputPath, title = '') {
  const leftMeta = await sharp(leftBuffer).metadata()
  const rightMeta = await sharp(rightBuffer).metadata()

  const targetHeight = Math.max(leftMeta.height, rightMeta.height)
  const leftWidth = Math.round((leftMeta.width * targetHeight) / leftMeta.height)
  const rightWidth = Math.round((rightMeta.width * targetHeight) / rightMeta.height)

  const leftResized = await sharp(leftBuffer).resize(leftWidth, targetHeight).toBuffer()
  const rightResized = await sharp(rightBuffer).resize(rightWidth, targetHeight).toBuffer()

  const headerHeight = 40
  const totalWidth = leftWidth + rightWidth + 10
  const totalHeight = targetHeight + headerHeight

  const svgHeader = `
    <svg width="${totalWidth}" height="${headerHeight}">
      <rect width="${totalWidth}" height="${headerHeight}" fill="#280A60"/>
      <text x="${leftWidth / 2}" y="25" fill="#FAF7F4" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">BẢN GỐC (ZIP - PORT 3100)</text>
      <line x1="${leftWidth + 5}" y1="0" x2="${leftWidth + 5}" y2="${headerHeight}" stroke="#EF3B83" stroke-width="2"/>
      <text x="${leftWidth + 10 + rightWidth / 2}" y="25" fill="#FAF7F4" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">REPOSITORIUM (${title || 'PORT 3000'})</text>
    </svg>
  `

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 250, g: 247, b: 244, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(svgHeader), top: 0, left: 0 },
      { input: leftResized, top: headerHeight, left: 0 },
      { input: rightResized, top: headerHeight, left: leftWidth + 10 },
    ])
    .png()
    .toFile(outputPath)
}

async function captureScreen(page, name, viewport, isRepo = false) {
  const vpSuffix = viewport.width === 390 ? '390' : '1440'
  const filename = `${name}-${vpSuffix}.png`
  const buffer = await page.screenshot({ fullPage: false })

  if (isRepo) {
    fs.writeFileSync(path.join(OUT_REPO_DIR, filename), buffer)
  }
  return buffer
}

async function run() {
  console.log('--- BẮT ĐẦU CHỤP VÀ SO SÁNH ẢNH DP-01 ---')
  const browser = await chromium.launch()

  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ]

  for (const vp of viewports) {
    const vpSuffix = vp.width === 390 ? '390' : '1440'
    console.log(`\n=== CHỤP VIEWPORT ${vp.width}px (${vp.name}) ===`)

    const zipPage = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    const repoPage = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })

    try {
      // 1. HABIT FLOW (MÀN 1 -> 6)
      console.log('1. Habit Flow (Steps 1-6)...')

      // Màn 1: Khám đúng nút thắt (Step 1)
      await zipPage.goto(ZIP_URL, { waitUntil: 'domcontentloaded' })
      await repoPage.goto(`${REPO_URL}/habit/5-phut`, { waitUntil: 'domcontentloaded' })
      await zipPage.waitForTimeout(1000)
      await repoPage.waitForTimeout(1000)

      const zipBuf1 = await zipPage.screenshot()
      const repoBuf1 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step1-${vpSuffix}.png`), repoBuf1)
      await stitchSideBySide(
        zipBuf1,
        repoBuf1,
        path.join(OUT_COMPARE_DIR, `habit-step1-${vpSuffix}.png`),
        'Habit Bước 1: Khám',
      )

      // Màn 2: Nguyên lý 1% (Step 2)
      await zipPage
        .getByRole('button', { name: /Nguyên lý 1%|2/i })
        .first()
        .click()
        .catch(() => {})
      await repoPage
        .getByRole('button', { name: /Nguyên lý 1%|2/i })
        .first()
        .click()
        .catch(() => {})
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBuf2 = await zipPage.screenshot()
      const repoBuf2 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step2-${vpSuffix}.png`), repoBuf2)
      await stitchSideBySide(
        zipBuf2,
        repoBuf2,
        path.join(OUT_COMPARE_DIR, `habit-step2-${vpSuffix}.png`),
        'Habit Bước 2: 1% Better',
      )

      // Màn 3: Tìm Mentor (Step 3)
      await zipPage
        .getByRole('button', { name: /Tìm Mentor|3/i })
        .first()
        .click()
        .catch(() => {})
      await repoPage
        .getByRole('button', { name: /Tìm Mentor|3/i })
        .first()
        .click()
        .catch(() => {})
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBuf3 = await zipPage.screenshot()
      const repoBuf3 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step3-${vpSuffix}.png`), repoBuf3)
      await stitchSideBySide(
        zipBuf3,
        repoBuf3,
        path.join(OUT_COMPARE_DIR, `habit-step3-${vpSuffix}.png`),
        'Habit Bước 3: Tìm Mentor',
      )

      // Màn 4: Gọi tên thói quen (Step 4)
      await zipPage
        .getByRole('button', { name: /Gọi tên|4/i })
        .first()
        .click()
        .catch(() => {})
      await repoPage
        .getByRole('button', { name: /Gọi tên|4/i })
        .first()
        .click()
        .catch(() => {})
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBuf4 = await zipPage.screenshot()
      const repoBuf4 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step4-${vpSuffix}.png`), repoBuf4)
      await stitchSideBySide(
        zipBuf4,
        repoBuf4,
        path.join(OUT_COMPARE_DIR, `habit-step4-${vpSuffix}.png`),
        'Habit Bước 4: Gọi tên',
      )

      // Màn 5: Vòng lặp (Step 5)
      await zipPage
        .getByRole('button', { name: /Vòng lặp|5/i })
        .first()
        .click()
        .catch(() => {})
      await repoPage
        .getByRole('button', { name: /Vòng lặp|5/i })
        .first()
        .click()
        .catch(() => {})
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBuf5 = await zipPage.screenshot()
      const repoBuf5 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step5-${vpSuffix}.png`), repoBuf5)
      await stitchSideBySide(
        zipBuf5,
        repoBuf5,
        path.join(OUT_COMPARE_DIR, `habit-step5-${vpSuffix}.png`),
        'Habit Bước 5: Vòng lặp',
      )

      // Màn 6: Boarding Pass (Step 6)
      await zipPage
        .getByRole('button', { name: /Boarding Pass|6/i })
        .first()
        .click()
        .catch(() => {})
      await repoPage
        .getByRole('button', { name: /Boarding Pass|6/i })
        .first()
        .click()
        .catch(() => {})
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBuf6 = await zipPage.screenshot()
      const repoBuf6 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step6-${vpSuffix}.png`), repoBuf6)
      await stitchSideBySide(
        zipBuf6,
        repoBuf6,
        path.join(OUT_COMPARE_DIR, `habit-step6-${vpSuffix}.png`),
        'Habit Bước 6: Boarding Pass',
      )

      // Màn 7: Tracker 28 ngày
      console.log('2. Habit Tracker (Step 7 / 28 Days)...')
      await zipPage
        .getByRole('button', { name: /28 ngày|Chuyển mình|7/i })
        .first()
        .click()
        .catch(() => {})
      await repoPage
        .goto(`${REPO_URL}/habit/tracker`, { waitUntil: 'domcontentloaded' })
        .catch(() => {})
      await zipPage.waitForTimeout(800)
      await repoPage.waitForTimeout(800)

      const zipBuf7 = await zipPage.screenshot()
      const repoBuf7 = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-step7-tracker-${vpSuffix}.png`), repoBuf7)
      await stitchSideBySide(
        zipBuf7,
        repoBuf7,
        path.join(OUT_COMPARE_DIR, `habit-step7-tracker-${vpSuffix}.png`),
        'Habit Bước 7: Tracker 28 Ngày',
      )

      // Hộp thoại Check-in ngày
      console.log('3. Habit Day Check-in Modal...')
      const zipDay1 = zipPage.locator('button[aria-label*="Ngày 1"], button:has-text("1")').first()
      if (await zipDay1.isVisible()) await zipDay1.click()

      const repoDay1 = repoPage
        .locator('button[aria-label*="Ngày 1"], button:has-text("1")')
        .first()
      if (await repoDay1.isVisible()) await repoDay1.click()
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipModal = await zipPage.screenshot()
      const repoModal = await repoPage.screenshot()
      fs.writeFileSync(path.join(OUT_REPO_DIR, `habit-checkin-modal-${vpSuffix}.png`), repoModal)
      await stitchSideBySide(
        zipModal,
        repoModal,
        path.join(OUT_COMPARE_DIR, `habit-checkin-modal-${vpSuffix}.png`),
        'Habit Hộp thoại Check-in',
      )

      // Đóng modal
      await zipPage.keyboard.press('Escape').catch(() => {})
      await repoPage.keyboard.press('Escape').catch(() => {})

      // 4. EQ BUDDY FLOW
      console.log('4. EQ Buddy Flow...')
      await zipPage.goto(ZIP_URL, { waitUntil: 'domcontentloaded' })
      const eqTabBtn = zipPage.getByRole('button', { name: /EQ Buddy/i })
      if (await eqTabBtn.isVisible()) await eqTabBtn.click()

      await repoPage.goto(`${REPO_URL}/eq-buddy/rut-the`, { waitUntil: 'domcontentloaded' })
      await zipPage.waitForTimeout(800)
      await repoPage.waitForTimeout(800)

      // EQ Màn Rút thẻ
      const zipEqDraw = await zipPage.screenshot()
      const repoEqDraw = await repoPage.screenshot()
      await stitchSideBySide(
        zipEqDraw,
        repoEqDraw,
        path.join(OUT_COMPARE_DIR, `eq-draw-screen-${vpSuffix}.png`),
        'EQ Buddy Rút thẻ',
      )

      // Rút một thẻ ngẫu nhiên
      const zipDrawBtn = zipPage
        .getByRole('button', { name: /Rút ngẫu nhiên|Chọn cảm xúc/i })
        .first()
      if (await zipDrawBtn.isVisible()) await zipDrawBtn.click()

      const repoDrawBtn = repoPage
        .getByRole('button', { name: /Rút ngẫu nhiên|Chọn cảm xúc/i })
        .first()
      if (await repoDrawBtn.isVisible()) await repoDrawBtn.click()
      await zipPage.waitForTimeout(1000)
      await repoPage.waitForTimeout(1000)

      // Mặt trước thẻ
      const zipCardFront = await zipPage.screenshot()
      const repoCardFront = await repoPage.screenshot()
      await stitchSideBySide(
        zipCardFront,
        repoCardFront,
        path.join(OUT_COMPARE_DIR, `eq-card-front-${vpSuffix}.png`),
        'EQ Mặt trước 3D',
      )

      // Mặt sau thẻ (lật)
      const zipFlip = zipPage.getByRole('button', { name: /Lật thẻ|Mặt sau/i }).first()
      if (await zipFlip.isVisible()) await zipFlip.click()

      const repoFlip = repoPage.getByRole('button', { name: /Lật thẻ|Mặt sau/i }).first()
      if (await repoFlip.isVisible()) await repoFlip.click()
      await zipPage.waitForTimeout(800)
      await repoPage.waitForTimeout(800)

      const zipCardBack = await zipPage.screenshot()
      const repoCardBack = await repoPage.screenshot()
      await stitchSideBySide(
        zipCardBack,
        repoCardBack,
        path.join(OUT_COMPARE_DIR, `eq-card-back-${vpSuffix}.png`),
        'EQ Mặt sau 3D',
      )

      // Tab "Tất cả thẻ"
      const zipAllTab = zipPage.getByRole('button', { name: /Tất cả thẻ/i }).first()
      if (await zipAllTab.isVisible()) await zipAllTab.click()

      const repoAllTab = repoPage.getByRole('button', { name: /Tất cả thẻ/i }).first()
      if (await repoAllTab.isVisible()) await repoAllTab.click()
      await zipPage.waitForTimeout(800)
      await repoPage.waitForTimeout(800)

      const zipAllCards = await zipPage.screenshot()
      const repoAllCards = await repoPage.screenshot()
      await stitchSideBySide(
        zipAllCards,
        repoAllCards,
        path.join(OUT_COMPARE_DIR, `eq-all-cards-${vpSuffix}.png`),
        'EQ Tất cả thẻ',
      )
    } catch (err) {
      console.error(`Lỗi khi chụp viewport ${vp.name}:`, err)
    } finally {
      await zipPage.close()
      await repoPage.close()
    }
  }

  await browser.close()
  console.log('\n--- HOÀN THÀNH CHỤP ẢNH SO SÁNH ---')
  console.log(`- Ảnh repo Habit: ${OUT_REPO_DIR}`)
  console.log(`- Ảnh ghép so sánh Zip / Repo: ${OUT_COMPARE_DIR}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
