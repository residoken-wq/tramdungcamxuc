/**
 * BX-05: báo trước những phần sẽ ẨN sau khi deploy BX-05 (ô CMS để trống thì không hiện gì).
 * CHỈ ĐỌC – không ghi gì vào DB. Không in dữ liệu cá nhân (chỉ tên trang / phần / ô).
 *
 * Chạy được cả TRƯỚC khi migration BX-05 tạo cột `use_default_copy_*` (đúng lúc cần chạy trên
 * server): chỉ đọc các ô chữ cần kiểm, còn cờ "Dùng chữ mặc định" chỉ đọc khi cột đã có
 * – chưa có cột thì coi là TẮT, đúng như ngay sau khi deploy.
 *
 * Máy dev:  pnpm report:empty-copy
 * Server:   xem docs/RUNBOOK.md mục "Trước khi deploy BX-05" (chạy bằng image tools).
 */

import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '../src/payload.config'

interface ReportRow {
  source: string
  group: string
  emptyFields: string[]
  status: string
}

interface Section {
  group: string
  /** Field paths read from the doc (dot = group, e.g. `header.titleLine1`). */
  fields: string[]
  /** Field path of the "Dùng chữ mặc định" checkbox. */
  flag: string
  /** DB column of that checkbox – only read when it already exists. */
  flagColumn: string
}

const STATUS_ON = 'Hiện chữ mặc định (Bật)'
const STATUS_OFF = 'Sẽ ẩn khi deploy (Tắt)'

export function hasText(val: unknown): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (Array.isArray(val)) return val.length > 0
  return true
}

const getPath = (doc: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      doc,
    )

/** Payload `select` object for dotted paths: ['a', 'g.b'] -> { a: true, g: { b: true } }. */
function selectFor(paths: string[]): Record<string, unknown> {
  const select: Record<string, unknown> = {}
  for (const path of paths) {
    const keys = path.split('.')
    let node = select
    keys.forEach((key, i) => {
      if (i === keys.length - 1) node[key] = true
      else node = (node[key] ??= {}) as Record<string, unknown>
    })
  }
  return select
}

async function existingColumns(payload: Payload, table: string): Promise<Set<string>> {
  const db = payload.db as unknown as {
    drizzle: { execute: (q: unknown) => Promise<{ rows: Array<{ column_name: string }> }> }
  }
  const res = await db.drizzle.execute(
    sql`select column_name from information_schema.columns where table_name = ${table}`,
  )
  return new Set(res.rows.map((r) => r.column_name))
}

function checkSections(
  report: ReportRow[],
  source: string,
  doc: unknown,
  sections: Section[],
  columns: Set<string>,
) {
  for (const section of sections) {
    const empty = section.fields.filter((f) => !hasText(getPath(doc, f)))
    if (empty.length === 0) continue
    const on = columns.has(section.flagColumn) && getPath(doc, section.flag) === true
    report.push({
      source,
      group: section.group,
      emptyFields: empty,
      status: on ? STATUS_ON : STATUS_OFF,
    })
  }
}

// ---------- Nguồn 1: Sản phẩm – tab "Trang giới thiệu" ----------
const PRODUCT_SECTIONS: Section[] = [
  {
    group: 'Hero giới thiệu',
    fields: ['offerSeriesLabel', 'offerTitleLine1', 'offerTitleLine2', 'offerEmotionLine'],
    flag: 'useDefaultCopyHero',
    flagColumn: 'use_default_copy_hero',
  },
  {
    group: 'Danh sách ✓ (Bộ tài liệu)',
    fields: ['shortDescription', 'includes'],
    flag: 'useDefaultCopyIncludes',
    flagColumn: 'use_default_copy_includes',
  },
  {
    group: 'Thanh số liệu',
    fields: ['curriculumUnitLabel'],
    flag: 'useDefaultCopyStats',
    flagColumn: 'use_default_copy_stats',
  },
  {
    group: 'Lộ trình',
    fields: ['curriculumHeading', 'curriculumSubheading', 'curriculumModules'],
    flag: 'useDefaultCopyCurriculum',
    flagColumn: 'use_default_copy_curriculum',
  },
  {
    group: 'Khác biệt',
    fields: ['featuresHeading', 'featuresSubheading', 'featureItems'],
    flag: 'useDefaultCopyFeatures',
    flagColumn: 'use_default_copy_features',
  },
  {
    group: 'Câu hỏi thường gặp',
    fields: ['faq'],
    flag: 'useDefaultCopyFaq',
    flagColumn: 'use_default_copy_faq',
  },
  {
    group: 'Khối chốt cuối trang',
    fields: ['bottomTitle', 'bottomDescription'],
    flag: 'useDefaultCopyBottom',
    flagColumn: 'use_default_copy_bottom',
  },
]

// ---------- Nguồn 2: Global "Nội dung EQ Buddy" (ô phẳng) ----------
const EQ_SECTIONS: Section[] = [
  {
    group: 'Giao diện chung / Intro',
    fields: ['tagline', 'quoteTop', 'badge', 'mainTitle', 'subtitle'],
    flag: 'useDefaultCopyIntro',
    flagColumn: 'use_default_copy_intro',
  },
  {
    group: 'Bộ thẻ là gì',
    fields: ['intro1Heading', 'intro1Description'],
    flag: 'useDefaultCopyIntro1',
    flagColumn: 'use_default_copy_intro1',
  },
  {
    group: 'Hướng dẫn 3 bước',
    fields: ['intro2Heading', 'intro2Description', 'guideModalTitle', 'guideModalQuote'],
    flag: 'useDefaultCopyGuide',
    flagColumn: 'use_default_copy_guide',
  },
  {
    group: 'Bước nhập (3 biểu tượng)',
    fields: ['stateIcon1Label', 'stateIcon2Label', 'stateIcon3Label'],
    flag: 'useDefaultCopyStateIcons',
    flagColumn: 'use_default_copy_state_icons',
  },
  {
    group: 'Mặt sau thẻ',
    fields: ['cardBackPromptTitle', 'cardBackQuote'],
    flag: 'useDefaultCopyCardBack',
    flagColumn: 'use_default_copy_card_back',
  },
]

// ---------- Nguồn 3: Global "Nội dung Habit" (ô nằm trong nhóm) ----------
const HABIT_SECTIONS: Section[] = [
  {
    group: 'Header đầu trang',
    fields: ['header.titleLine1', 'header.titleLine2', 'header.tagline'],
    flag: 'header.useDefaultCopyHeader',
    flagColumn: 'header_use_default_copy_header',
  },
  {
    group: 'Bước 1: Khám thói quen',
    fields: ['step1.leadIn'],
    flag: 'step1.useDefaultCopyStep1',
    flagColumn: 'step1_use_default_copy_step1',
  },
  {
    group: 'Chân trang',
    fields: ['footer.slogan', 'footer.authorInfo', 'footer.bookCredits'],
    flag: 'footer.useDefaultCopyFooter',
    flagColumn: 'footer_use_default_copy_footer',
  },
]

// ---------- Nguồn 4: Khối Puck có ô "Dùng chữ mặc định" ----------
export const PUCK_BLOCK_FIELDS: Record<string, string[]> = {
  HeroTwoEntries: ['seriesLabel', 'titleLine1', 'titleLine2', 'emotionLine', 'description'],
  HeroImage: ['seriesLabel', 'titleLine1', 'titleLine2', 'buttonText', 'secondaryButtonText'],
  HanaStory: ['seriesLabel', 'titleLine1', 'titleLine2', 'buttonText'],
  FAQ: [
    'seriesLabel',
    'titleLine1',
    'titleLine2',
    'description',
    'bookingAsideTitle',
    'bookingAsideDescription',
  ],
  SolutionEcosystem: [
    'seriesLabel',
    'titleLine1',
    'titleLine2',
    'description',
    'col1Title',
    'col1Description',
    'col2Title',
    'col2Description',
    'col3Title',
    'col3Description',
  ],
  QuoteBlock: ['quote', 'cite', 'roleOrContext'],
  Callout: ['title', 'description', 'buttonText'],
}

interface PuckBlock {
  type?: string
  props?: Record<string, unknown>
}

/** Every block of a page, including blocks nested in slots (Columns, Container…) and zones. */
export function collectPuckBlocks(puckData: unknown): PuckBlock[] {
  const out: PuckBlock[] = []
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (typeof obj.type === 'string' && obj.props && typeof obj.props === 'object') {
      out.push(obj as PuckBlock)
    }
    Object.values(obj).forEach(visit)
  }
  const data = (puckData ?? {}) as { content?: unknown; zones?: unknown }
  visit(data.content)
  visit(data.zones)
  return out
}

export function checkPuckPage(report: ReportRow[], source: string, puckData: unknown) {
  collectPuckBlocks(puckData).forEach((block, i) => {
    const fields = block.type ? PUCK_BLOCK_FIELDS[block.type] : undefined
    if (!fields) return
    const props = block.props ?? {}
    const empty = fields.filter((f) => !hasText(props[f]))
    if (empty.length === 0) return
    report.push({
      source,
      group: `Khối ${i + 1}: ${block.type}`,
      emptyFields: empty,
      status: props.useDefaultCopy === true ? STATUS_ON : STATUS_OFF,
    })
  })
}

async function run() {
  console.log('======================================================================')
  console.log('📋 BÁO CÁO CÁC Ô CMS ĐỂ TRỐNG (BX-05: Ô để trống thì ẩn) – chỉ đọc')
  console.log('======================================================================\n')

  const payload = await getPayload({ config })
  const report: ReportRow[] = []

  // 1. Sản phẩm: trang giới thiệu chỉ dùng cho công cụ số
  const productColumns = await existingColumns(payload, 'products')
  const productFlags = PRODUCT_SECTIONS.filter((s) => productColumns.has(s.flagColumn)).map(
    (s) => s.flag,
  )
  const products = await payload.find({
    collection: 'products',
    where: { type: { equals: 'digital_tool' } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
    select: selectFor([
      'name',
      ...PRODUCT_SECTIONS.flatMap((s) => s.fields),
      ...productFlags,
    ]) as never,
  })
  for (const prod of products.docs as unknown as Array<{ id: number; name?: string }>) {
    checkSections(
      report,
      `Sản phẩm: ${prod.name || `#${prod.id}`}`,
      prod,
      PRODUCT_SECTIONS,
      productColumns,
    )
  }

  // 2. Global "Nội dung EQ Buddy"
  const eqColumns = await existingColumns(payload, 'eq_buddy_content')
  const eqFlags = EQ_SECTIONS.filter((s) => eqColumns.has(s.flagColumn)).map((s) => s.flag)
  const eq = await payload.findGlobal({
    slug: 'eqBuddyContent',
    depth: 0,
    overrideAccess: true,
    select: selectFor([...EQ_SECTIONS.flatMap((s) => s.fields), ...eqFlags]) as never,
  })
  checkSections(report, 'Nội dung EQ Buddy', eq, EQ_SECTIONS, eqColumns)

  // 3. Global "Nội dung Habit"
  const hbColumns = await existingColumns(payload, 'habit_journey_content')
  const hbFlags = HABIT_SECTIONS.filter((s) => hbColumns.has(s.flagColumn)).map((s) => s.flag)
  const hb = await payload.findGlobal({
    slug: 'habitJourneyContent',
    depth: 0,
    overrideAccess: true,
    select: selectFor([...HABIT_SECTIONS.flatMap((s) => s.fields), ...hbFlags]) as never,
  })
  checkSections(report, 'Nội dung Habit', hb, HABIT_SECTIONS, hbColumns)

  // 4. Trang dựng bằng builder (bản đang xuất bản; Puck JSON không có cột mới)
  const pages = await payload.find({
    collection: 'pages',
    limit: 500,
    depth: 0,
    overrideAccess: true,
    select: { title: true, slug: true, puckData: true } as never,
  })
  for (const page of pages.docs as unknown as Array<{
    id: number
    title?: string
    slug?: string
    puckData?: unknown
  }>) {
    checkPuckPage(
      report,
      `Trang: ${page.title || `#${page.id}`} (${page.slug || ''})`,
      page.puckData,
    )
  }

  if (report.length === 0) {
    console.log('✅ Không có phần nào sẽ bị ẩn sau deploy.\n')
  } else {
    console.table(
      report.map((r) => ({
        'Nguồn / Trang': r.source,
        'Nhóm / Phần': r.group,
        'Các ô để trống': r.emptyFields.join(', '),
        'Trạng thái': r.status,
      })),
    )
    const willHide = report.filter((r) => r.status === STATUS_OFF).length
    console.log(
      `\nTổng cộng: ${report.length} mục có ô để trống, ${willHide} mục sẽ ẩn sau deploy.`,
    )
    console.log(
      '💡 Muốn giữ chữ mặc định ở phần nào: sau deploy bật "Dùng chữ mặc định cho ô để trống"',
    )
    console.log('   ở đúng phần đó trong CMS / builder, hoặc điền chữ thật vào ô.\n')
  }
}

const isDirectRun = process.argv[1]?.includes('report-empty-copy')
if (isDirectRun) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Lỗi khi chạy report-empty-copy:', err)
      process.exit(1)
    })
}
