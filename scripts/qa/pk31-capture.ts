import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import { puckConfig, footerPuckConfig } from '../../src/puck/config'

async function main() {
  const rootDir = process.cwd()
  const outDir = path.resolve(rootDir, 'docs/screenshots/pk31')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const cssPath = path.resolve(rootDir, '.next/standalone-compare.css')
  const cssContent = fs.readFileSync(cssPath, 'utf-8')

  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
    headless: true,
  })

  const parts = [
    {
      name: '01-newlines-and-card-subtitle',
      config: puckConfig,
      data: {
        root: { props: { title: 'Thẻ xuống dòng & Subtitle' } },
        content: [
          {
            type: 'VisionMission',
            props: {
              id: 'vm-preview',
              seriesLabel: 'TẦM NHÌN & SỨ MỆNH',
              titleLine1: 'ĐIỂM TỰA CẢM XÚC',
              titleLine2: 'HÀNH TRÌNH CHUYỂN HÓA',
              cards: [
                {
                  type: 'VisionCard',
                  props: {
                    id: 'vc-1',
                    title: 'TẦM NHÌN',
                    content: 'VỚI CÁ NHÂN\nTrở thành người bạn đồng hành an toàn trên mọi chặng đường.',
                  },
                },
                {
                  type: 'VisionCard',
                  props: {
                    id: 'vc-2',
                    title: 'SỨ MỆNH',
                    content: 'VỚI CỘNG ĐỒNG\nLan tỏa trí tuệ cảm xúc và thói quen bình an nội tại.',
                  },
                },
              ],
            },
          },
          {
            type: 'IconCardGrid',
            props: {
              id: 'grid-preview',
              seriesLabel: 'GIÁ TRỊ CỐT LÕI',
              titleLine1: 'NGUYÊN TẮC ĐỒNG HÀNH',
              titleLine2: 'DỊU DÀNG VÀ TINH TẾ',
              columns: 3,
              cards: [
                {
                  type: 'Card',
                  props: {
                    id: 'c-1',
                    icon: 'heart',
                    title: 'Gentle',
                    subtitle: 'Dịu dàng & Tinh tế',
                    subtitleColor: 'bright-magenta',
                    text: 'Đồng hành an toàn\nLuôn tôn trọng nhịp điệu của bạn.',
                  },
                },
                {
                  type: 'Card',
                  props: {
                    id: 'c-2',
                    icon: 'shield',
                    title: 'Trustworthy',
                    subtitle: 'Đáng tin cậy',
                    subtitleColor: 'bright-magenta',
                    text: 'Dựa trên khoa học hành vi\nBảo mật tuyệt đối không gian chia sẻ.',
                  },
                },
                {
                  type: 'Card',
                  props: {
                    id: 'c-3',
                    icon: 'compass',
                    title: 'Practical',
                    subtitle: 'Vừa sức & Bền bỉ',
                    subtitleColor: 'bright-magenta',
                    text: 'Hành động nhỏ 5 phút mỗi ngày\nĐúc kết sau từng bước đi.',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      name: '02-hanastory-boxquote-highlights',
      config: puckConfig,
      data: {
        root: { props: { title: 'HanaStory 3 thẻ & Hộp trích dẫn' } },
        content: [
          {
            type: 'HanaStory',
            props: {
              id: 'story-preview',
              seriesLabel: 'VỀ NGƯỜI ĐỒNG HÀNH',
              titleLine1: 'HÀNH TRÌNH ĐỒNG HÀNH',
              titleLine2: 'THẤU CẢM & CHUYỂN HÓA',
              jobTitle: 'HANA LƯƠNG · ICF ACC COACH',
              quoteStyle: 'box',
              quoteLine: 'Cảm xúc là la bàn dẫn lối, thấu cảm là điểm tựa để bạn vững vàng chuyển mình.',
              storyContent:
                'Hơn 10 năm đồng hành cùng phụ nữ công sở, tôi nhận ra chuyển mình không phải là một cú nhảy vội vã.\n\nĐó là một hành trình dịu dàng: bắt đầu từ việc dám dừng lại, gọi tên sự chênh vênh và chọn bước tiếp cùng thế mạnh độc bản của riêng bạn.',
              highlights: [
                {
                  title: '01 Quan sát',
                  text: 'Lắng nghe cơ thể và nhịp thở trong từng khoảnh khắc biến động.',
                },
                {
                  title: '02 Thấu hiểu',
                  text: 'Nhận diện cảm xúc thật bên dưới sự lo lắng hay áp lực.',
                },
                {
                  title: '03 Vững bước',
                  text: 'Lựa chọn phản ứng vừa sức và xây nhịp thực hành bền bỉ.',
                },
              ],
              chips: [{ text: 'ICF ACC' }, { text: '10+ Năm Kinh Nghiệm' }, { text: 'Emotional Agility' }],
            },
          },
        ],
      },
    },
    {
      name: '03-footer-deep-navy',
      config: footerPuckConfig,
      data: {
        root: {
          props: {
            title: 'Chân trang nền Deep Navy',
            footerBg: 'deep-navy',
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
                    socialLinks: [
                      { label: 'LinkedIn', href: 'https://linkedin.com' },
                      { label: 'Zalo Group', href: 'https://zalo.me' },
                      { label: 'Shopee', href: 'https://shopee.vn' },
                    ],
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
      },
    },
  ]

  for (const part of parts) {
    console.log(`Rendering ${part.name}...`)
    const html = renderToString(
      React.createElement(Render, {
        config: part.config,
        data: part.data as any,
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
    await page1440.screenshot({
      path: path.join(outDir, `${part.name}-1440.png`),
      fullPage: true,
    })
    await page1440.close()

    // Render at 375
    const page375 = await browser.newPage({ viewport: { width: 375, height: 812 } })
    await page375.setContent(fullHtml, { waitUntil: 'networkidle' })
    await page375.screenshot({
      path: path.join(outDir, `${part.name}-375.png`),
      fullPage: true,
    })
    await page375.close()
  }

  await browser.close()
  console.log(`Captured all screenshots successfully in ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

