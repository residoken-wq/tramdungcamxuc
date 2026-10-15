import type { CollectionConfig } from 'payload'
import { date, relation } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

export const WorkshopReminders: CollectionConfig = {
  slug: 'workshopReminders',
  labels: { singular: 'Nhắc lịch workshop', plural: 'Nhắc lịch workshop' },
  admin: {
    group: vi.cms.nav.system,
    defaultColumns: ['workshop', 'customer', 'sentAt'],
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
        keyField: 'workshopCustomer',
        parts: ['workshop', 'customer'],
        message: 'Đã gửi email nhắc cho khách hàng này.',
      }),
    ],
  },
  fields: [
    // Not `required`: the FK is ON DELETE SET NULL, so a NOT NULL column would block deleting
    // a workshop or a customer (account deletion) that already got a reminder.
    relation('workshop', 'Workshop', 'workshops'),
    relation('customer', 'Khách hàng', 'customers'),
    {
      ...date('sentAt', 'Thời điểm gửi'),
      required: true,
    },
    uniqueKeyField('workshopCustomer'),
  ],
}
