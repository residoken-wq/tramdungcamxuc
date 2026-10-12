import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { date, relation, select, text, textarea } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'

const bindCustomerOnCreate: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.user && req.user.collection === 'customers') {
    return {
      ...data,
      customer: req.user.id,
    }
  }
  return data
}

// REVIEW-REQUIRED: Learner plans are personal data; created by the Habit Loop flow (GĐ 2).
export const HabitPlans: CollectionConfig = {
  slug: 'habitPlans',
  labels: { singular: 'Kế hoạch thói quen', plural: 'Kế hoạch thói quen' },
  admin: { group: 'Khóa học', defaultColumns: ['customer', 'leadEmail', 'startDate'] },
  access: {
    read: adminOrSelfCustomer(),
    create: adminOrSelfCustomer(),
    update: adminOrSelfCustomer(),
    delete: isOwner,
  },
  hooks: {
    beforeChange: [bindCustomerOnCreate],
  },
  fields: [
    { ...relation('customer', 'Khách hàng', 'customers'), access: { update: isEditorOrOwner } },
    { name: 'leadEmail', label: 'Email (chưa có tài khoản)', type: 'email' },
    {
      name: 'scorecard',
      label: 'Bảng điểm thói quen',
      type: 'array',
      fields: [
        text('habit', 'Thói quen', true),
        select('rating', 'Đánh giá', [
          ['good', 'Tốt'],
          ['neutral', 'Bình thường'],
          ['bad', 'Xấu'],
        ]),
      ],
    },
    textarea('identityStatement', 'Câu định danh "Tôi sẽ … để trở thành …"'),
    {
      name: 'chosenTechniques',
      label: 'Kỹ thuật đã chọn',
      type: 'array',
      fields: [relation('technique', 'Kỹ thuật', 'techniques'), text('action', 'Hành động cụ thể')],
    },
    date('startDate', 'Ngày bắt đầu'),
  ],
}
