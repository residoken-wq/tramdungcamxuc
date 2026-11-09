import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import { footerPuckConfig, headerPuckConfig } from '../../src/puck/config'
import { footerDefaultTemplate, headerDefaultTemplate } from '../../src/puck/templates'
import { Footer, type SocialLink, type LegalLink, type SellerInfo } from '../../src/components/site/Footer'
import { Navbar, type NavItem } from '../../src/components/site/Navbar'

const sampleSocials: SocialLink[] = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/tramdungcamxuc' },
  { key: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@tramdungcamxuc' },
  { key: 'youtube', label: 'YouTube', href: 'https://youtube.com/@tramdungcamxuc' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/tramdungcamxuc' },
  { key: 'zalo', label: 'Nhóm Zalo', href: 'https://zalo.me/g/community' },
  { key: 'shopee', label: 'Shopee', href: 'https://shopee.vn/tramdungcamxuc' },
]

const sampleLegalLinks: LegalLink[] = [
  { slug: 'chinh-sach-bao-mat', title: 'Chính sách bảo mật' },
  { slug: 'dieu-khoan-dich-vu', title: 'Điều khoản dịch vụ' },
  { slug: 'chinh-sach-thanh-toan', title: 'Chính sách giá & thanh toán' },
]

const sampleSellerInfo: SellerInfo = {
  name: 'TRẠM DỪNG CẢM XÚC',
  taxCode: '8401234567',
  address: 'TP. Hồ Chí Minh, Việt Nam',
  phone: '0901 234 567',
  email: 'contact@tramdungcamxuc.com',
}

const sampleNavItems: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Về Trạm', href: '/ve-tram' },
  { label: 'Hành trình 28 ngày', href: '/habit', featured: true },
  { label: 'Coach 1:1', href: '/coaching' },
  { label: 'Thư viện', href: '/tai-nguyen' },
]

async function main() {
  const rootDir = process.cwd()
  const outDir = path.resolve(rootDir, 'docs/screenshots/pk33')
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

  // Prepare populated footer template data for comparison
  const populatedFooterTemplate = JSON.parse(JSON.stringify(footerDefaultTemplate))
  // Populate props in left & right containers
  const leftCol = populatedFooterTemplate.content[0].props.items[0]
  const rightCol = populatedFooterTemplate.content[0].props.items[1]
  const socialBlock = leftCol.props.items.find((i: any) => i.type === 'SocialLinks')
  if (socialBlock) socialBlock.props.socialLinks = sampleSocials
  const legalBlock = rightCol.props.items.find((i: any) => i.type === 'LegalFooter')
  if (legalBlock) {
    legalBlock.props.legalLinks = sampleLegalLinks
    legalBlock.props.sellerInfo = sampleSellerInfo
  }

  // Prepare populated header template data
  const populatedHeaderTemplate = JSON.parse(JSON.stringify(headerDefaultTemplate))
  const navBlock = populatedHeaderTemplate.content[0].props.items.find((i: any) => i.type === 'NavMenu')
  if (navBlock) navBlock.props.items = sampleNavItems
  const ctaBlock = populatedHeaderTemplate.content[0].props.items.find((i: any) => i.type === 'HeaderCTA')
  if (ctaBlock) {
    ctaBlock.props.label = 'Nhận quà tặng 🎁'
    ctaBlock.props.href = '/habit'
  }

  const renders = [
    {
      name: '01-footer-code',
      element: React.createElement(Footer, {
        legalLinks: sampleLegalLinks,
        sellerInfo: sampleSellerInfo,
        socialLinks: sampleSocials,
        tagline: 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
      }),
    },
    {
      name: '02-footer-template',
      element: React.createElement(Render, {
        config: footerPuckConfig,
        data: populatedFooterTemplate,
      }),
    },
    {
      name: '03-header-code',
      element: React.createElement(Navbar, {
        items: sampleNavItems,
        cta: { label: 'Nhận quà tặng 🎁', href: '/habit' },
      }),
    },
    {
      name: '04-header-template',
      element: React.createElement(Render, {
        config: headerPuckConfig,
        data: populatedHeaderTemplate,
      }),
    },
    {
      name: '05-navigation-button-empty',
      element: React.createElement(
        'div',
        { style: { padding: '32px', backgroundColor: '#F8F9FA', fontFamily: 'Montserrat, sans-serif' } },
        React.createElement(
          'div',
          { style: { maxWidth: '600px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB' } },
          React.createElement('label', { style: { display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#280A60' } }, 'Trang chân trang (Builder)'),
          React.createElement('div', { style: { padding: '10px 14px', backgroundColor: '#F3F4F6', borderRadius: '6px', fontSize: '13px', color: '#6B7280', marginBottom: '12px' } }, '— Chưa chọn trang —'),
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement(
              'button',
              {
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#280A60',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  width: 'fit-content',
                },
              },
              React.createElement('span', null, '🪄'),
              React.createElement('span', null, 'Tạo chân trang từ mẫu'),
            ),
            React.createElement(
              'p',
              { style: { fontSize: '12px', color: '#6B7280', margin: 0 } },
              'Dựng xong, bấm Xuất bản trong builder, rồi chọn Nguồn = Dựng bằng Builder và bấm Lưu.',
            ),
          ),
        ),
      ),
    },
  ]

  for (const item of renders) {
    console.log(`Rendering ${item.name}...`)
    const html = renderToString(item.element)
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

    // 1440
    const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page1440.setContent(fullHtml, { waitUntil: 'networkidle' })
    const path1440 = path.join(outDir, `${item.name}-1440.png`)
    await page1440.screenshot({ path: path1440, fullPage: true })
    console.log(`Saved ${path1440}`)
    await page1440.close()

    // 375
    const page375 = await browser.newPage({ viewport: { width: 375, height: 667 } })
    await page375.setContent(fullHtml, { waitUntil: 'networkidle' })
    const path375 = path.join(outDir, `${item.name}-375.png`)
    await page375.screenshot({ path: path375, fullPage: true })
    console.log(`Saved ${path375}`)
    await page375.close()
  }

  await browser.close()
  console.log('All PK-33 screenshots captured successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
