import type { CollectionConfig } from 'payload'
import { checkbox, date, text } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'
import { customerAuthStrategy } from '../lib/auth/strategy'

// REVIEW-REQUIRED: Khách hàng (customers) trở thành auth collection của Payload (GĐ 2).
// Đăng nhập bằng OTP email, không mật khẩu (disableLocalStrategy: true).
// Phiên khách là cookie riêng httpOnly + secure (trừ dev) + sameSite=lax.
// Khách không bao giờ được phép vào trang quản trị /admin (chỉ dành cho collection 'users').
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Khách hàng', plural: 'Khách hàng' },
  admin: {
    group: 'Khách hàng',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'createdAt'],
  },
  auth: {
    disableLocalStrategy: true,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    strategies: [customerAuthStrategy],
  },
  access: {
    read: adminOrSelfCustomer('id'),
    create: isEditorOrOwner,
    update: adminOrSelfCustomer('id'),
    delete: isOwner,
  },
  fields: [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      access: {
        update: isEditorOrOwner,
      },
    },
    text('name', 'Họ tên'),
    text('phone', 'Điện thoại'),
    checkbox('consentMarketing', 'Đồng ý nhận tin'),
    {
      ...date('consentAt', 'Thời điểm đồng ý'),
      access: {
        update: isEditorOrOwner,
      },
    },
  ],
}
