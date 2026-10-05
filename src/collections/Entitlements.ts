import type { CollectionConfig } from 'payload'
import { date, relation, select } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'

// REVIEW-REQUIRED: Access rights to paid tools. A customer may use the trial of a product only
// once: enforced by a DB unique index on `trialKey` (set only for source = trial) and the hook.
export const Entitlements: CollectionConfig = {
  slug: 'entitlements',
  labels: { singular: 'Quyền truy cập', plural: 'Quyền truy cập' },
  admin: {
    group: 'Bán hàng',
    defaultColumns: ['customer', 'product', 'source', 'status', 'expiresAt'],
  },
  access: {
    read: adminOrSelfCustomer(),
    create: isEditorOrOwner,
    update: isOwner,
    delete: isOwner,
  },
  hooks: {
    beforeChange: [
      uniqueKeyHook({
        keyField: 'trialKey',
        parts: ['customer', 'product'],
        when: (data) => data.source === 'trial',
        message:
          'Khách hàng này đã dùng thử sản phẩm này rồi. Mỗi người chỉ được dùng thử một lần.',
      }),
    ],
  },
  fields: [
    { ...relation('customer', 'Khách hàng', 'customers'), required: true },
    { ...relation('product', 'Sản phẩm', 'products'), required: true },
    { ...date('grantedAt', 'Ngày cấp'), defaultValue: () => new Date().toISOString() },
    select(
      'source',
      'Nguồn',
      [
        ['trial', 'Dùng thử'],
        ['order', 'Đơn hàng'],
        ['package', 'Gói'],
        ['manual', 'Cấp tay'],
        ['gift', 'Tặng'],
      ],
      { required: true },
    ),
    select(
      'status',
      'Trạng thái',
      [
        ['trial', 'Đang dùng thử'],
        ['active', 'Đang hiệu lực'],
        ['expired', 'Hết hạn'],
      ],
      { required: true, defaultValue: 'active' },
    ),
    date('expiresAt', 'Hết hạn lúc'),
    uniqueKeyField('trialKey'),
  ],
}
