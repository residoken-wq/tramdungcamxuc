import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { puckConfig } from '../../src/puck/config'
import { communityTemplate } from '../../src/puck/templates/community'
import { collectPageStyles } from '../../src/puck/style/style-css'
import { DEFAULT_DESIGN_SYSTEM } from '../../src/lib/design/design-system'

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

async function main() {
  const rootDir = process.cwd()
  const refDir = path.resolve(rootDir, 'docs/design/cong-dong/ref')
  const compareDir = path.resolve(rootDir, 'docs/design/cong-dong/compare')

  if (!fs.existsSync(compareDir)) {
    fs.mkdirSync(compareDir, { recursive: true })
  }

  // Load CSS
  const cssPath = path.resolve(rootDir, '.next/standalone-compare.css')
  if (!fs.existsSync(cssPath)) {
    throw new Error(`CSS file not found at ${cssPath}. Run tailwindcss build first.`)
  }
  const cssContent = fs.readFileSync(cssPath, 'utf-8')

  console.log('Launching browser for CD-01 comparison screenshots...')
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  const items = communityTemplate.content
  console.log(`Processing ${items.length} sections for slides 48–57...`)

  for (let idx = 0; idx < items.length; idx++) {
    const slideNum = 48 + idx
    const item = items[idx]
    const refFile = path.join(refDir, `p-${slideNum}.png`)
    const outFile = path.join(compareDir, `p-${slideNum}.png`)

    if (!fs.existsSync(refFile)) {
      console.warn(`[WARN] Reference file not found: ${refFile}`)
      continue
    }

    console.log(`[${idx + 1}/${items.length}] Rendering section p-${slideNum} (${item.type})...`)

    // Sample testimonials for section 5.5 so it renders featured testimonials in compare screenshot
    const resolvedProps =
      item.type === 'TestimonialGrid'
        ? {
            ...item.props,
            _resolved: {
              testimonials: [
                {
                  id: 1,
                  name: '[MẪU] ĐĂNG',
                  quote:
                    'Một highlight là giây phút bình yên và kết nối khi gặp nhau lúc 5 giờ sáng. Cảm ơn ME TIME vì đã cho một sự an bình để làm chỗ dựa tinh thần lẫn thể chất.',
                  consent: true,
                },
                {
                  id: 2,
                  name: '[MẪU] STELLA',
                  quote:
                    'Động lực để mình xây dựng sự kỷ luật. Ít nhất mình cũng đã biết quan tâm và yêu thương mình nhiều hơn.',
                  consent: true,
                },
                {
                  id: 3,
                  name: '[MẪU] NGỌC',
                  quote:
                    'Vui vì luôn có ai đấy dậy sớm, hào hứng. Có thể dành thời gian cho mình, thong thả làm những điều mình cần.',
                  consent: true,
                },
              ],
            },
          }
        : item.props

    const itemToRender = { ...item, props: resolvedProps }

    const pageData = {
      content: [itemToRender],
      root: { props: { title: 'Trang Cộng đồng' } },
    }
    const { css: blockCss } = collectPageStyles(pageData, DEFAULT_DESIGN_SYSTEM)

    const renderedHtml = renderToString(
      React.createElement(Render, {
        config: puckConfig,
        data: pageData,
      }),
    )

    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Playfair+Display:ital,wght@1,400;1,700&display=swap" rel="stylesheet">
  <style>
    ${blockCss}
  </style>
  <style>
    :root {
      --color-deep-navy: #280A60;
      --color-bright-magenta: #BC039E;
      --color-accent-pink: #EF3B83;
      --color-soft-pink: #FDE6F6;
      --color-lavender-mist: #E9DDF9;
      --color-mint-haze: #D9F1EA;
      --color-butter-cream: #F6E9B8;
      --color-warm-ivory: #FAF7F4;
      --color-deep-navy-rgb: 40 10 96;
      --color-bright-magenta-rgb: 188 3 158;
      --color-accent-pink-rgb: 239 59 131;
      --color-soft-pink-rgb: 253 230 246;
      --color-lavender-mist-rgb: 233 221 249;
      --color-mint-haze-rgb: 217 241 234;
      --color-butter-cream-rgb: 246 233 184;
      --color-warm-ivory-rgb: 250 247 244;
      --font-heading: 'Anton', sans-serif;
      --font-body: 'Montserrat', sans-serif;
      --font-quote: 'Playfair Display', serif;
      --font-ui: 'Montserrat', sans-serif;
      --font-display: 'Anton', sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF7F4;
      font-family: 'Montserrat', sans-serif;
    }
    .font-display { font-family: 'Anton', sans-serif !important; }
    .font-heading { font-family: 'Anton', sans-serif !important; }
    .font-body { font-family: 'Montserrat', sans-serif !important; }
    .font-ui { font-family: 'Montserrat', sans-serif !important; }
    .font-quote { font-family: 'Playfair Display', serif !important; }
    ${cssContent}
  </style>
</head>
<body class="font-sans antialiased">
  <div id="capture-root">
    ${renderedHtml}
  </div>
</body>
</html>`

    await page.setContent(fullHtml, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)

    const targetElement = page.locator('section').first()
    const elementToCapture = (await targetElement.count()) > 0 ? targetElement : page.locator('#capture-root')
    const webScreenshotBuffer = await elementToCapture.screenshot()

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
          WEB THỰC TẾ 1440px (${item.type})
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

  // 375px mobile full-page screenshot
  console.log('Rendering 375px mobile full page...')
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
  })
  const mobilePage = await mobileContext.newPage()

  const renderedAllHtml = renderToString(
    React.createElement(Render, {
      config: puckConfig,
      data: communityTemplate,
    }),
  )

  const mobileFullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=375, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Playfair+Display:ital,wght@1,400;1,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-deep-navy: #280A60;
      --color-bright-magenta: #BC039E;
      --color-accent-pink: #EF3B83;
      --color-soft-pink: #FDE6F6;
      --color-lavender-mist: #E9DDF9;
      --color-mint-haze: #D9F1EA;
      --color-butter-cream: #F6E9B8;
      --color-warm-ivory: #FAF7F4;
      --font-heading: 'Anton', sans-serif;
      --font-body: 'Montserrat', sans-serif;
      --font-quote: 'Playfair Display', serif;
      --font-ui: 'Montserrat', sans-serif;
      --font-display: 'Anton', sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF7F4;
      font-family: 'Montserrat', sans-serif;
    }
    ${cssContent}
  </style>
</head>
<body class="font-sans antialiased overflow-x-hidden">
  <div id="capture-root">
    ${renderedAllHtml}
  </div>
</body>
</html>`

  await mobilePage.setContent(mobileFullHtml, { waitUntil: 'load' })
  await mobilePage.evaluate(() => document.fonts.ready)
  await mobilePage.waitForTimeout(300)

  const mobileOut = path.join(compareDir, 'mobile-375-full.png')
  await mobilePage.screenshot({ path: mobileOut, fullPage: true })
  console.log(`  ✓ Saved compare/mobile-375-full.png`)

  await browser.close()
  console.log('All comparison screenshots generated in docs/design/cong-dong/compare/!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
