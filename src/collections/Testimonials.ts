import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import {
  checkbox,
  contentCollection,
  image,
  relation,
  select,
  text,
  textarea,
} from '../fields/content'

export const requireConsent: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const next = { ...originalDoc, ...data }
  if (next._status === 'published' && next.consent !== true) {
    throw new ValidationError(
      {
        errors: [{ path: 'consent', message: 'Cần có sự đồng ý trước khi xuất bản lời chia sẻ.' }],
        req,
      },
      req?.t,
    )
  }
  return data
}

export const Testimonials = {
  ...contentCollection('testimonials', 'Lời chia sẻ', 'Nội dung', 'name', [
    text('name', 'Tên người chia sẻ', true),
    text('role', 'Vai trò'),
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
  ]),
  hooks: { beforeChange: [requireConsent] },
}
