import type { CollectionConfig } from 'payload'
import { date, number, relation } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { isHiddenFromEditor, isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

export const TrackerNudges: CollectionConfig = {
  slug: 'trackerNudges',
  labels: { singular: 'Nhắc lỡ nhịp tracker', plural: 'Nhắc lỡ nhịp tracker' },
  admin: {
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    useAsTitle: 'nudgeKey',
    description: 'Lịch sử email nhắc nhở khi học viên lỡ nhịp thực hành.',
    defaultColumns: ['plan', 'missedStartDay', 'sentAt'],
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
        keyField: 'nudgeKey',
        parts: ['plan', 'missedStartDay'],
        message: 'Đã gửi email nhắc cho chuỗi lỡ nhịp này của kế hoạch.',
      }),
    ],
  },
  fields: [
    // Relation không required: foreign key ON DELETE SET NULL để xóa kế hoạch không bị chặn lỗi DB (review T2-10)
    relation('plan', 'Kế hoạch', 'habitPlans'),
    {
      ...number('missedStartDay', 'Ngày bắt đầu chuỗi lỡ'),
      required: true,
    },
    {
      ...date('sentAt', 'Thời điểm gửi'),
      required: true,
    },
    uniqueKeyField('nudgeKey'),
  ],
}
