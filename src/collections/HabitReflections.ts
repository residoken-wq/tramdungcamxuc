import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'
import { relation } from '../fields/content'
import { uniqueKeyField, uniqueKeyHook } from '../fields/unique-key'
import {
  adminOrSelfCustomer,
  isEditorOrOwner,
  isHiddenFromEditor,
  isOwner,
  selfCustomerOnlyField,
} from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Tự động gán customer từ phiên đăng nhập của khách hàng khi tạo mới
const bindCustomerOnCreate: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.user && req.user.collection === 'customers') {
    return {
      ...data,
      customer: req.user.id,
    }
  }
  return data
}

// REVIEW-REQUIRED: Kế hoạch phải thuộc đúng khách hàng thực hiện suy ngẫm
const verifyPlanOwnership: CollectionBeforeChangeHook = async ({ data, req }) => {
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
    throw new APIError(vi.hb12.errors.planNotFound, 404)
  }

  const planCustomerId =
    typeof plan.customer === 'object' && plan.customer !== null
      ? (plan.customer as { id: number }).id
      : Number(plan.customer)

  if (req.user && req.user.collection === 'customers') {
    if (planCustomerId !== req.user.id) {
      throw new APIError(vi.hb12.errors.planForbidden, 403)
    }
  } else if (data?.customer) {
    const docCustomerId =
      typeof data.customer === 'object' && data.customer !== null
        ? (data.customer as { id: number }).id
        : Number(data.customer)
    if (docCustomerId !== planCustomerId) {
      throw new APIError(vi.hb12.errors.planForbidden, 400)
    }
  } else if (!data?.customer && planCustomerId) {
    data.customer = planCustomerId
  }

  return data
}

// REVIEW-REQUIRED: Collection lưu trữ suy ngẫm cuối trạm của học viên (HB-12).
// Quyền truy cập nội dung answers được khóa chặt cho chính khách hàng qua selfCustomerOnlyField.
export const HabitReflections: CollectionConfig = {
  slug: 'habitReflections',
  labels: {
    singular: 'Bài suy ngẫm trạm',
    plural: 'Bài suy ngẫm trạm',
  },
  admin: {
    group: vi.cms.nav.system,
    hidden: isHiddenFromEditor,
    useAsTitle: 'reflectionKey',
    description: vi.hb12.reflectionDesc,
    defaultColumns: ['customer', 'plan', 'stationIndex', 'createdAt'],
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
      verifyPlanOwnership,
      uniqueKeyHook({
        keyField: 'reflectionKey',
        parts: ['plan', 'stationIndex'],
        message: vi.hb12.errors.alreadyReflected,
      }),
    ],
  },
  fields: [
    {
      ...relation('customer', 'Khách hàng', 'customers'),
      required: true,
      access: { update: isEditorOrOwner },
    },
    {
      ...relation('plan', 'Kế hoạch thói quen', 'habitPlans'),
      required: true,
      access: { update: isEditorOrOwner },
    },
    {
      name: 'stationIndex',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Chỉ số trạm (0-based: 0 cho Trạm 1, 1 cho Trạm 2...)',
      },
    },
    {
      name: 'answers',
      type: 'array',
      maxRows: 10,
      labels: {
        singular: 'Câu trả lời suy ngẫm',
        plural: 'Danh sách câu trả lời suy ngẫm',
      },
      // REVIEW-REQUIRED: Dữ liệu suy ngẫm là riêng tư tuyệt đối – chỉ chính khách hàng đọc / tạo / sửa
      access: {
        read: selfCustomerOnlyField,
        create: selfCustomerOnlyField,
        update: selfCustomerOnlyField,
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          admin: {
            description: 'Câu hỏi suy ngẫm được chụp lại tại thời điểm trả lời',
          },
        },
        {
          name: 'answer',
          type: 'textarea',
          maxLength: 1000,
          admin: {
            description: 'Câu trả lời của học viên (tối đa 1000 ký tự)',
          },
        },
      ],
    },
    uniqueKeyField('reflectionKey'),
  ],
}
