import type { Access, CollectionConfig } from 'payload'
import { isAdminUser, isOwnerUser } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'
import { guardCustomCodeHook } from '@/puck/custom-code-guard'

// REVIEW-REQUIRED: Delete permission: owner can delete any template, editor can only delete their own template.
export const blockTemplateDeleteAccess: Access = ({ req }) => {
  if (isOwnerUser(req.user)) return true
  if (isAdminUser(req.user) && req.user?.id) {
    return {
      createdBy: {
        equals: req.user.id,
      },
    }
  }
  return false
}

// REVIEW-REQUIRED: Public read is forbidden. Only authenticated admin users (owner / editor) can read, create, update.
export const blockTemplateAdminAccess: Access = ({ req }) => isAdminUser(req.user)

export const BlockTemplates: CollectionConfig = {
  slug: 'blockTemplates',
  labels: {
    singular: vi.eb08.collectionSingular,
    plural: vi.eb08.collectionPlural,
  },
  admin: {
    group: vi.cms.nav.website,
    description:
      'Quản lý các mẫu khối và mẫu trang đã lưu để tái sử dụng trong trình dựng trang Puck.',
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'createdBy', 'createdAt'],
  },
  access: {
    read: blockTemplateAdminAccess,
    create: blockTemplateAdminAccess,
    update: blockTemplateAdminAccess,
    delete: blockTemplateDeleteAccess,
  },
  // EB-09: only the owner adds or changes custom CSS / HTML in a template (REST included).
  hooks: { beforeChange: [guardCustomCodeHook] },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 80,
      label: vi.eb08.name,
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: vi.eb08.kindSection, value: 'section' },
        { label: vi.eb08.kindPage, value: 'page' },
      ],
      label: vi.eb08.kind,
    },
    {
      name: 'description',
      type: 'textarea',
      label: vi.eb08.description,
    },
    {
      name: 'puckData',
      type: 'json',
      required: true,
      label: vi.eb08.puckData,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      // REVIEW-REQUIRED: set by the server only. Taken from the signed-in user on create and kept on
      // update, whatever the request sends – otherwise an editor could claim an owner's template and
      // then delete it (delete access depends on this field).
      hooks: {
        beforeChange: [
          ({ operation, req, originalDoc }) => {
            if (operation === 'create') return req.user?.id ?? null
            const previous = originalDoc?.createdBy
            return previous && typeof previous === 'object' ? previous.id : (previous ?? null)
          },
        ],
      },
      label: vi.eb08.createdBy,
    },
  ],
  timestamps: true,
}
