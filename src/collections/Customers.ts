import type { CollectionConfig, FieldAccess } from 'payload'
import { checkbox, date, text } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'
import { customerAuthStrategy } from '../lib/auth/strategy'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Khách hàng (customers) trở thành auth collection của Payload (GĐ 2).
// Đăng nhập bằng OTP email, không mật khẩu (disableLocalStrategy: true).
// Phiên khách là cookie riêng httpOnly + secure (trừ dev) + sameSite=lax.
// Khách không bao giờ được phép vào trang quản trị /admin (chỉ dành cho collection 'users').
const nameUpdateAccess: FieldAccess = async (args) => {
  if (isEditorOrOwner(args)) return true
  const customerId = args.id ?? args.doc?.id
  if (!customerId) return false
  const certificates = await args.req.payload.count({
    collection: 'certificates',
    where: { customer: { equals: customerId } },
    overrideAccess: true,
    req: args.req,
  })
  return certificates.totalDocs === 0
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Khách hàng', plural: 'Khách hàng' },
  admin: {
    group: 'Khách hàng',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'deletionRequestedAt', 'createdAt'],
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
    {
      // REVIEW-REQUIRED: the name is printed on the 21-day certificate and its public
      // verification page. Admins can always fix it; a customer can edit their own name only
      // until they hold a certificate (decided 14/10, T2-07c).
      ...text('name', 'Họ tên'),
      maxLength: 100,
      access: {
        update: nameUpdateAccess,
      },
      validate: (value: string | null | undefined) => {
        if (value == null || value === '') return true
        if (typeof value !== 'string') return true
        const trimmed = value.trim()
        if (trimmed.length > 100) {
          return vi.account.validation.nameMax100
        }
        if (/[<>{}]|[\x00-\x1F\x7F]/.test(trimmed)) {
          return vi.account.validation.nameSpecialChars
        }
        return true
      },
    },
    text('phone', 'Điện thoại'),
    checkbox('consentMarketing', 'Đồng ý nhận tin'),
    {
      ...date('consentAt', 'Thời điểm đồng ý'),
      access: {
        update: isEditorOrOwner,
      },
    },
    {
      ...date('deletionRequestedAt', 'Yêu cầu xóa lúc'),
      access: {
        read: isEditorOrOwner,
        update: isEditorOrOwner,
      },
      admin: {
        readOnly: true,
        description: 'Thời điểm khách gửi yêu cầu xóa tài khoản (chỉ admin có quyền sửa).',
      },
    },
  ],
}
