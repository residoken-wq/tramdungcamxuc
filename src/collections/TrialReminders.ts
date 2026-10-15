import type { CollectionConfig } from 'payload'
import { date, relation, select } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { isHiddenFromEditor, isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

export const TrialReminders: CollectionConfig = {
  slug: 'trialReminders',
  labels: { singular: 'Nhắc hạn dùng thử', plural: 'Nhắc hạn dùng thử' },
  admin: {
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    defaultColumns: ['entitlement', 'milestone', 'sentAt'],
  },
  access: {
    read: isOwner,
    create: isOwner,
    update: isOwner,
    delete: isOwner,
  },
  hooks: {
    beforeChange: [
      uniqueKeyHook({
        keyField: 'reminderKey',
        parts: ['entitlement', 'milestone'],
        message: 'Đã gửi email nhắc cho quyền dùng thử ở mốc này.',
      }),
    ],
  },
  fields: [
    // Not required: the FK is ON DELETE SET NULL, so a NOT NULL column would block deleting
    // an entitlement or related record.
    relation('entitlement', 'Quyền dùng thử', 'entitlements'),
    select(
      'milestone',
      'Mốc nhắc',
      [
        ['day_18', 'Ngày 18 (còn 3 ngày)'],
        ['day_21', 'Ngày 21 (ngày cuối)'],
      ],
      { required: true },
    ),
    {
      ...date('sentAt', 'Thời điểm gửi'),
      required: true,
    },
    uniqueKeyField('reminderKey'),
  ],
}
