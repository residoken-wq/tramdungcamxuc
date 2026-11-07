/**
 * Import the legal texts in `content/legal/<slug>.md` into the `legalPages` collection.
 *
 * - Dry run (default): shows what would change, writes nothing.
 * - APPLY=true: saves the text as a **draft** (the published page does not change). The owner
 *   reviews it in the CMS, fills the "[CẦN BỔ SUNG]" placeholders and publishes.
 * - A page that already has content is skipped unless FORCE=true.
 *
 *   pnpm payload run scripts/legal-content-import.ts < /dev/null
 *   APPLY=true pnpm payload run scripts/legal-content-import.ts < /dev/null
 *
 * The texts are supplied by Hana; this script never edits their wording.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  convertMarkdownToLexical,
  editorConfigFactory,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'
import { isRichTextEmpty } from '../src/lib/legal'
import { legalMarkdownBody } from '../src/lib/legal-markdown'

const SLUGS = ['chinh-sach-bao-mat', 'dieu-khoan-su-dung'] as const
const isApply = process.env.APPLY === 'true'
const isForce = process.env.FORCE === 'true'

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.fromFeatures({
  config: payload.config,
  features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
})

console.log(isApply ? '🚀 APPLY – ghi bản nháp' : '🔍 Chạy thử – không ghi gì')

for (const slug of SLUGS) {
  const file = path.resolve(process.cwd(), 'content/legal', `${slug}.md`)
  if (!fs.existsSync(file)) {
    console.log(`⚠️  Không thấy ${file}`)
    continue
  }
  const { title, body } = legalMarkdownBody(fs.readFileSync(file, 'utf8'))
  const content = convertMarkdownToLexical({ editorConfig, markdown: body })

  const found = await payload.find({
    collection: 'legalPages',
    where: { slug: { equals: slug } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  const doc = found.docs[0]
  if (!doc) {
    console.log(`⚠️  Chưa có trang /${slug} trong CMS (chạy seed trước). Bỏ qua.`)
    continue
  }
  const hasContent = !isRichTextEmpty(doc.content)
  const placeholders = (body.match(/\[(?:[^\]]*(?:CẦN|ĐIỀN|TÊN PHÁP LÝ|EMAIL)[^\]]*)\]/g) || [])
    .length
  console.log(
    `- /${slug} (ID ${doc.id}): tiêu đề file "${title}", ${placeholders} chỗ cần bổ sung, ` +
      (hasContent ? 'CMS đã có nội dung' : 'CMS đang trống'),
  )

  if (hasContent && !isForce) {
    console.log('  ⏭  Giữ nguyên nội dung đang có (FORCE=true để ghi đè bản nháp).')
    continue
  }
  if (!isApply) continue

  await payload.update({
    collection: 'legalPages',
    id: doc.id,
    draft: true,
    data: { content: content as never },
  })
  console.log('  ✅ Đã lưu bản nháp. Vào CMS → Trang pháp lý để xem trước, bổ sung và xuất bản.')
}

process.exit(0)
