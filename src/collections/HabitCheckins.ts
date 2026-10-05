import type { CollectionConfig, Field } from 'payload'
import { checkbox, number, relation, select, textarea } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import { isEditorOrOwner, isOwner, ownerOrSelfCustomerField } from '../lib/auth/access'
import { EMOTIONS } from '../lib/emotions'

// REVIEW-REQUIRED: One check-in per plan and day (DB unique index on planDay + hook).
// Emotion and note are sensitive: hidden from editors (field-level read access).
export const HabitCheckins: CollectionConfig = {
  slug: 'habitCheckins',
  labels: { singular: 'Check-in 21 ngày', plural: 'Check-in 21 ngày' },
  admin: { group: 'Khóa học', defaultColumns: ['plan', 'day', 'done'] },
  access: {
    read: isEditorOrOwner,
    create: isEditorOrOwner,
    update: isEditorOrOwner,
    delete: isOwner,
  },
  hooks: {
    beforeChange: [
      uniqueKeyHook({
        keyField: 'planDay',
        parts: ['plan', 'day'],
        message: 'Ngày này của kế hoạch đã được check-in.',
      }),
    ],
  },
  fields: [
    { ...relation('plan', 'Kế hoạch', 'habitPlans'), required: true },
    { ...number('day', 'Ngày thứ'), required: true, min: 1, max: 21 },
    checkbox('done', 'Đã hoàn thành'),
    {
      ...select(
        'emotion',
        'Cảm xúc',
        EMOTIONS.map((emotion) => [emotion.key, emotion.label] as [string, string]),
      ),
      access: { read: ownerOrSelfCustomerField },
    },
    { ...textarea('note', 'Ghi chú'), access: { read: ownerOrSelfCustomerField } } as Field,
    uniqueKeyField('planDay'),
  ],
}
