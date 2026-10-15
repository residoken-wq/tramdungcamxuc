import type { CollectionConfig } from 'payload'
import { date, number } from '../fields/content'
import { isHiddenFromEditor, nobody } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: OTP storage for customer login (GĐ 2). Hidden from the admin UI and closed
// to every API caller; only server code (overrideAccess) reads/writes. Store a hash, never the code.
export const OtpCodes: CollectionConfig = {
  slug: 'otpCodes',
  labels: { singular: 'Mã OTP', plural: 'Mã OTP' },
  admin: { hidden: isHiddenFromEditor, group: vi.cms.nav.system },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { ...date('expiresAt', 'Hết hạn lúc'), required: true },
    number('attempts', 'Số lần thử', 0),
    date('usedAt', 'Đã dùng lúc'),
  ],
}
