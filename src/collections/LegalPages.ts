import { contentCollection, date, number, richText, slug, text } from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const LegalPages = contentCollection(
  'legalPages',
  'Trang pháp lý',
  vi.cms.nav.website,
  'title',
  [
    text('title', 'Tiêu đề', true),
    slug(),
    richText('content', 'Nội dung'),
    date('lastUpdated', 'Ngày cập nhật nội dung'),
    number('order', 'Thứ tự', 0),
  ],
)
