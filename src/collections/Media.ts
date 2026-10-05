import type { CollectionConfig } from 'payload'
import { authenticated } from '../lib/auth/access'
import { sampleField } from '../fields/content'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Thư viện ảnh và tài liệu', plural: 'Thư viện ảnh và tài liệu' },
  admin: {
    group: 'Hệ thống',
    useAsTitle: 'alt',
    description: 'Tải ảnh và tài liệu lên. Luôn thêm mô tả dễ hiểu.',
  },
  access: { read: () => true, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    {
      name: 'alt',
      label: 'Mô tả ảnh hoặc tài liệu',
      type: 'text',
      required: true,
      admin: { description: 'Mô tả nội dung để người dùng trình đọc màn hình hiểu được.' },
      validate: (value: unknown) =>
        (typeof value === 'string' && value.trim().length > 0) ||
        'Vui lòng nhập mô tả ảnh hoặc tài liệu.',
    },
    sampleField(),
  ],
  upload: true,
}
