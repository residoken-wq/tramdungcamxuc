import type { CollectionConfig } from 'payload'
import { date, number, relation, select, text } from '../fields/content'
import { isEditorOrOwner, isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Discount codes are admin-only; checkout validates them server-side (GĐ 4).
export const DiscountCodes: CollectionConfig = {
  slug: 'discountCodes',
  labels: { singular: 'Mã giảm giá', plural: 'Mã giảm giá' },
  admin: { group: vi.cms.nav.commerce, useAsTitle: 'code' },
  access: { read: isEditorOrOwner, create: isOwner, update: isOwner, delete: isOwner },
  fields: [
    { ...text('code', 'Mã', true), unique: true },
    select(
      'type',
      'Loại',
      [
        ['percent', 'Phần trăm'],
        ['fixed', 'Số tiền cố định'],
      ],
      { required: true },
    ),
    { ...number('value', 'Giá trị'), required: true },
    date('validUntil', 'Hiệu lực đến'),
    number('maxUses', 'Số lượt tối đa'),
    { ...number('usedCount', 'Đã dùng', 0), admin: { readOnly: true } },
    relation('products', 'Áp dụng cho sản phẩm', 'products', true),
  ],
}
