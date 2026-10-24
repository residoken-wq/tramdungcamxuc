import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Field,
} from 'payload'
import { checkbox, number, relation, select, textarea } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import {
  adminOrSelfCustomerPlan,
  isEditorOrOwner,
  isHiddenFromEditor,
  isOwner,
  ownerOrSelfCustomerField,
} from '../lib/auth/access'
import { EMOTIONS } from '../lib/emotions'
import { vi } from '../lib/i18n/vi'

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

// REVIEW-REQUIRED: Chặn ngày check-in vượt quá journeyDays của kế hoạch
const validatePlanJourneyDay: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data?.plan && typeof data.day === 'number') {
    const planId =
      typeof data.plan === 'object' && data.plan !== null
        ? (data.plan as { id: number }).id
        : Number(data.plan)
    if (planId) {
      const plan = await req.payload.findByID({
        collection: 'habitPlans',
        id: planId,
        depth: 0,
        overrideAccess: true,
        req,
      })
      if (plan) {
        const journeyDays = typeof plan.journeyDays === 'number' ? plan.journeyDays : 21
        if (data.day > journeyDays) {
          throw new APIError(
            `Ngày check-in (${data.day}) không được vượt quá số ngày hành trình (${journeyDays}).`,
            400,
          )
        }
      }
    }
  }
  return data
}

export const CHECKIN_STATUS_VALUES = ['voted', 'minimal', 'missed', 'rest'] as const
export type CheckinStatus = (typeof CHECKIN_STATUS_VALUES)[number]

// REVIEW-REQUIRED: Tự động đồng bộ field `done` từ `status` (hoặc ngược lại nếu chỉ gửi done).
// voted / minimal -> done = true (tính vào tỷ lệ hoàn thành 90% cấp chứng nhận).
// missed / rest -> done = false.
export const syncDoneFromStatus: CollectionBeforeValidateHook &
  CollectionBeforeChangeHook = async ({ data, originalDoc, operation }) => {
  if (!data) return data

  const status = data.status
  if (status !== undefined && status !== null) {
    data.done = status === 'voted' || status === 'minimal'
  } else if (data.done !== undefined && data.done !== null) {
    data.status = data.done ? 'voted' : 'missed'
    data.done = Boolean(data.done)
  } else if (operation === 'update' && originalDoc) {
    if (originalDoc.status !== undefined && originalDoc.status !== null) {
      data.status = originalDoc.status
      data.done = originalDoc.status === 'voted' || originalDoc.status === 'minimal'
    } else if (originalDoc.done !== undefined && originalDoc.done !== null) {
      data.status = originalDoc.done ? 'voted' : 'missed'
      data.done = Boolean(originalDoc.done)
    }
  }

  return data
}

// REVIEW-REQUIRED: One check-in per plan and day (DB unique index on planDay + hook).
// Emotion and note are sensitive: hidden from editors (field-level read access).
export const HabitCheckins: CollectionConfig = {
  slug: 'habitCheckins',
  labels: { singular: 'Check-in thói quen', plural: 'Check-in thói quen' },
  admin: {
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    useAsTitle: 'planDay',
    description: 'Nhật ký check-in hành trình thói quen của học viên.',
    defaultColumns: ['plan', 'day', 'status', 'done'],
  },
  access: {
    read: adminOrSelfCustomerPlan,
    create: adminOrSelfCustomerPlan,
    update: adminOrSelfCustomerPlan,
    delete: isOwner,
  },
  hooks: {
    beforeValidate: [syncDoneFromStatus],
    beforeChange: [
      syncDoneFromStatus,
      verifyPlanOwnership,
      validatePlanJourneyDay,
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
    { ...number('day', 'Ngày thứ'), required: true, min: 1, max: 60 },
    select(
      'status',
      vi.hb04.fields.status,
      CHECKIN_STATUS_VALUES.map((s) => [s, vi.hb04.status[s]] as [string, string]),
      {
        required: true,
        admin: {
          description: vi.hb04.fields.statusDesc,
        },
      },
    ),
    {
      ...checkbox('done', 'Đã hoàn thành', false, {
        admin: {
          readOnly: true,
          description: vi.hb04.fields.doneDesc,
        },
      }),
    },
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
