import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { date, number, relation, select, text, textarea } from '../fields/content'
import {
  adminOrSelfCustomer,
  isAdminUser,
  isEditorOrOwner,
  isOwner,
  selfCustomerOnlyField,
} from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'
import { vietnamTodayIso } from '../lib/habit/tracker-stats'

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

// REVIEW-REQUIRED: Khóa rhythmDays sau khi học viên đã có ít nhất 1 check-in.
// Khách chỉ được sửa rhythmDays khi chưa có check-in nào. Editor/owner vẫn sửa được.
const lockRhythmDaysAfterCheckins: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation === 'update' && originalDoc?.id && !isAdminUser(req.user)) {
    if (data.rhythmDays !== undefined) {
      try {
        const checkinCount = await req.payload.count({
          collection: 'habitCheckins',
          where: { plan: { equals: originalDoc.id } },
          overrideAccess: true,
          req,
        })
        if (checkinCount.totalDocs > 0) {
          return {
            ...data,
            rhythmDays: originalDoc.rhythmDays,
          }
        }
      } catch {
        return {
          ...data,
          rhythmDays: originalDoc.rhythmDays,
        }
      }
    }
  }
  return data
}

// REVIEW-REQUIRED: Gán cố định startDate là hôm nay theo giờ VN khi tạo kế hoạch nếu thiếu.
// Khách không được tự gửi startDate (bị chặn bởi field access), hook đảm bảo startDate luôn có giá trị.
const assignStartDateOnCreate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create') {
    if (!data.startDate) {
      return {
        ...data,
        startDate: vietnamTodayIso(),
      }
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
    beforeChange: [
      bindCustomerOnCreate,
      assignJourneyDaysOnCreate,
      assignStartDateOnCreate,
      lockRhythmDaysAfterCheckins,
    ],
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
        {
          name: 'time',
          label: vi.hb03.fields.scorecardTime,
          type: 'text',
          admin: {
            placeholder: '07:30',
            description: vi.hb03.fields.scorecardTimeDesc,
          },
          validate: (val: unknown) => {
            if (val === null || val === undefined || val === '') return true
            if (typeof val !== 'string') return vi.hb03.errors.timeInvalidFormat
            const trimmed = val.trim()
            if (!trimmed) return true
            const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
            if (!timeRegex.test(trimmed)) {
              return vi.hb03.errors.timeInvalidFormat
            }
            return true
          },
        },
      ],
    },
    textarea('identityStatement', 'Câu định danh "Tôi sẽ … để trở thành …"'),
    {
      name: 'anchorHabit',
      label: vi.hb03.fields.anchorHabit,
      type: 'text',
      maxLength: 120,
      admin: {
        description: vi.hb03.fields.anchorHabitDesc,
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') return true
        if (typeof val !== 'string') return true
        if (val.length > 120) return vi.hb03.errors.anchorHabitTooLong
        return true
      },
    },
    select(
      'rhythmDays',
      vi.hb03.fields.rhythmDays,
      [
        ['mon', vi.hb03.fields.rhythmDaysOptions.mon],
        ['tue', vi.hb03.fields.rhythmDaysOptions.tue],
        ['wed', vi.hb03.fields.rhythmDaysOptions.wed],
        ['thu', vi.hb03.fields.rhythmDaysOptions.thu],
        ['fri', vi.hb03.fields.rhythmDaysOptions.fri],
        ['sat', vi.hb03.fields.rhythmDaysOptions.sat],
        ['sun', vi.hb03.fields.rhythmDaysOptions.sun],
      ],
      {
        hasMany: true,
        admin: {
          description: vi.hb03.fields.rhythmDaysDesc,
        },
        validate: (val: unknown) => {
          if (val === null || val === undefined) return true
          if (!Array.isArray(val)) return true
          if (val.length === 0) return true
          const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
          for (const day of val) {
            if (!validDays.includes(day)) {
              return vi.hb03.errors.rhythmDaysInvalid
            }
          }
          const unique = new Set(val)
          if (unique.size !== val.length) {
            return vi.hb03.errors.rhythmDaysDuplicate
          }
          return true
        },
      },
    ),
    {
      name: 'twoMinuteAction',
      label: vi.hb03.fields.twoMinuteAction,
      type: 'text',
      maxLength: 200,
      admin: {
        description: vi.hb03.fields.twoMinuteActionDesc,
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') return true
        if (typeof val !== 'string') return true
        if (val.length > 200) return vi.hb03.errors.twoMinuteActionTooLong
        return true
      },
    },
    {
      name: 'privateReason',
      label: vi.hb03.fields.privateReason,
      type: 'textarea',
      maxLength: 1000,
      // REVIEW-REQUIRED: Chỉ chính học viên sở hữu kế hoạch mới được đọc/tạo/sửa trường này.
      access: {
        read: selfCustomerOnlyField,
        create: selfCustomerOnlyField,
        update: selfCustomerOnlyField,
      },
      admin: {
        description: vi.hb03.fields.privateReasonDesc,
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') return true
        if (typeof val !== 'string') return true
        if (val.length > 1000) return vi.hb03.errors.privateReasonTooLong
        return true
      },
    },
    {
      name: 'companionName',
      label: vi.hb03.fields.companionName,
      type: 'text',
      maxLength: 100,
      // REVIEW-REQUIRED: Chỉ chính học viên sở hữu kế hoạch mới được đọc/tạo/sửa trường này.
      access: {
        read: selfCustomerOnlyField,
        create: selfCustomerOnlyField,
        update: selfCustomerOnlyField,
      },
      admin: {
        description: vi.hb03.fields.companionNameDesc,
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') return true
        if (typeof val !== 'string') return true
        if (val.length > 100) return vi.hb03.errors.companionNameTooLong
        return true
      },
    },
    {
      name: 'chosenTechniques',
      label: 'Kỹ thuật đã chọn',
      type: 'array',
      fields: [relation('technique', 'Kỹ thuật', 'techniques'), text('action', 'Hành động cụ thể')],
    },
    // REVIEW-REQUIRED: only admins may set/update startDate; customers creating a plan through the API
    // get today in Vietnam time from the hook (a forged past startDate would reach graduation early).
    // Not admin.readOnly: owner/editor must be able to adjust it in the CMS (HB-05 spec).
    date('startDate', 'Ngày bắt đầu', {
      access: { create: isEditorOrOwner, update: isEditorOrOwner },
      admin: {
        description: 'Ngày bắt đầu hành trình (theo giờ Việt Nam, chỉ quản trị viên được sửa).',
      },
    }),
    {
      ...number('journeyDays', 'Số ngày hành trình'),
      // REVIEW-REQUIRED: only admins may set it; customers creating a plan through the API
      // get the site setting from the hook (a forged 1-day journey would earn a certificate).
      access: { create: isEditorOrOwner, update: isEditorOrOwner },
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
      // REVIEW-REQUIRED: written by the certificate check (overrideAccess); customers cannot set it.
      access: { create: isEditorOrOwner, update: isEditorOrOwner },
      admin: {
        readOnly: true,
        description:
          'Kết quả của hành trình thói quen: Đang thực hành / Đã hoàn thành / Đã trải nghiệm.',
      },
    },
  ],
}
