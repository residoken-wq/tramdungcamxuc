import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type Field,
} from 'payload'
import { checkbox, number, relation, select, textarea } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import {
  adminOrSelfCustomerPlan,
  isEditorOrOwner,
  isOwner,
  ownerOrSelfCustomerField,
} from '../lib/auth/access'
import { EMOTIONS } from '../lib/emotions'

// REVIEW-REQUIRED: Verify plan ownership on check-in creation/update.
// Prevents customers from forging check-ins into another customer's plan.
const verifyPlanOwnership: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (req.user && req.user.collection === 'customers') {
    const rawPlan = data?.plan
    const planId =
      typeof rawPlan === 'object' && rawPlan !== null
        ? (rawPlan as { id: number }).id
        : Number(rawPlan)

    if (!planId) {
      throw new APIError('Kế hoạch không hợp lệ.', 400)
    }

    const plan = await req.payload.findByID({
      collection: 'habitPlans',
      id: planId,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (!plan) {
      throw new APIError('Kế hoạch không tồn tại.', 404)
    }

    const planCustomerId =
      typeof plan.customer === 'object' && plan.customer !== null
        ? (plan.customer as { id: number }).id
        : Number(plan.customer)

    if (planCustomerId !== req.user.id) {
      throw new APIError('Bạn không có quyền check-in vào kế hoạch này.', 403)
    }
  }
  return data
}

// REVIEW-REQUIRED: One check-in per plan and day (DB unique index on planDay + hook).
// Emotion and note are sensitive: hidden from editors (field-level read access).
export const HabitCheckins: CollectionConfig = {
  slug: 'habitCheckins',
  labels: { singular: 'Check-in 21 ngày', plural: 'Check-in 21 ngày' },
  admin: { group: 'Khóa học', defaultColumns: ['plan', 'day', 'done'] },
  access: {
    read: adminOrSelfCustomerPlan,
    create: adminOrSelfCustomerPlan,
    update: adminOrSelfCustomerPlan,
    delete: isOwner,
  },
  hooks: {
    beforeChange: [
      verifyPlanOwnership,
      uniqueKeyHook({
        keyField: 'planDay',
        parts: ['plan', 'day'],
        message: 'Ngày này của kế hoạch đã được check-in.',
      }),
    ],
  },
  fields: [
    {
      ...relation('plan', 'Kế hoạch', 'habitPlans'),
      required: true,
      access: { update: isEditorOrOwner },
    },
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
