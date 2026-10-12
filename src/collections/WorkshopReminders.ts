import type { CollectionConfig } from 'payload'
import { date, relation } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { isOwner } from '../lib/auth/access'

export const WorkshopReminders: CollectionConfig = {
  slug: 'workshopReminders',
  labels: { singular: 'Nhắc lịch workshop', plural: 'Nhắc lịch workshop' },
  admin: {
    group: 'Hệ thống',
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
    {
      ...relation('workshop', 'Workshop', 'workshops'),
      required: true,
    },
    {
      ...relation('customer', 'Khách hàng', 'customers'),
      required: true,
    },
    {
      ...date('sentAt', 'Thời điểm gửi'),
      required: true,
    },
    uniqueKeyField('workshopCustomer'),
  ],
}
