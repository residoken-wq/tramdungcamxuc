import { contentCollection, date, number, richText, slug, text } from '../fields/content'

export const LegalPages = contentCollection('legalPages', 'Trang pháp lý', 'Hệ thống', 'title', [
  text('title', 'Tiêu đề', true),
  slug(),
  richText('content', 'Nội dung'),
  date('lastUpdated', 'Ngày cập nhật nội dung'),
  number('order', 'Thứ tự', 0),
])
