import type { CollectionConfig } from 'payload'
import { date, relation, text } from '../fields/content'
import { isHiddenFromEditor, isOwner, nobody } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Append-only audit trail of sensitive admin actions (manual payment confirm,
// cancel order…). Owner reads; server code writes; never editable through the API.
export const AuditLogs: CollectionConfig = {
  slug: 'auditLogs',
  labels: { singular: 'Nhật ký thao tác', plural: 'Nhật ký thao tác' },
  admin: {
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    defaultColumns: ['action', 'actor', 'target', 'at'],
  },
  access: { read: isOwner, create: nobody, update: nobody, delete: nobody },
  fields: [
    relation('actor', 'Người thực hiện', 'users'),
    { ...text('action', 'Hành động', true) },
    text('target', 'Đối tượng'),
    { name: 'before', label: 'Trước', type: 'json' },
    { name: 'after', label: 'Sau', type: 'json' },
    { ...date('at', 'Lúc'), defaultValue: () => new Date().toISOString() },
  ],
}
