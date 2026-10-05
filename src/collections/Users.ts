import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Quản trị viên', plural: 'Quản trị viên' },
  admin: {
    useAsTitle: 'email',
    group: 'Hệ thống',
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
