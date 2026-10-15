import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isAdminUser, isHiddenFromEditor, isOwner, isOwnerUser } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: The very first admin becomes owner; everyone created later defaults to
// editor and only an owner may change a role (field-level update access below).
const firstUserIsOwner: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const { totalDocs } = await req.payload.count({ collection: 'users', req, overrideAccess: true })
  if (totalDocs === 0) return { ...data, role: 'owner' }
  if (!isOwnerUser(req.user)) return { ...data, role: 'editor' }
  return data
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Quản trị viên', plural: 'Quản trị viên' },
  admin: {
    useAsTitle: 'email',
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    defaultColumns: ['email', 'role'],
  },
  auth: true,
  // REVIEW-REQUIRED: Admin accounts – only owners create or delete; anyone signed in may
  // update their own profile (password), owners may update anyone.
  access: {
    read: ({ req }) => isAdminUser(req.user),
    create: isOwner,
    update: ({ req }) =>
      isOwnerUser(req.user)
        ? true
        : isAdminUser(req.user)
          ? { id: { equals: req.user!.id } }
          : false,
    delete: isOwner,
  },
  hooks: { beforeChange: [firstUserIsOwner] },
  fields: [
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Chủ sở hữu (toàn quyền)', value: 'owner' },
        { label: 'Biên tập (sửa nội dung)', value: 'editor' },
      ],
      saveToJWT: true,
      access: { create: isOwner, update: isOwner },
      admin: {
        position: 'sidebar',
        description:
          'Chủ sở hữu: toàn quyền, gồm thanh toán và đơn hàng. Biên tập: chỉ sửa nội dung. Người tạo đầu tiên tự là chủ sở hữu.',
      },
    },
  ],
}
