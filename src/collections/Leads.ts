import type { CollectionConfig } from 'payload'
import { checkbox, lines, select, text, textarea } from '../fields/content'
import { isEditorOrOwner, isOwner } from '../lib/auth/access'

// REVIEW-REQUIRED: Personal data (NĐ 13/2023). Public forms create leads through server code
// (T1-06) with overrideAccess after validation; the REST API never accepts anonymous writes.
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Khách tiềm năng', plural: 'Khách tiềm năng' },
  admin: {
    group: 'Khách hàng',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'need', 'followUpStatus', 'createdAt'],
  },
  access: {
    read: isEditorOrOwner,
    create: isEditorOrOwner,
    update: isEditorOrOwner,
    delete: isOwner,
  },
  fields: [
    {
      name: 'source',
      label: 'Nguồn',
      type: 'group',
      fields: [text('form', 'Form'), text('page', 'Trang'), text('utm', 'UTM')],
    },
    select('need', 'Nhu cầu', [
      ['personal', 'Cá nhân'],
      ['business', 'Doanh nghiệp'],
      ['resource', 'Tài nguyên'],
    ]),
    text('name', 'Họ tên'),
    { name: 'email', label: 'Email', type: 'email', required: true, index: true },
    text('phone', 'Điện thoại'),
    textarea('message', 'Lời nhắn'),
    checkbox('consent', 'Đã đồng ý'),
    select(
      'followUpStatus',
      'Tình trạng chăm sóc',
      [
        ['new', 'Mới'],
        ['contacted', 'Đã liên hệ'],
        ['converted', 'Đã chuyển đổi'],
        ['closed', 'Đóng'],
      ],
      { defaultValue: 'new' },
    ),
    lines('interestTags', 'Thẻ quan tâm'),
  ],
}
