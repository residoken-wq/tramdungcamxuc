import type { CollectionConfig } from 'payload'
import { authenticated } from '../lib/auth/access'
import { sampleField } from '../fields/content'

export const PrivateFiles: CollectionConfig = {
  slug: 'privateFiles',
  labels: { singular: 'Tài liệu riêng tư', plural: 'Tài liệu riêng tư' },
  admin: {
    group: 'Bán hàng',
    useAsTitle: 'filename',
    description: 'Tải tài liệu riêng tư (PDF, ZIP, EPUB). Chỉ giao qua liên kết ký có hạn.',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    staticDir: 'private',
    mimeTypes: [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/epub+zip',
    ],
  },
  fields: [
    {
      name: 'description',
      label: 'Mô tả tài liệu',
      type: 'text',
      admin: { description: 'Mô tả ngắn gọn nội dung tài liệu.' },
    },
    sampleField(),
  ],
}
