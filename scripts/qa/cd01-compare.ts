import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { chromium, type Browser } from '@playwright/test'
import sharp from 'sharp'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { communityTemplate } from '../../src/puck/templates/community'

// Bounding boxes in slide coordinates (1440x810) to mask real people photos for privacy
const PEOPLE_MASKS: Record<number, Array<{ left: number; top: number; width: number; height: number }>> = {
  48: [{ left: 700, top: 40, width: 700, height: 750 }], // Background photo on right half
  50: [{ left: 700, top: 70, width: 660, height: 680 }], // Circle photo on right
  53: [{ left: 70, top: 160, width: 1300, height: 600 }], // Mosaic photos
  54: [{ left: 0, top: 0, width: 680, height: 810 }], // Left bleed photo
  56: [{ left: 70, top: 160, width: 1300, height: 600 }], // Mosaic photos
}

async function maskRealPeople(refBuffer: Buffer, slideNum: number): Promise<Buffer> {
  const masks = PEOPLE_MASKS[slideNum]
  if (!masks || masks.length === 0) return refBuffer

  const overlays = masks.map((m: { left: number; top: number; width: number; height: number }) => {
    const svg = `
      <svg width="${m.width}" height="${m.height}">
        <rect width="${m.width}" height="${m.height}" fill="#280A60" fill-opacity="0.92"/>
        <text x="${m.width / 2}" y="${m.height / 2}" fill="#FDE6F6" font-family="'Montserrat', sans-serif" font-size="16" font-weight="bold" text-anchor="middle">
          [Ảnh người thật - Đã che bảo vệ quyền riêng tư]
        </text>
      </svg>
    `
    return {
      input: Buffer.from(svg),
      top: m.top,
      left: m.left,
    }
  })

  return sharp(refBuffer).composite(overlays).toBuffer()
}

// Generate sample SVG placeholder data URI for section comparison
function makeSvgDataUri(label: string, bg = '#E9DDF9', fg = '#280A60', w = 800, h = 600): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" fill="${fg}" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">[MẪU] ${label}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

async function main() {
  // Global 5-minute timeout
  const globalTimer = setTimeout(() => {
    console.error('TIMEOUT: Script running over 5 minutes. Aborting.')
    process.exit(1)
  }, 5 * 60 * 1000)

  const rootDir = process.cwd()
  const refDir = path.resolve(rootDir, 'docs/design/cong-dong/ref')
  const compareDir = path.resolve(rootDir, 'docs/design/cong-dong/compare')

  if (!fs.existsSync(compareDir)) {
    fs.mkdirSync(compareDir, { recursive: true })
  }

  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  console.log(`Checking server at ${baseURL}...`)

  try {
    const controller = new AbortController()
    const checkTimeout = setTimeout(() => controller.abort(), 5000)
    const probe = await fetch(`${baseURL}/api/users/init`, { signal: controller.signal })
    clearTimeout(checkTimeout)
    if (!probe.ok && probe.status !== 200) {
      throw new Error(`Server returned status ${probe.status}`)
    }
    console.log(`Server is running at ${baseURL}`)
  } catch (err) {
    console.error(`ERROR: Server chưa chạy ở ${baseURL}. Hãy khởi động server trước (VD: pnpm dev). Lỗi:`, err)
    clearTimeout(globalTimer)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const suffix = randomUUID().slice(0, 8)
  const slug = `qa-cd01-${suffix}`
  let pageId: number | undefined
  const createdTestimonialIds: number[] = []
  let browser: Browser | undefined

  try {
    // 1. Create 3 sample testimonials with consent = true for slide 52
    const t1 = await payload.create({
      collection: 'testimonials',
      data: {
        name: 'Học viên Test 01',
        quote: '[MẪU] Một không gian an lành để bắt đầu ngày mới với sự tĩnh tại và kết nối sâu sắc.',
        rating: 5,
        type: 'general',
        consent: true,
        isSample: true,
        _status: 'published',
      },
    })
    createdTestimonialIds.push(t1.id)

    const t2 = await payload.create({
      collection: 'testimonials',
      data: {
        name: 'Học viên Test 02',
        quote: '[MẪU] Thói quen dậy sớm 5:00 AM giúp mình có thêm thời gian lắng nghe và chăm sóc bản thân trọn vẹn hơn.',
        rating: 5,
        type: 'general',
        consent: true,
        isSample: true,
        _status: 'published',
      },
    })
    createdTestimonialIds.push(t2.id)

    const t3 = await payload.create({
      collection: 'testimonials',
      data: {
        name: 'Học viên Test 03',
        quote: '[MẪU] Cảm giác ấm áp khi biết luôn có một trạm dừng dịu êm đón chờ mình mỗi buổi sáng thức giấc.',
        rating: 5,
        type: 'general',
        consent: true,
        isSample: true,
        _status: 'published',
      },
    })
    createdTestimonialIds.push(t3.id)

    // 2. Clone communityTemplate content with sample visual assets for fidelity capture
    const populatedContent = communityTemplate.content.map((item) => {
      if (item.type === 'HeroImage') {
        return {
          ...item,
          props: {
            ...item.props,
            bgImageUrl: makeSvgDataUri('Ảnh nền Me Time', '#FAF7F4', '#280A60', 1440, 720),
          },
        }
      }
      if (item.type === 'ImageText' && item.props.id === 'me-time-intro') {
        return {
          ...item,
          props: {
            ...item.props,
            imageSrc: makeSvgDataUri('Ảnh Me Time Tròn', '#FDE6F6', '#BC039E', 600, 600),
          },
        }
      }
      if (item.type === 'ImageText' && item.props.id === 'yoga-buddy-intro') {
        return {
          ...item,
          props: {
            ...item.props,
            imageSrc: makeSvgDataUri('Ảnh Yoga Buddy', '#D9F1EA', '#280A60', 700, 800),
          },
        }
      }
      if (item.type === 'TestimonialGrid') {
        return {
          ...item,
          props: {
            ...item.props,
            mode: 'manual',
            manualTestimonials: createdTestimonialIds.map((id) => ({ testimonialId: String(id) })),
          },
        }
      }
      if (item.type === 'PhotoGallery') {
        return {
          ...item,
          props: {
            ...item.props,
            items: [
              { id: '1', imageUrl: makeSvgDataUri('Khoảnh khắc 1', '#E9DDF9', '#280A60', 600, 600), alt: 'Ảnh 1' },
              { id: '2', imageUrl: makeSvgDataUri('Khoảnh khắc 2', '#FDE6F6', '#280A60', 600, 300), alt: 'Ảnh 2' },
              { id: '3', imageUrl: makeSvgDataUri('Khoảnh khắc 3', '#D9F1EA', '#280A60', 600, 300), alt: 'Ảnh 3' },
              { id: '4', imageUrl: makeSvgDataUri('Khoảnh khắc 4', '#F6E9B8', '#280A60', 600, 600), alt: 'Ảnh 4' },
            ],
          },
        }
      }
      return item
    })

    // 3. Create page in CMS via local API
    const pageDoc = await payload.create({
      collection: 'pages',
      data: {
        title: `[MẪU] QA Cộng đồng CD-01 ${suffix}`,
        slug,
        _status: 'published',
        puckData: {
          ...communityTemplate,
          content: populatedContent,
        },
      },
    })
    pageId = pageDoc.id
    console.log(`Created QA test page /${slug} (ID: ${pageId})`)

    // 4. Launch browser to capture real page
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    browser = await chromium.launch({
      executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
      headless: true,
    })

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      baseURL,
    })
    const page = await context.newPage()
    page.setDefaultTimeout(60000)

    console.log(`Navigating to ${baseURL}/${slug}...`)
    const response = await page.goto(`/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })

    if (!response || response.status() !== 200) {
      throw new Error(`Failed to load page /${slug}: status ${response?.status()}`)
    }

    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    // Locate rendered sections on the real page
    const sections = page.locator('main section')
    const sectionCount = await sections.count()
    console.log(`Found ${sectionCount} sections on real page. Comparing with slides 48–57...`)

    for (let idx = 0; idx < Math.min(sectionCount, 10); idx++) {
      const slideNum = 48 + idx
      const refFile = path.join(refDir, `p-${slideNum}.png`)
      const outFile = path.join(compareDir, `p-${slideNum}.png`)

      if (!fs.existsSync(refFile)) {
        console.warn(`[WARN] Reference file not found: ${refFile}`)
        continue
      }

      const section = sections.nth(idx)
      await section.scrollIntoViewIfNeeded({ timeout: 60000 })
      await page.waitForTimeout(200)
      const webScreenshotBuffer = await section.screenshot({ timeout: 60000 })

      // Load reference PDF screenshot and mask real people
      const rawRefBuffer = fs.readFileSync(refFile)
      const refBuffer = await maskRealPeople(rawRefBuffer, slideNum)

      const refMeta = await sharp(refBuffer).metadata()
      const webMeta = await sharp(webScreenshotBuffer).metadata()

      const refWidth = refMeta.width || 1440
      const refHeight = refMeta.height || 810
      const webWidth = webMeta.width || 1440
      const webHeight = webMeta.height || 810

      const targetHeight = Math.max(refHeight, webHeight)
      const scaledRefWidth = Math.round((refWidth * targetHeight) / refHeight)
      const scaledWebWidth = Math.round((webWidth * targetHeight) / webHeight)

      const leftResized = await sharp(refBuffer)
        .resize(scaledRefWidth, targetHeight, { fit: 'contain', background: '#FAF7F4' })
        .toBuffer()

      const rightResized = await sharp(webScreenshotBuffer)
        .resize(scaledWebWidth, targetHeight, { fit: 'contain', background: '#FAF7F4' })
        .toBuffer()

      const headerHeight = 44
      const dividerWidth = 4
      const totalWidth = scaledRefWidth + dividerWidth + scaledWebWidth
      const totalHeight = targetHeight + headerHeight

      const svgHeader = `
        <svg width="${totalWidth}" height="${headerHeight}">
          <rect width="${totalWidth}" height="${headerHeight}" fill="#280A60"/>
          <text x="${scaledRefWidth / 2}" y="28" fill="#FDE6F6" font-family="'Montserrat', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">
            BẢN THIẾT KẾ SLIDE PDF (TRANG ${slideNum})
          </text>
          <line x1="${scaledRefWidth + 2}" y1="0" x2="${scaledRefWidth + 2}" y2="${headerHeight}" stroke="#EF3B83" stroke-width="2"/>
          <text x="${scaledRefWidth + dividerWidth + scaledWebWidth / 2}" y="28" fill="#FDE6F6" font-family="'Montserrat', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">
            WEB THỰC TẾ TRANG THẬT 1440px (MỤC ${idx + 1}/10)
          </text>
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
          {
            input: Buffer.from(
              `<svg width="${dividerWidth}" height="${targetHeight}"><rect width="${dividerWidth}" height="${targetHeight}" fill="#EF3B83"/></svg>`,
            ),
            top: headerHeight,
            left: scaledRefWidth,
          },
          { input: rightResized, top: headerHeight, left: scaledRefWidth + dividerWidth },
        ])
        .png()
        .toFile(outFile)

      console.log(`  ✓ Saved compare/p-${slideNum}.png (${totalWidth}x${totalHeight})`)
    }

    // 5. Mobile 375px full page
    console.log('Rendering 375px mobile full page from real web server...')
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      baseURL,
    })
    const mobilePage = await mobileContext.newPage()
    mobilePage.setDefaultTimeout(60000)
    await mobilePage.goto(`/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await mobilePage.evaluate(() => document.fonts.ready)
    await mobilePage.waitForTimeout(500)

    const mobileOut = path.join(compareDir, 'mobile-375-full.png')
    await mobilePage.screenshot({ path: mobileOut, fullPage: true, timeout: 60000 })
    console.log(`  ✓ Saved compare/mobile-375-full.png`)

    console.log('All comparison screenshots generated in docs/design/cong-dong/compare/!')
  } finally {
    // 6. Cleanup created test data in finally
    if (browser) {
      await browser.close().catch(() => {})
    }
    if (pageId) {
      await payload.delete({ collection: 'pages', id: pageId }).catch((e) => {
        console.error('Failed to cleanup test page:', e)
      })
      console.log(`Cleaned up test page ID ${pageId}`)
    }
    for (const tid of createdTestimonialIds) {
      await payload.delete({ collection: 'testimonials', id: tid }).catch(() => {})
    }
    if (createdTestimonialIds.length > 0) {
      console.log(`Cleaned up ${createdTestimonialIds.length} sample testimonials`)
    }
    await payload.destroy()
    clearTimeout(globalTimer)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
