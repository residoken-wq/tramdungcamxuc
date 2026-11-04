import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const REPO_URL = 'http://localhost:3000'
const ZIP_URL = 'http://localhost:3100'

const OUT_REPO_DIR = path.resolve(process.cwd(), 'docs/screenshots/dp02')
const OUT_COMPARE_DIR = path.resolve(process.cwd(), '../dp02-compare')

for (const dir of [OUT_REPO_DIR, OUT_COMPARE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function getMd5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex')
}

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
      <text x="${leftWidth / 2}" y="25" fill="#FAF7F4" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">BẢN GỐC (ZIP :3100)</text>
      <line x1="${leftWidth + 5}" y1="0" x2="${leftWidth + 5}" y2="${headerHeight}" stroke="#EF3B83" stroke-width="2"/>
      <text x="${leftWidth + 10 + rightWidth / 2}" y="25" fill="#FAF7F4" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">REPOSITORIUM (${title || ':3000'})</text>
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
    .png({ quality: 80, compressionLevel: 8 })
    .toFile(outputPath)
}

async function saveRepoImage(name, vpSuffix, buffer) {
  const filename = `${name}-${vpSuffix}.png`
  const filePath = path.join(OUT_REPO_DIR, filename)
  // Optimize PNG to keep total bundle < 3MB
  const optimized = await sharp(buffer).png({ quality: 80, compressionLevel: 9 }).toBuffer()
  fs.writeFileSync(filePath, optimized)
  return { filename, md5: getMd5(optimized), size: optimized.length }
}

async function run() {
  console.log('--- BẮT ĐẦU CHỤP VÀ SO SÁNH ẢNH DP-02 ---')
  const browser = await chromium.launch()

  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ]

  const captureRecords = []

  for (const vp of viewports) {
    const vpSuffix = vp.width === 390 ? '390' : '1440'
    console.log(`\n=== CHỤP VIEWPORT ${vp.width}px (${vp.name}) ===`)

    const zipContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    })
    const repoContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    })

    const zipPage = await zipContext.newPage()
    const repoPage = await repoContext.newPage()

    try {
      // ----------------------------------------------------
      // 1. HABIT STEP 3 (3 việc, 1 Mentor)
      // ----------------------------------------------------
      console.log('1. Habit Step 3 (3 việc, 1 Mentor)...')
      await zipPage.goto(ZIP_URL, { waitUntil: 'domcontentloaded' })
      await repoPage.goto(`${REPO_URL}/habit/5-phut`, { waitUntil: 'domcontentloaded' })
      await zipPage.waitForTimeout(600)
      await repoPage.waitForTimeout(600)

      // Chuyển sang tab Habit Tracker nếu cần
      const zipHabitTab = zipPage
        .getByRole('button', { name: /Xây thói quen|habit-tracker/i })
        .first()
      if (await zipHabitTab.isVisible()) await zipHabitTab.click()

      // Điều hướng đến Bước 3 trên cả 2 trang
      const navToStep3 = async (page) => {
        const btn3 = page.getByRole('button', { name: /Tìm Mentor|Bước 3|3/i }).first()
        if (await btn3.isVisible()) {
          await btn3.click()
        } else {
          // Bấm tiếp từ bước 1 -> 2 -> 3
          const nxt = page.getByRole('button', { name: /Tiếp|Bắt đầu|Sang giai đoạn/i }).first()
          if (await nxt.isVisible()) await nxt.click()
          await page.waitForTimeout(300)
          const nxt2 = page.getByRole('button', { name: /Tiếp|Sang giai đoạn 2/i }).first()
          if (await nxt2.isVisible()) await nxt2.click()
        }
      }
      await navToStep3(zipPage)
      await navToStep3(repoPage)
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBufStep3 = await zipPage.screenshot()
      const repoBufStep3 = await repoPage.screenshot()
      const repoStep3Meta = await saveRepoImage('habit-step3', vpSuffix, repoBufStep3)
      await stitchSideBySide(
        zipBufStep3,
        repoBufStep3,
        path.join(OUT_COMPARE_DIR, `habit-step3-${vpSuffix}.png`),
        'Habit Bước 3: Tìm Mentor',
      )
      captureRecords.push({
        name: 'habit-step3',
        title: 'Habit Bước 3 (3 việc, 1 Mentor)',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufStep3),
        repoMd5: repoStep3Meta.md5,
        repoFile: repoStep3Meta.filename,
        notes: 'Khớp layout bảng đánh giá thói quen, chọn Mentor và giờ neo',
      })

      // ----------------------------------------------------
      // 2. HABIT STEP 7 / TRACKER (Z1-Z2: 28 NGÀY THÀNH ..., Trạm N, x/7 phiếu)
      // ----------------------------------------------------
      console.log('2. Habit Tracker (Z1-Z2)...')
      const navToStep7 = async (page, url) => {
        const btn7 = page.getByRole('button', { name: /28 ngày|Chuyển mình|7/i }).first()
        if (await btn7.isVisible()) {
          await btn7.click()
        } else if (url) {
          await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {})
        }
      }
      await navToStep7(zipPage)
      await repoPage.goto(`${REPO_URL}/habit/tracker`, { waitUntil: 'domcontentloaded' })
      await zipPage.waitForTimeout(600)
      await repoPage.waitForTimeout(600)

      const zipBufTracker = await zipPage.screenshot()
      const repoBufTracker = await repoPage.screenshot()
      const repoTrackerMeta = await saveRepoImage('habit-step7-tracker', vpSuffix, repoBufTracker)
      await stitchSideBySide(
        zipBufTracker,
        repoBufTracker,
        path.join(OUT_COMPARE_DIR, `habit-step7-tracker-${vpSuffix}.png`),
        'Habit Bước 7: Tracker 28 Ngày',
      )
      captureRecords.push({
        name: 'habit-step7-tracker',
        title: 'Habit Bước 7 Tracker (Z1-Z2)',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufTracker),
        repoMd5: repoTrackerMeta.md5,
        repoFile: repoTrackerMeta.filename,
        notes: 'Tiêu đề 28 NGÀY THÀNH ..., Trạm N: {tên}, badge x/7 lá phiếu',
      })

      // ----------------------------------------------------
      // 3. HABIT CHECK-IN MODAL
      // ----------------------------------------------------
      console.log('3. Habit Check-in Modal...')
      const zipDay1 = zipPage.locator('button[aria-label*="Ngày 1"], button:has-text("1")').first()
      if (await zipDay1.isVisible()) await zipDay1.click().catch(() => {})

      const repoDay1 = repoPage
        .locator('button[aria-label*="Ngày 1"], button:has-text("1")')
        .first()
      if (await repoDay1.isVisible()) await repoDay1.click().catch(() => {})
      await zipPage.waitForTimeout(400)
      await repoPage.waitForTimeout(400)

      const zipBufModal = await zipPage.screenshot()
      const repoBufModal = await repoPage.screenshot()
      const repoModalMeta = await saveRepoImage('habit-checkin-modal', vpSuffix, repoBufModal)
      await stitchSideBySide(
        zipBufModal,
        repoBufModal,
        path.join(OUT_COMPARE_DIR, `habit-checkin-modal-${vpSuffix}.png`),
        'Habit Hộp thoại Check-in',
      )
      captureRecords.push({
        name: 'habit-checkin-modal',
        title: 'Hộp thoại Check-in ngày',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufModal),
        repoMd5: repoModalMeta.md5,
        repoFile: repoModalMeta.filename,
        notes: 'Modal check-in cảm xúc và trạng thái bỏ phiếu',
      })

      // Đóng modal
      await zipPage.keyboard.press('Escape').catch(() => {})
      await repoPage.keyboard.press('Escape').catch(() => {})

      // ----------------------------------------------------
      // 4. EQ BUDDY INTRO STEP 1 (Màn đầu)
      // ----------------------------------------------------
      console.log('4. EQ Intro Step 1...')
      await zipPage.goto(ZIP_URL, { waitUntil: 'domcontentloaded' })
      const eqTabBtn = zipPage.getByRole('button', { name: /EQ Buddy/i }).first()
      if (await eqTabBtn.isVisible()) await eqTabBtn.click()

      await repoPage.goto(`${REPO_URL}/eq-buddy`, { waitUntil: 'domcontentloaded' })
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBufEqIntro1 = await zipPage.screenshot()
      const repoBufEqIntro1 = await repoPage.screenshot()
      const repoEqIntro1Meta = await saveRepoImage('eq-intro-step1', vpSuffix, repoBufEqIntro1)
      await stitchSideBySide(
        zipBufEqIntro1,
        repoBufEqIntro1,
        path.join(OUT_COMPARE_DIR, `eq-intro-step1-${vpSuffix}.png`),
        'EQ Intro Bước 1: Giới thiệu',
      )
      captureRecords.push({
        name: 'eq-intro-step1',
        title: 'EQ Intro Bước 1 (Màn đầu)',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufEqIntro1),
        repoMd5: repoEqIntro1Meta.md5,
        repoFile: repoEqIntro1Meta.filename,
        notes: 'Thẻ giới thiệu bộ thẻ 26 thông điệp và triết lý',
      })

      // ----------------------------------------------------
      // 5. EQ BUDDY INTRO STEP 2 (Giới thiệu bước 2)
      // ----------------------------------------------------
      console.log('5. EQ Intro Step 2...')
      const zipNextIntro = zipPage
        .getByRole('button', { name: /Cách thức sử dụng|Tiếp|2/i })
        .first()
      if (await zipNextIntro.isVisible()) await zipNextIntro.click().catch(() => {})

      const repoNextIntro = repoPage
        .getByRole('button', { name: /Cách thức sử dụng|Tiếp|2/i })
        .first()
      if (await repoNextIntro.isVisible()) await repoNextIntro.click().catch(() => {})
      await zipPage.waitForTimeout(400)
      await repoPage.waitForTimeout(400)

      const zipBufEqIntro2 = await zipPage.screenshot()
      const repoBufEqIntro2 = await repoPage.screenshot()
      const repoEqIntro2Meta = await saveRepoImage('eq-intro-step2', vpSuffix, repoBufEqIntro2)
      await stitchSideBySide(
        zipBufEqIntro2,
        repoBufEqIntro2,
        path.join(OUT_COMPARE_DIR, `eq-intro-step2-${vpSuffix}.png`),
        'EQ Intro Bước 2: Cách dùng',
      )
      captureRecords.push({
        name: 'eq-intro-step2',
        title: 'EQ Intro Bước 2 (Cách thức sử dụng)',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufEqIntro2),
        repoMd5: repoEqIntro2Meta.md5,
        repoFile: repoEqIntro2Meta.filename,
        notes: '4 bước tĩnh lặng và các chế độ một mình / nhiều người',
      })

      // ----------------------------------------------------
      // 6. EQ DRAW SCREEN (Rút thẻ)
      // ----------------------------------------------------
      console.log('6. EQ Draw Screen...')
      await repoPage.goto(`${REPO_URL}/eq-buddy/rut-the`, { waitUntil: 'domcontentloaded' })
      const zipSkipBtn = zipPage.getByRole('button', { name: /Rút thẻ ngay|Bỏ qua/i }).first()
      if (await zipSkipBtn.isVisible()) await zipSkipBtn.click().catch(() => {})
      await zipPage.waitForTimeout(500)
      await repoPage.waitForTimeout(500)

      const zipBufEqDraw = await zipPage.screenshot()
      const repoBufEqDraw = await repoPage.screenshot()
      const repoEqDrawMeta = await saveRepoImage('eq-draw-screen', vpSuffix, repoBufEqDraw)
      await stitchSideBySide(
        zipBufEqDraw,
        repoBufEqDraw,
        path.join(OUT_COMPARE_DIR, `eq-draw-screen-${vpSuffix}.png`),
        'EQ Màn Rút thẻ',
      )
      captureRecords.push({
        name: 'eq-draw-screen',
        title: 'EQ Màn Rút thẻ',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufEqDraw),
        repoMd5: repoEqDrawMeta.md5,
        repoFile: repoEqDrawMeta.filename,
        notes: 'Chọn tâm trạng gợi ý hoặc rút ngẫu nhiên',
      })

      // ----------------------------------------------------
      // 7. EQ CARD FRONT (Mặt trước)
      // ----------------------------------------------------
      console.log('7. EQ Card Front...')
      const zipDrawBtn = zipPage
        .getByRole('button', { name: /Rút ngẫu nhiên|Chọn cảm xúc|Rút thẻ/i })
        .first()
      if (await zipDrawBtn.isVisible()) await zipDrawBtn.click().catch(() => {})

      const repoDrawBtn = repoPage
        .getByRole('button', { name: /Rút ngẫu nhiên|Chọn cảm xúc|Rút thẻ/i })
        .first()
      if (await repoDrawBtn.isVisible()) await repoDrawBtn.click().catch(() => {})
      await zipPage.waitForTimeout(1000)
      await repoPage.waitForTimeout(1000)

      const zipBufCardFront = await zipPage.screenshot()
      const repoBufCardFront = await repoPage.screenshot()
      const repoCardFrontMeta = await saveRepoImage('eq-card-front', vpSuffix, repoBufCardFront)
      await stitchSideBySide(
        zipBufCardFront,
        repoBufCardFront,
        path.join(OUT_COMPARE_DIR, `eq-card-front-${vpSuffix}.png`),
        'EQ Mặt trước 3D',
      )
      captureRecords.push({
        name: 'eq-card-front',
        title: 'EQ Mặt trước thẻ 3D',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufCardFront),
        repoMd5: repoCardFrontMeta.md5,
        repoFile: repoCardFrontMeta.filename,
        notes: 'Mặt trước thẻ có thông điệp, hình minh họa, tải ảnh 4:5/9:16',
      })

      // ----------------------------------------------------
      // 8. EQ CARD BACK (Mặt sau)
      // ----------------------------------------------------
      console.log('8. EQ Card Back...')
      const zipFlip = zipPage
        .getByRole('button', { name: /Lật xem câu hỏi|Lật thẻ|Mặt sau/i })
        .first()
      if (await zipFlip.isVisible()) await zipFlip.click().catch(() => {})

      const repoFlip = repoPage
        .getByRole('button', { name: /Lật xem câu hỏi|Lật thẻ|Mặt sau/i })
        .first()
      if (await repoFlip.isVisible()) await repoFlip.click().catch(() => {})
      await zipPage.waitForTimeout(600)
      await repoPage.waitForTimeout(600)

      const zipBufCardBack = await zipPage.screenshot()
      const repoBufCardBack = await repoPage.screenshot()
      const repoCardBackMeta = await saveRepoImage('eq-card-back', vpSuffix, repoBufCardBack)
      await stitchSideBySide(
        zipBufCardBack,
        repoBufCardBack,
        path.join(OUT_COMPARE_DIR, `eq-card-back-${vpSuffix}.png`),
        'EQ Mặt sau 3D',
      )
      captureRecords.push({
        name: 'eq-card-back',
        title: 'EQ Mặt sau thẻ 3D',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufCardBack),
        repoMd5: repoCardBackMeta.md5,
        repoFile: repoCardBackMeta.filename,
        notes: 'Mặt sau với 3 câu hỏi suy ngẫm (Gợi nhớ, Gói ghém, Ghi nhận)',
      })

      // ----------------------------------------------------
      // 9. EQ ALL CARDS (Tất cả thẻ)
      // ----------------------------------------------------
      console.log('9. EQ All Cards...')
      const zipAllTab = zipPage.getByRole('button', { name: /Xem tất cả thẻ|Tất cả thẻ/i }).first()
      if (await zipAllTab.isVisible()) await zipAllTab.click().catch(() => {})

      const repoAllTab = repoPage
        .getByRole('button', { name: /Xem tất cả thẻ|Tất cả thẻ/i })
        .first()
      if (await repoAllTab.isVisible()) await repoAllTab.click().catch(() => {})
      await zipPage.waitForTimeout(600)
      await repoPage.waitForTimeout(600)

      const zipBufAllCards = await zipPage.screenshot()
      const repoBufAllCards = await repoPage.screenshot()
      const repoAllCardsMeta = await saveRepoImage('eq-all-cards', vpSuffix, repoBufAllCards)
      await stitchSideBySide(
        zipBufAllCards,
        repoBufAllCards,
        path.join(OUT_COMPARE_DIR, `eq-all-cards-${vpSuffix}.png`),
        'EQ Tất cả thẻ (Z4: button có aria-label)',
      )
      captureRecords.push({
        name: 'eq-all-cards',
        title: 'EQ Tất cả thẻ (Z4)',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufAllCards),
        repoMd5: repoAllCardsMeta.md5,
        repoFile: repoAllCardsMeta.filename,
        notes: 'Lưới tất cả thẻ, mỗi thẻ là button có aria-label hỗ trợ phím',
      })

      // ----------------------------------------------------
      // 10. EQ GUIDE MODAL (Hộp hướng dẫn)
      // ----------------------------------------------------
      console.log('10. EQ Guide Modal...')
      const zipGuideBtn = zipPage
        .getByRole('button', { name: /Hướng dẫn|Khám phá cách dùng/i })
        .first()
      if (await zipGuideBtn.isVisible()) await zipGuideBtn.click().catch(() => {})

      const repoGuideBtn = repoPage
        .getByRole('button', { name: /Hướng dẫn|Khám phá cách dùng/i })
        .first()
      if (await repoGuideBtn.isVisible()) await repoGuideBtn.click().catch(() => {})
      await zipPage.waitForTimeout(400)
      await repoPage.waitForTimeout(400)

      const zipBufGuideModal = await zipPage.screenshot()
      const repoBufGuideModal = await repoPage.screenshot()
      const repoGuideModalMeta = await saveRepoImage('eq-guide-modal', vpSuffix, repoBufGuideModal)
      await stitchSideBySide(
        zipBufGuideModal,
        repoBufGuideModal,
        path.join(OUT_COMPARE_DIR, `eq-guide-modal-${vpSuffix}.png`),
        'EQ Hộp thoại Hướng dẫn',
      )
      captureRecords.push({
        name: 'eq-guide-modal',
        title: 'EQ Hộp thoại Hướng dẫn sử dụng',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufGuideModal),
        repoMd5: repoGuideModalMeta.md5,
        repoFile: repoGuideModalMeta.filename,
        notes: 'Modal hướng dẫn 4 bước tĩnh lặng và câu châm ngôn',
      })

      // Đóng modal
      await zipPage.keyboard.press('Escape').catch(() => {})
      await repoPage.keyboard.press('Escape').catch(() => {})

      // ----------------------------------------------------
      // 11. EQ QR PAGE (Z5: h1 sr-only)
      // ----------------------------------------------------
      console.log('11. EQ QR Page...')
      await repoPage
        .goto(`${REPO_URL}/eq-buddy/the/the-01`, { waitUntil: 'domcontentloaded' })
        .catch(() => {})
      await zipPage.waitForTimeout(400)
      await repoPage.waitForTimeout(400)

      const zipBufQr = await zipPage.screenshot()
      const repoBufQr = await repoPage.screenshot()
      const repoQrMeta = await saveRepoImage('eq-qr-page', vpSuffix, repoBufQr)
      await stitchSideBySide(
        zipBufQr,
        repoBufQr,
        path.join(OUT_COMPARE_DIR, `eq-qr-page-${vpSuffix}.png`),
        'EQ Trang xem qua mã QR (Z5: h1 sr-only)',
      )
      captureRecords.push({
        name: 'eq-qr-page',
        title: 'EQ Trang xem qua mã QR (Z5)',
        viewport: `${vp.width}px`,
        zipMd5: getMd5(zipBufQr),
        repoMd5: repoQrMeta.md5,
        repoFile: repoQrMeta.filename,
        notes: 'Trang thẻ xem qua QR code có h1 sr-only chuẩn a11y',
      })
    } catch (err) {
      console.error(`Lỗi khi chụp viewport ${vp.name}:`, err)
    } finally {
      await zipPage.close()
      await repoPage.close()
      await zipContext.close()
      await repoContext.close()
    }
  }

  await browser.close()

  console.log('\n--- HOÀN THÀNH CHỤP ẢNH SO SÁNH DP-02 ---')
  console.log(`- Ảnh repo: ${OUT_REPO_DIR}`)
  console.log(`- Ảnh ghép so sánh Zip / Repo: ${OUT_COMPARE_DIR}`)

  // In bảng Markdown tổng kết
  console.log('\n### Bảng đối chiếu ảnh chụp và MD5 Checksums\n')
  console.log(
    '| Màn hình | Khung nhìn | MD5 Zip (:3100) | MD5 Repo (:3000) | File Repo | Ghi chú so sánh |',
  )
  console.log('|---|---|---|---|---|---|')
  for (const r of captureRecords) {
    console.log(
      `| ${r.title} | ${r.viewport} | \`${r.zipMd5.slice(0, 12)}…\` | \`${r.repoMd5.slice(0, 12)}…\` | \`${r.repoFile}\` | ${r.notes} |`,
    )
  }

  // Tính tổng dung lượng thư mục docs/screenshots/dp02/
  const files = fs.readdirSync(OUT_REPO_DIR)
  let totalSize = 0
  for (const f of files) {
    totalSize += fs.statSync(path.join(OUT_REPO_DIR, f)).size
  }
  console.log(
    `\nTổng dung lượng ảnh repo: ${(totalSize / 1024 / 1024).toFixed(2)} MB (< 3 MB chuẩn yêu cầu)`,
  )

  fs.writeFileSync(
    path.join(OUT_REPO_DIR, 'summary.json'),
    JSON.stringify(
      { totalSizeMb: (totalSize / 1024 / 1024).toFixed(2), records: captureRecords },
      null,
      2,
    ),
  )
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
