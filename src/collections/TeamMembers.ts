import { checkbox, contentCollection, image, number, text, textarea } from '../fields/content'
import { vi } from '../lib/i18n/vi'
import { requireConsentFor } from './Testimonials'

// REVIEW-REQUIRED: real people's names and photos. Public reads only published members, and a
// member can only be published once `consent` is ticked (same rule as testimonials).
export const TeamMembers = {
  ...contentCollection('teamMembers', 'Đội ngũ', vi.cms.nav.website, 'name', [
    text('name', 'Họ tên', true),
    text('role', 'Vai trò', false, { admin: { description: 'VD: Executive Coach.' } }),
    text('specialty', 'Chuyên môn', false, {
      admin: { description: 'VD: Chuyên gia khai vấn lãnh đạo.' },
    }),
    textarea('bio', 'Giới thiệu ngắn', {
      maxLength: 400,
      admin: { description: 'Tối đa 400 ký tự.' },
    }),
    image('photo', 'Ảnh chân dung', {
      admin: { description: 'Ảnh thật của người này, cần có mô tả ảnh.' },
    }),
    number('order', 'Thứ tự', 0, {
      admin: { position: 'sidebar', description: 'Số nhỏ hơn đứng trước.' },
    }),
    {
      ...checkbox('consent', 'Người này đã đồng ý hiện tên, ảnh trên web'),
      admin: {
        position: 'sidebar',
        description: 'Bắt buộc bật trước khi xuất bản.',
      },
    },
  ]),
  hooks: {
    beforeChange: [requireConsentFor('Cần có sự đồng ý của người này trước khi xuất bản lên web.')],
  },
}

TeamMembers.admin = {
  ...TeamMembers.admin,
  description: 'Thành viên đội ngũ hiện ở trang Về Trạm. Chỉ thêm người thật đã đồng ý.',
  defaultColumns: ['name', 'role', 'consent', '_status', 'updatedAt'],
  listSearchableFields: ['name', 'role'],
}
TeamMembers.defaultSort = 'order'
