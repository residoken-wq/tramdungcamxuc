import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'
import { date, relation, textarea } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import {
  adminOrSelfCustomer,
  isEditorOrOwner,
  isOwner,
  ownerOrSelfCustomerField,
} from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

const bindCustomerOnCreate: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.user && req.user.collection === 'customers') {
    return {
      ...data,
      customer: req.user.id,
    }
  }
  return data
}

// REVIEW-REQUIRED: Reflections are sensitive – hidden from editors.
export const SavedCards: CollectionConfig = {
  slug: 'savedCards',
  labels: { singular: 'Thẻ đã lưu', plural: 'Thẻ đã lưu' },
  admin: { group: 'EQ Buddy', defaultColumns: ['customer', 'card', 'savedAt'] },
  access: {
    read: adminOrSelfCustomer(),
    create: adminOrSelfCustomer(),
    update: adminOrSelfCustomer(),
    delete: isOwner,
  },
  hooks: {
    beforeChange: [
      bindCustomerOnCreate,
      uniqueKeyHook({
        keyField: 'saveKey',
        parts: ['customer', 'card'],
        message: vi.eqBuddy.savedCards.alreadySaved,
      }),
    ],
  },
  fields: [
    {
      ...relation('customer', 'Khách hàng', 'customers'),
      required: true,
      access: { update: isEditorOrOwner },
    },
    { ...relation('card', 'Thẻ', 'eqCards'), required: true },
    {
      ...textarea('reflection', 'Suy ngẫm'),
      maxLength: 2000,
      // Suy ngẫm là dữ liệu nhạy cảm: editor không đọc, không sửa.
      access: { read: ownerOrSelfCustomerField, update: ownerOrSelfCustomerField },
    } as Field,
    { ...date('savedAt', 'Lưu lúc'), defaultValue: () => new Date().toISOString() },
    uniqueKeyField('saveKey'),
  ],
}
