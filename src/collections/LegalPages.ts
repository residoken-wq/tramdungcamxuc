import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { contentCollection, date, number, richText, slug, text } from '../fields/content'
import { vi } from '../lib/i18n/vi'
import { collectionLivePreview } from '../lib/live-preview'

export const LegalPages = contentCollection(
  'legalPages',
  'Trang pháp lý',
  vi.cms.nav.website,
  'title',
  [
    text('title', 'Tiêu đề', true),
    slug(),
    // Legal texts carry tables (e.g. purposes ↔ data in the privacy policy).
    richText('content', 'Nội dung', {
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
      }),
    }),
    date('lastUpdated', 'Ngày cập nhật nội dung'),
    number('order', 'Thứ tự', 0),
  ],
)

LegalPages.admin = {
  ...LegalPages.admin,
  description: 'Trang điều khoản sử dụng, chính sách bảo mật và quy định pháp lý.',
  defaultColumns: ['title', 'slug', 'lastUpdated', 'updatedAt'],
  listSearchableFields: ['title', 'slug'],
  livePreview: collectionLivePreview('legalPages'),
}
