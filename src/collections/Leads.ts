import type { CollectionConfig } from 'payload'
import { checkbox, lines, relation, select, text, textarea } from '../fields/content'
import { isEditorOrOwner, isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Personal data (NĐ 13/2023). Public forms create leads through server code
// (T1-06) with overrideAccess after validation; the REST API never accepts anonymous writes.
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Khách tiềm năng', plural: 'Khách tiềm năng' },
  admin: {
    group: vi.cms.nav.customers,
    useAsTitle: 'email',
    description: 'Khách hàng tiềm năng để lại thông tin tư vấn hoặc tải tài nguyên.',
    defaultColumns: ['email', 'name', 'need', 'followUpStatus', 'createdAt'],
    listSearchableFields: ['email', 'name', 'phone'],
    components: {
      beforeListTable: ['@/components/admin/ExportLeadsButton#ExportLeadsButton'],
    },
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
    {
      name: 'consentAt',
      label: 'Thời điểm đồng ý',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Thời điểm khách hàng đồng ý chính sách bảo mật (NĐ 13/2023).',
      },
    },
    relation('service', 'Dịch vụ quan tâm', 'services'),
    {
      name: 'brief',
      label: 'Thông tin doanh nghiệp',
      type: 'group',
      admin: {
        condition: (data) => data?.need === 'business',
      },
      fields: [
        text('company', 'Công ty / Tổ chức'),
        text('teamSize', 'Quy mô đội ngũ'),
        textarea('targetBehaviors', 'Hành vi mục tiêu'),
        text('timeline', 'Thời gian dự kiến'),
      ],
    },
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
