import { randomBytes } from 'node:crypto'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { checkbox, date, image, number, relation, textarea } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Public verification (/chung-nhan/[code], GĐ 2) must show only name, identity
// statement, days and date – never emotions or notes. The code is random and unique.
const assignCode: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) =>
  operation === 'create'
    ? { ...data, code: randomBytes(6).toString('base64url') }
    : { ...data, code: originalDoc?.code }

export const Certificates: CollectionConfig = {
  slug: 'certificates',
  labels: { singular: 'Chứng nhận thói quen', plural: 'Chứng nhận thói quen' },
  admin: {
    group: vi.cms.nav.customers,
    useAsTitle: 'code',
    description: 'Chứng nhận hoàn thành thử thách xây dựng thói quen.',
    defaultColumns: ['code', 'customer', 'daysCompleted', 'issuedAt'],
    listSearchableFields: ['code'],
  },
  access: {
    read: adminOrSelfCustomer(),
    create: isEditorOrOwner,
    update: isEditorOrOwner,
    delete: isOwner,
  },
  hooks: { beforeChange: [assignCode] },
  fields: [
    {
      ...relation('customer', 'Khách hàng', 'customers'),
      required: true,
      access: { update: isEditorOrOwner },
    },
    {
      ...relation('plan', 'Kế hoạch', 'habitPlans'),
      unique: true,
      index: true,
    },
    textarea('identityStatement', 'Câu định danh'),
    { ...number('daysCompleted', 'Số ngày hoàn thành'), max: 60 },
    { ...date('issuedAt', 'Ngày cấp'), defaultValue: () => new Date().toISOString() },
    {
      name: 'code',
      label: 'Mã xác minh',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    image('image45', 'Ảnh 4:5'),
    image('image916', 'Ảnh 9:16'),
    { ...checkbox('isPublic', 'Cho phép xem công khai', true) },
  ],
}
