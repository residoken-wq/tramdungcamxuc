import type { CollectionConfig } from 'payload'
import { nobody } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

export const RateLimitHits: CollectionConfig = {
  slug: 'rateLimitHits',
  labels: { singular: 'Lượt gửi form', plural: 'Lượt gửi form' },
  admin: {
    group: vi.cms.nav.system,
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
