import { randomBytes } from 'node:crypto'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { checkbox, date, image, number, relation, textarea } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'

// REVIEW-REQUIRED: Public verification (/chung-nhan/[code], GĐ 2) must show only name, identity
// statement, days and date – never emotions or notes. The code is random and unique.
const assignCode: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) =>
  operation === 'create'
    ? { ...data, code: randomBytes(6).toString('base64url') }
    : { ...data, code: originalDoc?.code }

export const Certificates: CollectionConfig = {
  slug: 'certificates',
  labels: { singular: 'Chứng nhận 21 ngày', plural: 'Chứng nhận 21 ngày' },
  admin: {
    group: 'Khóa học',
    useAsTitle: 'code',
    defaultColumns: ['code', 'customer', 'issuedAt'],
  },
  access: {
    read: adminOrSelfCustomer(),
    create: isEditorOrOwner,
    update: adminOrSelfCustomer(),
    delete: isOwner,
  },
  hooks: { beforeChange: [assignCode] },
  fields: [
    { ...relation('customer', 'Khách hàng', 'customers'), required: true },
    relation('plan', 'Kế hoạch', 'habitPlans'),
    textarea('identityStatement', 'Câu định danh'),
    { ...number('daysCompleted', 'Số ngày hoàn thành'), max: 21 },
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
