import { contentCollection, number, select, text, textarea } from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const faqGroupOptions: [string, string][] = [
  ['general', 'Chung'],
  ['journey', 'Lộ trình'],
  ['coaching', 'Coaching 1:1'],
  ['digital', 'Sản phẩm số'],
  ['business', 'Doanh nghiệp'],
  ['payment', 'Thanh toán'],
]

// Shared FAQ entries: written once, picked by group on any page (home, journey, contact, FAQ page).
export const Faqs = contentCollection(
  'faqs',
  'Câu hỏi thường gặp',
  vi.cms.nav.website,
  'question',
  [
    text('question', 'Câu hỏi', true),
    {
      ...textarea('answer', 'Trả lời'),
      required: true,
      admin: { description: 'Viết câu trả lời. Xuống dòng sẽ được giữ nguyên trên web.' },
    },
    select('group', 'Nhóm', faqGroupOptions, {
      required: true,
      defaultValue: 'general',
      admin: {
        position: 'sidebar',
        description: 'Trang nào lấy câu hỏi theo nhóm này sẽ tự hiện câu hỏi.',
      },
    }),
    number('order', 'Thứ tự', 0, {
      admin: { position: 'sidebar', description: 'Số nhỏ hơn đứng trước.' },
    }),
  ],
)

Faqs.admin = {
  ...Faqs.admin,
  description:
    'Câu hỏi thường gặp dùng chung cho nhiều trang. Sửa ở đây, mọi trang dùng câu hỏi này tự cập nhật.',
  defaultColumns: ['question', 'group', 'order', '_status', 'updatedAt'],
  listSearchableFields: ['question', 'answer'],
}
Faqs.defaultSort = 'order'
