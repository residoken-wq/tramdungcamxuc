import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import { puckConfig } from '../../src/puck/config'

async function main() {
  const rootDir = process.cwd()
  const outDir = path.resolve(rootDir, 'docs/screenshots/pk34')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const cssPath = path.resolve(rootDir, '.next/standalone-compare.css')
  const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''

  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
    headless: true,
  })

  const sampleHighlights = [
    {
      title: 'Điểm dừng an toàn',
      text: 'Nơi bạn được lắng nghe trọn vẹn mà không bị phán xét hay giục giã.',
    },
    {
      title: 'Nhận diện cảm xúc',
      text: 'Gọi tên cảm xúc thật, mở khóa những tầng sâu kín bên trong tâm hồn.',
    },
    {
      title: 'Hành động nhỏ bền bỉ',
      text: 'Từng bước chuyển hóa thói quen để sống bình an và trọn vẹn mỗi ngày.',
    },
  ]

  const parts = [
    {
      name: '01-image-text-box-quote-highlights-light',
      data: {
        root: { props: { title: 'ImageText Box Quote + Highlights Light' } },
        content: [
          {
            type: 'ImageText',
            props: {
              id: 'it-light',
              seriesLabel: 'VỀ TRẠM DỪNG',
              titleLine1: 'TẠI SAO LẠI LÀ',
              titleLine2: 'TRẠM DỪNG CẢM XÚC?',
              image: '/brand/hana-portrait-transparent.png',
              imageAlt: 'Hana Lương tại Trạm Dừng Cảm Xúc',
              imageBadge: 'Không gian an toàn',
              imagePosition: 'left',
              bgColor: 'warm-ivory',
              quote: 'Trạm dừng không phải để bỏ cuộc, mà để bạn gom góp lại sức mạnh trước khi tiếp tục hành trình.',
              quoteStyle: 'box',
              paragraphs: [
                'Cuộc sống bận rộn cuốn chúng ta vào những guồng quay không ngừng nghỉ. Đôi khi, điều chúng ta cần nhất không phải là đi nhanh hơn, mà là một khoảng dừng thật sự chất lượng.',
                'Tại Trạm, bạn được thả lỏng, nhìn nhận lại chính mình và tìm lại sự cân bằng từ sâu bên trong.',
              ],
              highlights: sampleHighlights,
              buttonText: 'Khám phá hành trình',
              buttonHref: '/habit',
            },
          },
        ],
      },
    },
    {
      name: '02-image-text-box-quote-highlights-navy',
      data: {
        root: { props: { title: 'ImageText Box Quote + Highlights Navy' } },
        content: [
          {
            type: 'ImageText',
            props: {
              id: 'it-navy',
              seriesLabel: 'VỀ TRẠM DỪNG',
              titleLine1: 'TẠI SAO LẠI LÀ',
              titleLine2: 'TRẠM DỪNG CẢM XÚC?',
              image: '/brand/hana-portrait-transparent.png',
              imageAlt: 'Hana Lương tại Trạm Dừng Cảm Xúc',
              imageBadge: 'Không gian an toàn',
              imagePosition: 'left',
              bgColor: 'deep-navy',
              quote: 'Trạm dừng không phải để bỏ cuộc, mà để bạn gom góp lại sức mạnh trước khi tiếp tục hành trình.',
              quoteStyle: 'box',
              paragraphs: [
                'Cuộc sống bận rộn cuốn chúng ta vào những guồng quay không ngừng nghỉ. Đôi khi, điều chúng ta cần nhất không phải là đi nhanh hơn, mà là một khoảng dừng thật sự chất lượng.',
                'Tại Trạm, bạn được thả lỏng, nhìn nhận lại chính mình và tìm lại sự cân bằng từ sâu bên trong.',
              ],
              highlights: sampleHighlights,
              buttonText: 'Khám phá hành trình',
              buttonHref: '/habit',
            },
          },
        ],
      },
    },
  ]

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '375', width: 375, height: 812 },
  ]

  for (const part of parts) {
    const renderedMarkup = renderToString(React.createElement(Render, { config: puckConfig, data: part.data as any }))
    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${part.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,400..700;1,400..700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
  <style>
    ${cssContent}
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
      background: #faf7f4;
    }
  </style>
</head>
<body>
  ${renderedMarkup}
</body>
</html>`

    for (const vp of viewports) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      })
      await page.setContent(fullHtml, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)

      const screenshotPath = path.resolve(outDir, `${part.name}-${vp.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`Saved screenshot: ${screenshotPath}`)
      await page.close()
    }
  }

  await browser.close()
  console.log('PK-34 screenshots generated successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
