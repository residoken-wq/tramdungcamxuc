import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { chromium } from '@playwright/test'
import { puckConfig } from '../src/puck/config'
import { homeV2Template } from '../src/puck/templates/home-v2'

async function main() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/pk03')
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

  // Brand Design Tokens & Font styles
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
      --font-heading: 'Anton', sans-serif;
      --font-body: 'Montserrat', sans-serif;
      --font-quote: 'Playfair Display', serif;
    }
    body {
      margin: 0;
      background-color: var(--color-warm-ivory);
      color: var(--color-deep-navy);
      font-family: 'Montserrat', sans-serif;
    }
  `

  console.log('Launching Chromium for PK-03 screenshot capture...')
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
    headless: true,
  })

  try {
    // 1. Render Public HTML
    console.log('Rendering public Home-v2 template with StatsBar v3 and JourneySteps v3...')
    const renderedHtml = renderToString(
      React.createElement(Render, {
        config: puckConfig,
        data: homeV2Template,
      }),
    )

    const fullPublicHtml = `<!DOCTYPE html>
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

    // Capture Public Desktop (1440px)
    console.log('Capturing public desktop 1440px...')
    const pageDesktop = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await pageDesktop.setContent(fullPublicHtml, { waitUntil: 'load' })
    await pageDesktop.waitForTimeout(600)

    // Full page desktop
    await pageDesktop.screenshot({
      path: path.join(outDir, '01-public-desktop-1440.png'),
      fullPage: true,
    })
    console.log('  ✓ Saved 01-public-desktop-1440.png')

    // Also capture focused JourneySteps section
    const journeySection = pageDesktop.locator('section[aria-label="5 Bước hành trình"]')
    if ((await journeySection.count()) > 0) {
      await journeySection.first().scrollIntoViewIfNeeded()
      await pageDesktop.waitForTimeout(300)
      await journeySection.first().screenshot({
        path: path.join(outDir, 'public-journey-steps-1440.png'),
      })
      console.log('  ✓ Saved public-journey-steps-1440.png')
    }

    // Also capture focused StatsBar section
    const statsSection = pageDesktop.locator('section[aria-label="Số liệu ấn tượng"]')
    if ((await statsSection.count()) > 0) {
      await statsSection.first().scrollIntoViewIfNeeded()
      await pageDesktop.waitForTimeout(300)
      await statsSection.first().screenshot({
        path: path.join(outDir, 'public-stats-bar-1440.png'),
      })
      console.log('  ✓ Saved public-stats-bar-1440.png')
    }

    await pageDesktop.close()

    // Capture Public Mobile (375px)
    console.log('Capturing public mobile 375px...')
    const pageMobile = await browser.newPage({
      viewport: { width: 375, height: 812 },
    })
    await pageMobile.setContent(fullPublicHtml, { waitUntil: 'load' })
    await pageMobile.waitForTimeout(600)
    await pageMobile.screenshot({
      path: path.join(outDir, '02-public-mobile-375.png'),
      fullPage: true,
    })
    console.log('  ✓ Saved 02-public-mobile-375.png')
    await pageMobile.close()

    // 2. Render Builder UI Simulation with Step selected
    console.log('Rendering builder UI screenshot...')
    const builderHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Playfair+Display:ital,wght@1,400;1,700&display=swap" rel="stylesheet">
  <style>
    ${baseTokensCss}
    ${combinedCss}

    * { box-sizing: border-box; }
    body { margin: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; overflow: hidden; }

    /* Builder Layout */
    .builder-topbar {
      height: 48px;
      background: #280A60;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-size: 13px;
    }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .topbar-badge { background: #3b1480; border: 1px solid rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #FDE6F6; }
    .topbar-right { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .topbar-btn { background: #fff; color: #280A60; border: none; border-radius: 6px; padding: 6px 14px; font-weight: 600; cursor: pointer; font-size: 12px; }
    .topbar-btn-publish { background: #EF3B83; color: #fff; }

    .builder-body { display: flex; height: calc(100vh - 48px); }

    /* Left Sidebar */
    .builder-left {
      width: 260px;
      background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }
    .left-tabs {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .left-tab {
      flex: 1;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
    }
    .left-tab.active {
      color: #280A60;
      background: #fff;
      border-bottom: 2px solid #BC039E;
    }
    .left-content { padding: 12px; overflow-y: auto; flex: 1; }
    .block-group-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 12px 0 6px 4px; }
    .block-item {
      padding: 8px 12px;
      margin-bottom: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: grab;
    }
    .block-item:hover { border-color: #cbd5e1; background: #f1f5f9; }

    /* Center Canvas Area */
    .builder-center {
      flex: 1;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .canvas-toolbar {
      height: 40px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
    }
    .canvas-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      display: flex;
      justify-content: center;
    }
    .canvas-frame {
      width: 100%;
      max-width: 900px;
      background: #fff;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08);
      border-radius: 8px;
      min-height: 500px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    /* Selection overlay in canvas */
    .selected-block {
      outline: 2px solid #BC039E;
      position: relative;
    }
    .selected-badge {
      position: absolute;
      top: -24px;
      right: 0;
      background: #280A60;
      color: #fff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px 4px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    /* Right Sidebar (Inspector) */
    .builder-right {
      width: 330px;
      background: #fff;
      border-left: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .inspector-header {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .inspector-breadcrumb { font-size: 12px; color: #64748b; }
    .inspector-breadcrumb strong { color: #280A60; font-weight: 700; }
    .inspector-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 12px; font-weight: 600; color: #334155; }
    .field-hint { font-size: 11px; color: #64748b; margin-top: -2px; }
    .field-input, .field-select, .field-textarea {
      width: 100%;
      padding: 7px 10px;
      font-size: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fff;
      color: #1e293b;
      outline: none;
    }
    .field-input:focus, .field-select:focus, .field-textarea:focus {
      border-color: #BC039E;
      box-shadow: 0 0 0 1px #BC039E;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
    }
    .toggle-switch {
      width: 38px;
      height: 22px;
      background: #BC039E;
      border-radius: 12px;
      position: relative;
      cursor: pointer;
    }
    .toggle-knob {
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 3px;
      right: 3px;
      transition: all 0.2s;
    }
  </style>
</head>
<body>
  <div class="builder-topbar">
    <div class="topbar-left">
      <span>‹ Quản trị CMS</span>
      <span>|</span>
      <strong>Trạm Dừng Cảm Xúc • PK-03 Slot JourneySteps & StatsBar</strong>
      <span class="topbar-badge">ĐÃ XUẤT BẢN</span>
    </div>
    <div class="topbar-right">
      <span style="color:#FDE6F6; margin-right:8px;">Đường dẫn: <code>/lo-trinh</code></span>
      <button class="topbar-btn">Xem trang ↗</button>
      <button class="topbar-btn">Lưu nháp</button>
      <button class="topbar-btn topbar-btn-publish">Xuất bản</button>
    </div>
  </div>

  <div class="builder-body">
    <!-- Left Drawer -->
    <div class="builder-left">
      <div class="left-tabs">
        <div class="left-tab active">Thư viện khối</div>
        <div class="left-tab">Cấu trúc</div>
      </div>
      <div class="left-content">
        <div class="block-group-title">Mở đầu</div>
        <div class="block-item"><span>Hero 2 Lối vào</span><span>⠿</span></div>
        <div class="block-item"><span>Hero Ảnh biểu tượng</span><span>⠿</span></div>
        <div class="block-item"><span>Tiêu đề mục (Hai tầng màu)</span><span>⠿</span></div>

        <div class="block-group-title">Nội dung</div>
        <div class="block-item"><span>Thanh Số liệu ấn tượng (v3)</span><span>⠿</span></div>
        <div class="block-item" style="border-color:#BC039E; background:#FDE6F6; color:#280A60; font-weight:700;">
          <span>Hành trình các bước (v3)</span><span>⠿</span>
        </div>
        <div class="block-item"><span>Lưới Thẻ Biểu Tượng</span><span>⠿</span></div>
        <div class="block-item"><span>Khối Điểm Nhấn Nền Tối</span><span>⠿</span></div>
        <div class="block-item"><span>Đoạn văn bản (Rich Text)</span><span>⠿</span></div>
      </div>
    </div>

    <!-- Center Canvas Area -->
    <div class="builder-center">
      <div class="canvas-toolbar">
        <span>Kích thước: <strong>Máy tính (100%)</strong></span>
        <span>•</span>
        <span>Thu phóng: <strong>Tự động (65%)</strong></span>
      </div>

      <div class="canvas-scroll">
        <div class="canvas-frame">
          <!-- JourneySteps Section Preview -->
          <section class="py-10 px-6 bg-warm-ivory text-deep-navy">
            <div class="text-center mb-8">
              <span class="font-sans text-xs uppercase tracking-widest text-bright-magenta font-semibold">[MẪU] 5 BƯỚC THỰC HÀNH</span>
              <h2 class="font-heading text-3xl sm:text-4xl uppercase mt-2">
                <span class="text-deep-navy">HÀNH TRÌNH </span>
                <span class="text-bright-magenta">CHUYỂN HÓA BỀN BỈ</span>
              </h2>
              <p class="font-serif italic text-sm text-deep-navy/80 mt-1">Từ nhận diện cảm xúc đến hình thành phản xạ mới</p>
            </div>

            <!-- Steps Grid (5 columns) with step 2 highlighted and selected in builder -->
            <div class="grid grid-cols-5 gap-3 max-w-4xl mx-auto">
              <!-- Step 1 -->
              <div class="bg-white border border-soft-pink/50 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-heading text-base flex items-center justify-center mb-2">01</div>
                <div class="text-xs font-semibold text-deep-navy font-sans uppercase">Pause</div>
                <div class="text-[10px] text-bright-magenta font-semibold bg-soft-pink/60 px-1.5 py-0.5 rounded-full mt-1">Dừng lại</div>
                <p class="text-[11px] text-deep-navy/80 mt-2 line-clamp-3">Dừng mọi phản ứng tự động trong 5 giây</p>
              </div>

              <!-- Step 2 (SELECTED IN BUILDER & HIGHLIGHTED) -->
              <div class="selected-block bg-deep-navy text-white rounded-2xl p-4 text-center shadow-md flex flex-col items-center">
                <div class="selected-badge">
                  <span>Bước (Step v3) • Nổi bật</span>
                  <span style="opacity:0.7">⧉ 🗑</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-heading text-base flex items-center justify-center mb-2 font-bold">02</div>
                <div class="text-xs font-semibold text-soft-pink font-sans uppercase tracking-wide">Feel</div>
                <div class="text-[10px] text-bright-magenta font-semibold bg-white/90 px-1.5 py-0.5 rounded-full mt-1">Cảm nhận</div>
                <p class="text-[11px] text-white/90 mt-2 line-clamp-3">Lắng nghe tín hiệu từ cơ thể và nhịp thở</p>
              </div>

              <!-- Step 3 -->
              <div class="bg-white border border-soft-pink/50 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-heading text-base flex items-center justify-center mb-2">03</div>
                <div class="text-xs font-semibold text-deep-navy font-sans uppercase">Name</div>
                <div class="text-[10px] text-bright-magenta font-semibold bg-soft-pink/60 px-1.5 py-0.5 rounded-full mt-1">Gọi tên</div>
                <p class="text-[11px] text-deep-navy/80 mt-2 line-clamp-3">Nhận diện chính xác 10 cảm xúc cốt lõi</p>
              </div>

              <!-- Step 4 -->
              <div class="bg-white border border-soft-pink/50 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-heading text-base flex items-center justify-center mb-2">04</div>
                <div class="text-xs font-semibold text-deep-navy font-sans uppercase">Choose</div>
                <div class="text-[10px] text-bright-magenta font-semibold bg-soft-pink/60 px-1.5 py-0.5 rounded-full mt-1">Lựa chọn</div>
                <p class="text-[11px] text-deep-navy/80 mt-2 line-clamp-3">Chọn phản ứng phù hợp với giá trị sống</p>
              </div>

              <!-- Step 5 -->
              <div class="bg-white border border-soft-pink/50 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-heading text-base flex items-center justify-center mb-2">05</div>
                <div class="text-xs font-semibold text-deep-navy font-sans uppercase">Practice</div>
                <div class="text-[10px] text-bright-magenta font-semibold bg-soft-pink/60 px-1.5 py-0.5 rounded-full mt-1">Rèn luyện</div>
                <p class="text-[11px] text-deep-navy/80 mt-2 line-clamp-3">Lặp lại thói quen mỗi ngày với Habit Tracker</p>
              </div>
            </div>
          </section>

          <!-- StatsBar Section Preview below -->
          <section class="py-8 px-6 bg-soft-pink/30 border-t border-soft-pink">
            <div class="grid grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
              <div>
                <div class="font-heading text-3xl text-bright-magenta">10+</div>
                <div class="font-sans text-xs font-semibold text-deep-navy uppercase mt-1">Năm đồng hành</div>
              </div>
              <div>
                <div class="font-heading text-3xl text-deep-navy">500+</div>
                <div class="font-sans text-xs font-semibold text-deep-navy uppercase mt-1">Khách hàng chuyển hóa</div>
              </div>
              <div>
                <div class="font-heading text-3xl text-accent-pink">ICF ACC</div>
                <div class="font-sans text-xs font-semibold text-deep-navy uppercase mt-1">Chứng nhận quốc tế</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Right Sidebar (Inspector for Step) -->
    <div class="builder-right">
      <div class="inspector-header">
        <div class="inspector-breadcrumb">
          Trang › Hành trình các bước › <strong>Bước (Step)</strong>
        </div>
      </div>

      <div class="inspector-body">
        <div class="field-group">
          <label class="field-label">Tên bước (Name)</label>
          <input class="field-input" value="Feel" />
        </div>

        <div class="field-group">
          <label class="field-label">Nhãn bước / Badge (Subname)</label>
          <input class="field-input" value="Cảm nhận" />
        </div>

        <div class="field-group">
          <label class="field-label">Dòng phụ (Subtitle)</label>
          <input class="field-input" value="Lắng nghe cơ thể" placeholder="Không bắt buộc" />
        </div>

        <div class="field-group">
          <label class="field-label">Mô tả (Description)</label>
          <textarea class="field-textarea" rows="2">Lắng nghe tín hiệu từ cơ thể và nhịp thở</textarea>
        </div>

        <div class="toggle-row">
          <div>
            <div class="field-label">Bước nổi bật (Highlight)</div>
            <div class="field-hint">Áp dụng thẻ nền navy sẫm</div>
          </div>
          <div class="toggle-switch">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Màu tên bước (WCAG AA an toàn)</label>
          <select class="field-select">
            <option selected>Hồng phấn (Soft Pink) - Chuẩn tương phản</option>
            <option>Trắng (White)</option>
          </select>
          <span class="field-hint">Tự động lọc màu an toàn trên nền tối</span>
        </div>

        <div class="field-group">
          <label class="field-label">Cỡ tên bước</label>
          <select class="field-select">
            <option>Nhỏ (sm)</option>
            <option selected>Vừa (md)</option>
            <option>Lớn (lg)</option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">Màu mô tả</label>
          <select class="field-select">
            <option selected>Trắng (White)</option>
            <option>Hồng phấn (Soft Pink)</option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">Cỡ mô tả</label>
          <select class="field-select">
            <option>Nhỏ (sm)</option>
            <option selected>Vừa (md)</option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">Căn lề</label>
          <select class="field-select">
            <option selected>Giữa (Center)</option>
            <option>Trái (Left)</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

    const pageBuilder = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await pageBuilder.setContent(builderHtml, { waitUntil: 'load' })
    await pageBuilder.waitForTimeout(600)
    await pageBuilder.screenshot({
      path: path.join(outDir, '03-builder-step-inspector.png'),
    })
    console.log('  ✓ Saved 03-builder-step-inspector.png')
    await pageBuilder.close()
  } finally {
    await browser.close()
  }

  console.log(
    `\n🎉 Tất cả 4 ảnh chụp màn hình PK-03 đã được lưu thành công vào: docs/screenshots/pk03/`,
  )
}

main().catch((err) => {
  console.error('Error in capture-pk03-screenshots:', err)
  process.exit(1)
})
