// scripts/dp02d-step-quotes-report.ts
// DP-02d: Script chỉ đọc so sánh câu trích dẫn trong CMS stepQuotes với câu zip nguyên văn.
// Chạy: pnpm payload run scripts/dp02d-step-quotes-report.ts

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

export const ZIP_STEP_QUOTES = {
  step2: {
    key: 'onePercent',
    stepName: 'Bước 2 (Nguyên lý 1%)',
    quote: '“Thay đổi thói quen thực ra là thay đổi tư duy.”',
    author: '— Robert Kiyosaki, Cha giàu Cha nghèo —',
  },
  step3: {
    key: 'mentor',
    stepName: 'Bước 3 (Tìm Mentor)',
    quote: '“Môi trường là bàn tay vô hình định hình hành vi của con người.”',
    author: '— James Clear, Atomic Habits —',
  },
  step4: {
    key: 'name',
    stepName: 'Bước 4 (Gọi tên thói quen)',
    quote: '“Mỗi hành động bạn thực hiện là một lá phiếu cho con người mà bạn muốn trở thành.”',
    author: '— James Clear, Atomic Habits —',
  },
  step5: {
    key: 'loop',
    stepName: 'Bước 5 (Thiết kế vòng lặp)',
    quote: '“Bạn không vươn tới tầm mục tiêu của mình. Bạn rơi xuống mức các hệ thống của bạn.”',
    author: '— James Clear, Atomic Habits —',
  },
  step6: {
    key: 'boardingPass',
    stepName: 'Bước 6 (Habit Boarding Pass)',
    quote: '“Chúng ta là kết quả của những hành động chúng ta lặp lại mỗi ngày.”',
    author: '— Aristotle —',
  },
} as const

async function run() {
  const payload = await getPayload({ config })
  const content = await payload.findGlobal({
    slug: 'habitJourneyContent',
    overrideAccess: true,
  })

  console.log('======================================================================')
  console.log('📊 BÁO CÁO SO SÁNH CÂU TRÍCH DẪN CMS (stepQuotes) VÀ BẢN ZIP (DP-02d)')
  console.log('======================================================================\n')

  const cmsStepQuotes = content?.stepQuotes as Record<string, any> | undefined

  for (const [stepKey, zip] of Object.entries(ZIP_STEP_QUOTES)) {
    const cmsItem = cmsStepQuotes?.[zip.key]
    console.log(`--- ${zip.stepName} [stepQuotes.${zip.key}] ---`)
    console.log(`[ZIP nguyên văn]`)
    console.log(`  Câu trích: ${zip.quote}`)
    console.log(`  Tác giả:   ${zip.author}`)

    console.log(`[CMS hiện tại]`)
    if (cmsItem && (cmsItem.text || cmsItem.author || cmsItem.source)) {
      console.log(`  Câu trích: ${cmsItem.text ? `"${cmsItem.text}"` : '(trống)'}`)
      console.log(`  Tác giả:   ${cmsItem.author || '(trống)'}`)
      console.log(`  Nguồn:     ${cmsItem.source || '(trống)'}`)
      if (cmsItem.sourceUrl) {
        console.log(`  Link:      ${cmsItem.sourceUrl}`)
      }
    } else {
      console.log(`  (Chưa có dữ liệu trong CMS)`)
    }
    console.log('')
  }

  // Bổ sung kiểm tra tracker
  console.log('--- Tracker 28 ngày [stepQuotes.tracker] ---')
  const cmsTracker = cmsStepQuotes?.tracker
  if (cmsTracker && (cmsTracker.text || cmsTracker.author || cmsTracker.source)) {
    console.log(`  Câu trích: ${cmsTracker.text ? `"${cmsTracker.text}"` : '(trống)'}`)
    console.log(`  Tác giả:   ${cmsTracker.author || '(trống)'}`)
    console.log(`  Nguồn:     ${cmsTracker.source || '(trống)'}`)
  } else {
    console.log(`  (Chưa có dữ liệu trong CMS)`)
  }

  console.log('\n======================================================================')
  console.log('KẾT THÚC BÁO CÁO')
  console.log('======================================================================')
  process.exit(0)
}

run().catch((err) => {
  console.error('Lỗi khi chạy script:', err)
  process.exit(1)
})
