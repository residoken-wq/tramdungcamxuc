import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { date, number, relation } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
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

// REVIEW-REQUIRED: One progress row per customer and lesson (DB unique index + hook).
export const LessonProgress: CollectionConfig = {
  slug: 'lessonProgress',
  labels: { singular: 'Tiến độ bài học', plural: 'Tiến độ bài học' },
  admin: { group: vi.cms.nav.system, defaultColumns: ['customer', 'lesson', 'watchedPercent'] },
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
        keyField: 'customerLesson',
        parts: ['customer', 'lesson'],
        message: 'Đã có tiến độ cho bài học này của khách hàng.',
      }),
    ],
  },
  fields: [
    {
      ...relation('customer', 'Khách hàng', 'customers'),
      required: true,
      access: { update: isEditorOrOwner },
    },
    { ...relation('lesson', 'Bài học', 'lessons'), required: true },
    { ...number('watchedPercent', 'Đã xem (%)', 0), max: 100 },
    date('completedAt', 'Hoàn thành lúc'),
    uniqueKeyField('customerLesson'),
  ],
}
