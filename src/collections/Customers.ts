import type { CollectionConfig } from 'payload'
import { checkbox, date, text } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'

// REVIEW-REQUIRED: Learners/buyers. Login (email OTP) arrives in GĐ 2; until then only admins
// and server code (overrideAccess) touch these records.
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Khách hàng', plural: 'Khách hàng' },
  admin: {
    group: 'Khách hàng',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'createdAt'],
  },
  access: {
    read: adminOrSelfCustomer('id'),
    create: isEditorOrOwner,
    update: isEditorOrOwner,
    delete: isOwner,
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true, unique: true, index: true },
    text('name', 'Họ tên'),
    text('phone', 'Điện thoại'),
    checkbox('consentMarketing', 'Đồng ý nhận tin'),
    date('consentAt', 'Thời điểm đồng ý'),
  ],
}
