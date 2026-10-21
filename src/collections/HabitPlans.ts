import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { date, number, relation, select, text, textarea } from '../fields/content'
import { adminOrSelfCustomer, isEditorOrOwner, isOwner } from '../lib/auth/access'
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

// REVIEW-REQUIRED: Gán cố định số ngày hành trình (journeyDays) từ siteSettings khi tạo kế hoạch mới, không đổi khi sửa.
const assignJourneyDaysOnCreate: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation === 'create') {
    if (typeof data.journeyDays !== 'number') {
      try {
        const settings = await req.payload.findGlobal({
          slug: 'siteSettings',
          depth: 0,
        })
        const days = typeof settings?.habitJourneyDays === 'number' ? settings.habitJourneyDays : 28
        return {
          ...data,
          journeyDays: days,
        }
      } catch {
        return {
          ...data,
          journeyDays: 28,
        }
      }
    }
  } else if (operation === 'update' && originalDoc?.journeyDays) {
    // Không cho phép thay đổi journeyDays khi sửa kế hoạch
    return {
      ...data,
      journeyDays: originalDoc.journeyDays,
    }
  }
  return data
}

// REVIEW-REQUIRED: Learner plans are personal data; created by the Habit Loop flow (GĐ 2).
export const HabitPlans: CollectionConfig = {
  slug: 'habitPlans',
  labels: { singular: 'Kế hoạch thói quen', plural: 'Kế hoạch thói quen' },
  admin: {
    group: vi.cms.nav.customers,
    useAsTitle: 'identityStatement',
    description: 'Kế hoạch vòng lặp thói quen do học viên thiết lập.',
    defaultColumns: [
      'identityStatement',
      'customer',
      'leadEmail',
      'startDate',
      'journeyDays',
      'outcome',
    ],
    listSearchableFields: ['identityStatement', 'leadEmail'],
  },
  access: {
    read: adminOrSelfCustomer(),
    create: adminOrSelfCustomer(),
    update: adminOrSelfCustomer(),
    delete: isOwner,
  },
  hooks: {
    beforeChange: [bindCustomerOnCreate, assignJourneyDaysOnCreate],
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
    {
      ...number('journeyDays', 'Số ngày hành trình'),
      admin: {
        readOnly: true,
        description: 'Số ngày của hành trình rèn luyện thói quen (lưu cố định khi tạo kế hoạch).',
      },
    },
    {
      ...select('outcome', 'Kết quả hành trình', [
        ['in_progress', 'Đang thực hành'],
        ['completed', 'Đã hoàn thành'],
        ['experienced', 'Đã trải nghiệm'],
      ]),
      defaultValue: 'in_progress',
      admin: {
        readOnly: true,
        description:
          'Kết quả của hành trình thói quen: Đang thực hành / Đã hoàn thành / Đã trải nghiệm.',
      },
    },
  ],
}
