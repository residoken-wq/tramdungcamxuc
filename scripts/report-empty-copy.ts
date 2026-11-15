/**
 * BX-05: Script kiểm tra ô nội dung để trống trước khi deploy (chỉ đọc).
 *
 * Chạy cục bộ:
 *   pnpm report:empty-copy
 *   hoặc: node --import tsx scripts/report-empty-copy.ts
 *
 * Chạy trên Docker (server):
 *   docker compose exec app node --import tsx scripts/report-empty-copy.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

interface ReportRow {
  source: string
  group: string
  emptyFields: string[]
  status: string
}

function hasText(val: unknown): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (Array.isArray(val)) return val.length > 0
  return true
}

async function run() {
  console.log('======================================================================')
  console.log('📋 BÁO CÁO CÁC Ô CMS ĐỂ TRỐNG (BX-05: Ô để trống thì ẩn)')
  console.log('======================================================================\n')

  const payload = await getPayload({ config })
  const report: ReportRow[] = []

  // 1. SẢN PHẨM (Products)
  const productsRes = await payload.find({
    collection: 'products',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  for (const prod of productsRes.docs as any[]) {
    const prodName = prod.name || `Sản phẩm #${prod.id}`

    // Hero
    const heroEmpty: string[] = []
    if (!hasText(prod.offerSeriesLabel)) heroEmpty.push('offerSeriesLabel')
    if (!hasText(prod.offerTitleLine1)) heroEmpty.push('offerTitleLine1')
    if (!hasText(prod.offerTitleLine2)) heroEmpty.push('offerTitleLine2')
    if (!hasText(prod.offerEmotionLine)) heroEmpty.push('offerEmotionLine')
    if (heroEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Hero giới thiệu',
        emptyFields: heroEmpty,
        status: prod.useDefaultCopyHero ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Includes
    const includesEmpty: string[] = []
    if (!hasText(prod.shortDescription)) includesEmpty.push('shortDescription')
    if (!hasText(prod.includes)) includesEmpty.push('includes')
    if (includesEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Danh sách tài liệu',
        emptyFields: includesEmpty,
        status: prod.useDefaultCopyIncludes ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Stats
    const statsEmpty: string[] = []
    if (!hasText(prod.curriculumUnitLabel)) statsEmpty.push('curriculumUnitLabel')
    if (statsEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Thanh số liệu',
        emptyFields: statsEmpty,
        status: prod.useDefaultCopyStats ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Curriculum
    const currEmpty: string[] = []
    if (!hasText(prod.curriculumHeading)) currEmpty.push('curriculumHeading')
    if (!hasText(prod.curriculumSubheading)) currEmpty.push('curriculumSubheading')
    if (!hasText(prod.curriculumModules)) currEmpty.push('curriculumModules')
    if (currEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Lộ trình bài học',
        emptyFields: currEmpty,
        status: prod.useDefaultCopyCurriculum ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Features
    const featEmpty: string[] = []
    if (!hasText(prod.featuresHeading)) featEmpty.push('featuresHeading')
    if (!hasText(prod.featuresSubheading)) featEmpty.push('featuresSubheading')
    if (!hasText(prod.featureItems)) featEmpty.push('featureItems')
    if (featEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Điểm khác biệt',
        emptyFields: featEmpty,
        status: prod.useDefaultCopyFeatures ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // FAQ
    const faqEmpty: string[] = []
    if (!hasText(prod.faq)) faqEmpty.push('faq')
    if (faqEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Câu hỏi thường gặp',
        emptyFields: faqEmpty,
        status: prod.useDefaultCopyFaq ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Bottom
    const bottomEmpty: string[] = []
    if (!hasText(prod.bottomTitle)) bottomEmpty.push('bottomTitle')
    if (!hasText(prod.bottomDescription)) bottomEmpty.push('bottomDescription')
    if (bottomEmpty.length > 0) {
      report.push({
        source: `Sản phẩm: ${prodName}`,
        group: 'Khối chốt cuối trang',
        emptyFields: bottomEmpty,
        status: prod.useDefaultCopyBottom ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }
  }

  // 2. GLOBAL: EQ BUDDY (eqBuddyContent)
  try {
    const eqRes = await payload.findGlobal({
      slug: 'eqBuddyContent',
      overrideAccess: true,
    })
    const eq = eqRes as any

    // Intro
    const eqIntroEmpty: string[] = []
    if (!hasText(eq.tagline)) eqIntroEmpty.push('tagline')
    if (!hasText(eq.quoteTop)) eqIntroEmpty.push('quoteTop')
    if (!hasText(eq.badge)) eqIntroEmpty.push('badge')
    if (!hasText(eq.mainTitle)) eqIntroEmpty.push('mainTitle')
    if (!hasText(eq.subtitle)) eqIntroEmpty.push('subtitle')
    if (eqIntroEmpty.length > 0) {
      report.push({
        source: 'Global: EQ Buddy',
        group: 'Giao diện chung / Intro',
        emptyFields: eqIntroEmpty,
        status: eq.useDefaultCopyIntro ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Intro1
    const eqIntro1Empty: string[] = []
    if (!hasText(eq.intro1Heading)) eqIntro1Empty.push('intro1Heading')
    if (!hasText(eq.intro1Description)) eqIntro1Empty.push('intro1Description')
    if (eqIntro1Empty.length > 0) {
      report.push({
        source: 'Global: EQ Buddy',
        group: 'Bộ thẻ là gì',
        emptyFields: eqIntro1Empty,
        status: eq.useDefaultCopyIntro1 ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // Guide
    const eqGuideEmpty: string[] = []
    if (!hasText(eq.intro2Heading)) eqGuideEmpty.push('intro2Heading')
    if (!hasText(eq.intro2Description)) eqGuideEmpty.push('intro2Description')
    if (!hasText(eq.guideModalTitle)) eqGuideEmpty.push('guideModalTitle')
    if (!hasText(eq.guideModalQuote)) eqGuideEmpty.push('guideModalQuote')
    if (eqGuideEmpty.length > 0) {
      report.push({
        source: 'Global: EQ Buddy',
        group: 'Hướng dẫn 3 bước & Modal',
        emptyFields: eqGuideEmpty,
        status: eq.useDefaultCopyGuide ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // StateIcons
    const eqIconsEmpty: string[] = []
    if (!hasText(eq.stateIcon1Label)) eqIconsEmpty.push('stateIcon1Label')
    if (!hasText(eq.stateIcon2Label)) eqIconsEmpty.push('stateIcon2Label')
    if (!hasText(eq.stateIcon3Label)) eqIconsEmpty.push('stateIcon3Label')
    if (eqIconsEmpty.length > 0) {
      report.push({
        source: 'Global: EQ Buddy',
        group: '3 Biểu tượng bước nhập',
        emptyFields: eqIconsEmpty,
        status: eq.useDefaultCopyStateIcons ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    // CardBack
    const eqCardBackEmpty: string[] = []
    if (!hasText(eq.cardBackPromptTitle)) eqCardBackEmpty.push('cardBackPromptTitle')
    if (!hasText(eq.cardBackQuote)) eqCardBackEmpty.push('cardBackQuote')
    if (eqCardBackEmpty.length > 0) {
      report.push({
        source: 'Global: EQ Buddy',
        group: 'Mặt sau thẻ',
        emptyFields: eqCardBackEmpty,
        status: eq.useDefaultCopyCardBack ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }
  } catch (err) {
    console.warn('Không thể đọc eq_buddy_content:', err)
  }

  // 3. GLOBAL: HABIT JOURNEY (habitJourneyContent)
  try {
    const hbRes = await payload.findGlobal({
      slug: 'habitJourneyContent',
      overrideAccess: true,
    })
    const hb = hbRes as any

    const hbHeaderEmpty: string[] = []
    if (!hasText(hb.headerTitleLine1)) hbHeaderEmpty.push('headerTitleLine1')
    if (!hasText(hb.headerTitleLine2)) hbHeaderEmpty.push('headerTitleLine2')
    if (!hasText(hb.headerTagline)) hbHeaderEmpty.push('headerTagline')
    if (hbHeaderEmpty.length > 0) {
      report.push({
        source: 'Global: Habit Journey',
        group: 'Header đầu trang',
        emptyFields: hbHeaderEmpty,
        status: hb.useDefaultCopyHeader ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    const hbStep1Empty: string[] = []
    if (!hasText(hb.step1LeadIn)) hbStep1Empty.push('step1LeadIn')
    if (hbStep1Empty.length > 0) {
      report.push({
        source: 'Global: Habit Journey',
        group: 'Bước 1: Khám thói quen',
        emptyFields: hbStep1Empty,
        status: hb.useDefaultCopyStep1 ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }

    const hbFooterEmpty: string[] = []
    if (!hasText(hb.footerSlogan)) hbFooterEmpty.push('footerSlogan')
    if (!hasText(hb.footerAuthorInfo)) hbFooterEmpty.push('footerAuthorInfo')
    if (!hasText(hb.footerBookCredits)) hbFooterEmpty.push('footerBookCredits')
    if (hbFooterEmpty.length > 0) {
      report.push({
        source: 'Global: Habit Journey',
        group: 'Chân trang',
        emptyFields: hbFooterEmpty,
        status: hb.useDefaultCopyFooter ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
      })
    }
  } catch (err) {
    console.warn('Không thể đọc habit_journey_content:', err)
  }

  // 4. TRANG PUCK (Pages)
  try {
    const pagesRes = await payload.find({
      collection: 'pages',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    for (const page of pagesRes.docs as any[]) {
      const pageTitle = page.title || page.slug || `Trang #${page.id}`
      const puckData = page.puckData
      if (!puckData || !Array.isArray(puckData.content)) continue

      for (let i = 0; i < puckData.content.length; i++) {
        const block = puckData.content[i]
        const type = block?.type || 'UnknownBlock'
        const props = block?.props || {}

        const blockEmpty: string[] = []
        if (type === 'HeroTwoEntries') {
          if (!hasText(props.titleLine1)) blockEmpty.push('titleLine1')
          if (!hasText(props.titleLine2)) blockEmpty.push('titleLine2')
          if (!hasText(props.seriesLabel)) blockEmpty.push('seriesLabel')
          if (!hasText(props.emotionLine)) blockEmpty.push('emotionLine')
        } else if (type === 'FAQ') {
          if (!hasText(props.titleLine1)) blockEmpty.push('titleLine1')
          if (!hasText(props.titleLine2)) blockEmpty.push('titleLine2')
          if (!hasText(props.items)) blockEmpty.push('items')
        } else if (type === 'SolutionEcosystem') {
          if (!hasText(props.titleLine1)) blockEmpty.push('titleLine1')
          if (!hasText(props.col1Title)) blockEmpty.push('col1Title')
        } else if (type === 'QuoteBlock') {
          if (!hasText(props.quote)) blockEmpty.push('quote')
        } else if (type === 'Callout') {
          if (!hasText(props.title)) blockEmpty.push('title')
          if (!hasText(props.description)) blockEmpty.push('description')
        }

        if (blockEmpty.length > 0) {
          report.push({
            source: `Trang: ${pageTitle} (/${page.slug})`,
            group: `Khối #${i + 1}: ${type}`,
            emptyFields: blockEmpty,
            status: props.useDefaultCopy ? 'Hiện chữ mặc định (Bật)' : 'Sẽ ẩn khi deploy (Tắt)',
          })
        }
      }
    }
  } catch (err) {
    console.warn('Không thể đọc pages:', err)
  }

  // IN BẢNG BÁO CÁO
  if (report.length === 0) {
    console.log('✅ Tuyệt vời! Không phát hiện ô nội dung nào để trống trong hệ thống.\n')
  } else {
    console.table(
      report.map((r) => ({
        'Nguồn / Trang': r.source,
        'Nhóm / Phần': r.group,
        'Các ô để trống': r.emptyFields.join(', '),
        'Trạng thái': r.status,
      })),
    )
    console.log(`\nTổng cộng: ${report.length} mục có ô để trống.`)
    console.log('💡 Ghi chú: Để hiện chữ mặc định của hệ thống cho ô trống nào, vui lòng tick chọn')
    console.log('   "Dùng chữ mặc định cho ô để trống" ở nhóm tương ứng trong CMS.\n')
  }

  process.exit(0)
}

run().catch((err) => {
  console.error('Lỗi khi chạy report-empty-copy:', err)
  process.exit(1)
})
