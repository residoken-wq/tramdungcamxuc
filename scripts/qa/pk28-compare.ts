import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { puckConfig } from '../../src/puck/config'
import { journeyTemplate } from '../../src/puck/templates/journey'

async function main() {
  const rootDir = process.cwd()
  const refDir = path.resolve(rootDir, 'docs/design/chuyen-minh/ref')
  const compareDir = path.resolve(rootDir, 'docs/design/chuyen-minh/compare')

  if (!fs.existsSync(compareDir)) {
    fs.mkdirSync(compareDir, { recursive: true })
  }

  // Load CSS
  const cssPath = path.resolve(rootDir, '.next/standalone-compare.css')
  if (!fs.existsSync(cssPath)) {
    throw new Error(`CSS file not found at ${cssPath}. Run tailwindcss build first.`)
  }
  const cssContent = fs.readFileSync(cssPath, 'utf-8')

  console.log('Launching browser for PK-28 comparison screenshots...')
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  const items = journeyTemplate.content.slice(0, 20)
  console.log(`Processing ${items.length} sections...`)

  for (let idx = 0; idx < items.length; idx++) {
    const slideNum = String(idx + 1).padStart(2, '0')
    const item = items[idx]
    const refFile = path.join(refDir, `p-${slideNum}.png`)
    const outFile = path.join(compareDir, `p-${slideNum}.png`)

    if (!fs.existsSync(refFile)) {
      console.warn(`[WARN] Reference file not found: ${refFile}`)
      continue
    }

    console.log(`[${idx + 1}/20] Rendering section p-${slideNum} (${item.type})...`)

    const renderedHtml = renderToString(
      React.createElement(Render, {
        config: puckConfig,
        data: {
          content: [item],
          root: { props: { title: 'Trang lộ trình' } },
        },
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
    // Ensure Google fonts are fully loaded
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400)

    const targetElement = page.locator('section').first()
    const elementToCapture = (await targetElement.count()) > 0 ? targetElement : page.locator('#capture-root')
    const webScreenshotBuffer = await elementToCapture.screenshot()

    // Load reference PDF screenshot
    const refBuffer = fs.readFileSync(refFile)

    const refMeta = await sharp(refBuffer).metadata()
    const webMeta = await sharp(webScreenshotBuffer).metadata()

    const refWidth = refMeta.width || 1440
    const refHeight = refMeta.height || 810
    const webWidth = webMeta.width || 1440
    const webHeight = webMeta.height || 810

    // Equalize heights: target height is max of both, but at least 810
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
        { input: Buffer.from(`<svg width="${dividerWidth}" height="${targetHeight}"><rect width="${dividerWidth}" height="${targetHeight}" fill="#EF3B83"/></svg>`), top: headerHeight, left: scaledRefWidth },
        { input: rightResized, top: headerHeight, left: scaledRefWidth + dividerWidth },
      ])
      .png()
      .toFile(outFile)

    console.log(`  ✓ Saved compare/p-${slideNum}.png (${totalWidth}x${totalHeight})`)
  }

  await browser.close()
  console.log('All 20 comparison screenshots generated successfully in docs/design/chuyen-minh/compare/!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
