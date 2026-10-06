import type { CollectionConfig } from 'payload'
import { nobody } from '../lib/auth/access'

export const RateLimitHits: CollectionConfig = {
  slug: 'rateLimitHits',
  labels: { singular: 'Lượt gửi form', plural: 'Lượt gửi form' },
  admin: {
    hidden: true,
  },
  access: {
    read: nobody,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    {
      name: 'key',
      label: 'Khóa băm (SHA-256)',
      type: 'text',
      required: true,
      index: true,
    },
  ],
}
