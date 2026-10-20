import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import { puckConfig } from '../src/puck/config'
import {
  homeV2Template,
  journeyTemplate,
  aboutTemplate,
  coachTemplate,
  contactTemplate,
} from '../src/puck/templates'

const templates = [
  { key: 'home-v2', data: homeV2Template },
  { key: 'journey', data: journeyTemplate },
  { key: 'about', data: aboutTemplate },
  { key: 'coach', data: coachTemplate },
  { key: 'contact', data: contactTemplate },
]

async function main() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/sm07')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // Load compiled Next.js CSS files
  const chunksDir = path.resolve(process.cwd(), '.next/static/chunks')
  let combinedCss = ''
  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir)
    for (const f of files) {
      if (f.endsWith('.css')) {
        combinedCss += '\n' + fs.readFileSync(path.join(chunksDir, f), 'utf-8')
      }
    }
  }

  // Base design tokens
  const baseTokensCss = `
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
      --space-breath-sm: 16px;
      --space-breath-md: 24px;
      --space-breath-lg: 32px;
      --radius-card: 20px;
      --shadow-soft: 0 4px 20px -2px rgba(40, 10, 96, 0.06);
    }
    body {
      margin: 0;
      background-color: var(--color-warm-ivory);
      color: var(--color-deep-navy);
      font-family: 'Montserrat', sans-serif;
    }
  `

  console.log(`Starting Chrome for screenshot capture...`)
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  })

  try {
    for (const t of templates) {
      console.log(`Rendering template: ${t.key}...`)
      const renderedHtml = renderToString(
        React.createElement(Render, {
          config: puckConfig,
          data: t.data,
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
    ${baseTokensCss}
    ${combinedCss}
  </style>
</head>
<body class="bg-warm-ivory text-deep-navy font-sans antialiased">
  <div id="puck-root">
    ${renderedHtml}
  </div>
</body>
</html>`

      // 1. Desktop 1440px
      const pageDesktop = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      })
      await pageDesktop.setContent(fullHtml, { waitUntil: 'load' })
      await pageDesktop.waitForTimeout(500)
      const desktopPath = path.join(outDir, `${t.key}-1440.png`)
      await pageDesktop.screenshot({ path: desktopPath, fullPage: true })
      console.log(`  ✓ Saved ${t.key}-1440.png`)
      await pageDesktop.close()

      // 2. Mobile 375px
      const pageMobile = await browser.newPage({
        viewport: { width: 375, height: 812 },
      })
      await pageMobile.setContent(fullHtml, { waitUntil: 'load' })
      await pageMobile.waitForTimeout(500)
      const mobilePath = path.join(outDir, `${t.key}-375.png`)
      await pageMobile.screenshot({ path: mobilePath, fullPage: true })
      console.log(`  ✓ Saved ${t.key}-375.png`)
      await pageMobile.close()
    }
  } finally {
    await browser.close()
  }

  console.log(`All 10 preview screenshots successfully generated in docs/screenshots/sm07/`)
}

main().catch((err) => {
  console.error('Error generating screenshots:', err)
  process.exit(1)
})
