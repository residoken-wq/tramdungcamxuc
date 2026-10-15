import type { CollectionConfig } from 'payload'
import { date, relation, text } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { isHiddenFromEditor, nobody } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Dấu vết dùng thử của khách hàng sau khi xóa tài khoản (T2-16b B6, anh Nhân chốt 14/10).
// - Lưu trữ emailHash (HMAC-SHA256 của email chuẩn hóa chữ thường + trim, khóa = PAYLOAD_SECRET).
// - Đảm bảo nguyên tắc ẩn danh: không lưu email gốc, không thể đảo ngược hash.
// - Khách đã từng dùng thử sản phẩm thì dù xóa tài khoản rồi đăng ký lại cũng không được dùng thử lần 2.
// - Truy cập: nobody (chỉ server-side code với overrideAccess mới có quyền đọc/ghi).
export const TrialUsage: CollectionConfig = {
  slug: 'trialUsage',
  labels: { singular: 'Dấu vết dùng thử', plural: 'Dấu vết dùng thử' },
  admin: {
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    useAsTitle: 'emailHash',
    description: 'Dấu vết dùng thử ẩn danh chống lạm dụng sau khi xóa tài khoản.',
    defaultColumns: ['emailHash', 'product', 'usedAt'],
    listSearchableFields: ['emailHash'],
  },
  access: {
    read: nobody,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  hooks: {
    beforeChange: [
      uniqueKeyHook({
        keyField: 'usageKey',
        parts: ['emailHash', 'product'],
        message: 'Dấu vết dùng thử cho sản phẩm này đã tồn tại.',
      }),
    ],
  },
  fields: [
    {
      ...text('emailHash', 'Mã băm email (HMAC-SHA256)', true),
      index: true,
    },
    {
      ...relation('product', 'Sản phẩm', 'products'),
      required: true,
    },
    {
      ...date('usedAt', 'Thời điểm dùng thử'),
      defaultValue: () => new Date().toISOString(),
    },
    uniqueKeyField('usageKey'),
  ],
}
