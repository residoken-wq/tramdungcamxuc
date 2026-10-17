import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import {
  checkbox,
  contentCollection,
  image,
  number,
  relation,
  select,
  text,
  textarea,
} from '../fields/content'
import { vi } from '../lib/i18n/vi'
import { collectionLivePreview } from '../lib/live-preview'

// Blocks publishing until `consent` is ticked. Shared by collections that show real people.
export function requireConsentFor(message: string): CollectionBeforeChangeHook {
  return ({ data, originalDoc, req }) => {
    const next = { ...originalDoc, ...data }
    if (next._status === 'published' && next.consent !== true) {
      throw new ValidationError({ errors: [{ path: 'consent', message }], req }, req?.t)
    }
    return data
  }
}

export const requireConsent = requireConsentFor('Cần có sự đồng ý trước khi xuất bản lời chia sẻ.')

export const Testimonials = {
  ...contentCollection('testimonials', 'Lời chia sẻ', vi.cms.nav.website, 'name', [
    text('name', 'Tên người chia sẻ', true),
    text('role', 'Vai trò', false, {
      admin: { description: 'Chức danh hiện trên thẻ (VD: Project Manager). Cần khách đồng ý.' },
    }),
    number('age', 'Tuổi', undefined, {
      min: 1,
      max: 120,
      admin: { description: 'Không bắt buộc. Chỉ nhập khi khách đồng ý hiện tuổi.' },
    }),
    textarea('quote', 'Lời chia sẻ'),
    relation('relatedOffer', 'Sản phẩm hoặc dịch vụ liên quan', [
      'products',
      'services',
      'programs',
    ]),
    select(
      'language',
      'Ngôn ngữ',
      [
        ['vi', 'Tiếng Việt'],
        ['en', 'Tiếng Anh'],
      ],
      { defaultValue: 'vi' },
    ),
    {
      ...checkbox('consent', 'Đã đồng ý cho phép hiển thị'),
      admin: { description: 'Chỉ xuất bản khi người chia sẻ đã đồng ý.' },
    },
    image('photo', 'Ảnh người chia sẻ'),
    {
      name: 'story',
      label: 'Câu chuyện',
      type: 'group',
      admin: {
        description:
          'Không bắt buộc. Dùng cho thẻ câu chuyện "Trước / Sau". Chỉ hiện trên web khi khách đã đồng ý.',
      },
      fields: [
        textarea('before', 'Trước / Vấn đề ban đầu'),
        textarea('insight', 'Quá trình nhận thức'),
        textarea('after', 'Sau / Kết quả'),
      ],
    },
  ]),
  hooks: { beforeChange: [requireConsent] },
}

Testimonials.admin = {
  ...Testimonials.admin,
  description: 'Lời chia sẻ và cảm nhận của học viên, khách hàng trên website.',
  defaultColumns: ['name', 'role', 'relatedOffer', 'consent', 'updatedAt'],
  listSearchableFields: ['name', 'role', 'quote'],
  livePreview: collectionLivePreview('testimonials'),
}
