import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import { footerPuckConfig } from '../../src/puck/config'
import type { SocialLink } from '../../src/components/site/Footer'

const sample6Socials: SocialLink[] = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/tramdungcamxuc' },
  { key: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@tramdungcamxuc' },
  { key: 'youtube', label: 'YouTube', href: 'https://youtube.com/@tramdungcamxuc' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/tramdungcamxuc' },
  { key: 'zalo', label: 'Nhóm Zalo', href: 'https://zalo.me/g/community' },
  { key: 'shopee', label: 'Shopee', href: 'https://shopee.vn/tramdungcamxuc' },
]

async function main() {
  const rootDir = process.cwd()
  const outDir = path.resolve(rootDir, 'docs/screenshots/pk32')
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

  const footers = [
    {
      name: '01-footer-light',
      title: 'Chân trang nền Sáng (Warm Ivory)',
      footerBg: 'warm-ivory' as const,
    },
    {
      name: '02-footer-deep-navy',
      title: 'Chân trang nền Xanh thẫm (Deep Navy)',
      footerBg: 'deep-navy' as const,
    },
  ]

  for (const footer of footers) {
    console.log(`Rendering ${footer.name}...`)
    const puckData = {
      root: {
        props: {
          title: footer.title,
          footerBg: footer.footerBg,
        },
      },
      content: [
        {
          type: 'Container',
          props: {
            id: 'footer-container',
            width: 'boxed',
            contentWidth: 'xl',
            padding: 'lg',
            layout: {
              direction: 'column',
              justify: 'start',
              align: 'stretch',
              gap: 'md',
            },
            items: [
              {
                type: 'SiteLogo',
                props: {
                  id: 'footer-logo',
                  size: 'md',
                },
              },
              {
                type: 'Tagline',
                props: {
                  id: 'footer-tagline',
                  align: 'left',
                  showHeartLine: true,
                  tagline: 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
                },
              },
              {
                type: 'SocialLinks',
                props: {
                  id: 'footer-social',
                  align: 'left',
                  socialLinks: sample6Socials,
                },
              },
              {
                type: 'LegalFooter',
                props: {
                  id: 'footer-legal',
                  legalLinks: [
                    { slug: 'chinh-sach-bao-mat', title: 'Chính sách bảo mật' },
                    { slug: 'dieu-khoan-dich-vu', title: 'Điều khoản dịch vụ' },
                    { slug: 'chinh-sach-thanh-toan', title: 'Chính sách giá & thanh toán' },
                  ],
                  sellerInfo: {
                    name: 'TRẠM DỪNG CẢM XÚC',
                    taxCode: '8401234567',
                    address: 'TP. Hồ Chí Minh, Việt Nam',
                    phone: '0901 234 567',
                    email: 'contact@tramdungcamxuc.com',
                  },
                },
              },
            ],
          },
        },
      ],
    }

    const html = renderToString(
      React.createElement(Render, {
        config: footerPuckConfig,
        data: puckData as any,
      }),
    )

    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
  <style>${cssContent}</style>
</head>
<body class="bg-warm-ivory text-deep-navy antialiased">
  ${html}
</body>
</html>`

    // Render at 1440
    const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page1440.setContent(fullHtml, { waitUntil: 'networkidle' })
    const path1440 = path.join(outDir, `${footer.name}-1440.png`)
    await page1440.screenshot({ path: path1440, fullPage: true })
    console.log(`Saved ${path1440}`)
    await page1440.close()

    // Render at 375
    const page375 = await browser.newPage({ viewport: { width: 375, height: 667 } })
    await page375.setContent(fullHtml, { waitUntil: 'networkidle' })
    const path375 = path.join(outDir, `${footer.name}-375.png`)
    await page375.screenshot({ path: path375, fullPage: true })
    console.log(`Saved ${path375}`)
    await page375.close()
  }

  await browser.close()
  console.log('All screenshots captured successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

