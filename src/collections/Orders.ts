import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'
import { checkbox, date, number, relation, select, textarea } from '../fields/content'
import {
  adminOrSelfCustomer,
  isAdminUser,
  isEditorOrOwner,
  isOwner,
  isOwnerUser,
  nobody,
} from '../lib/auth/access'
import { generatePayToken, generateUniquePaymentRef } from '../lib/payments/payment-ref'
import { getEffectivePrice } from '../lib/products'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Server-owned order fields, enforced in one place:
// - paymentRef (TDCX + 5 chars) and payToken are generated on create and never change;
// - an editor can neither set nor change paymentStatus / paidAt / createdByAdmin. Only an
//   owner, or server code running without a user (verified webhook, GĐ 2), may do that.
const protectOrderFields: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const isOwner = isOwnerUser(req.user)
  const editor = isAdminUser(req.user) && !isOwner
  const isPaymentAction = req.context?.paymentAction === true

  if (operation === 'create') {
    const paymentRef = await generateUniquePaymentRef(async (ref) => {
      const { totalDocs } = await req.payload.count({
        collection: 'orders',
        where: { paymentRef: { equals: ref } },
        req,
        overrideAccess: true,
      })
      return totalDocs > 0
    })

    // REVIEW-REQUIRED: Chỉ owner được tạo đơn có createdByAdmin = true; editor gửi createdByAdmin = true -> ép false
    const isEditor = isAdminUser(req.user) && !isOwnerUser(req.user)
    const createdByAdmin = isEditor ? false : Boolean(data.createdByAdmin)

    let calculatedItems = data.items
    let calculatedSubtotal =
      data.subtotal ??
      (Array.isArray(data.items)
        ? data.items.reduce(
            (s: number, i: { price?: number | null; quantity?: number | null }) =>
              s + (i.price || 0) * (i.quantity || 1),
            0,
          )
        : undefined)
    let calculatedTotal = data.total ?? calculatedSubtotal
    let trialCreditOrderId: number | null = null
    let notes = data.notes

    // REVIEW-REQUIRED: Bắt buộc chọn khách hàng khi tạo đơn, trừ khi đơn đã được đánh dấu ẩn danh.
    const isAnonymized = Boolean(data.anonymizedAt)
    if (!data.customer && !isAnonymized) {
      throw new ValidationError(
        {
          errors: [{ path: 'customer', message: 'Vui lòng chọn khách hàng cho đơn hàng.' }],
          req,
        },
        req?.t,
      )
    }

    // REVIEW-REQUIRED: Khi owner tạo đơn createdByAdmin: chọn khách + đúng 1 gói đồng hành đã published.
    // Server tự tính items[0].price, subtotal, total từ getEffectivePrice (bỏ qua số Hana gõ).
    // Nếu trialCreditApplies bật và khách có đơn coaching_trial đã paid chưa được trừ -> trừ đúng số tiền đơn đó,
    // ghi chú vào notes (không âm, không trừ 2 lần - đánh dấu qua trialCreditOrder).
    if (createdByAdmin) {
      if (!data.customer) {
        throw new ValidationError(
          {
            errors: [{ path: 'customer', message: 'Vui lòng chọn khách hàng cho đơn hàng.' }],
            req,
          },
          req?.t,
        )
      }

      if (!Array.isArray(data.items) || data.items.length !== 1 || !data.items[0]?.product) {
        throw new ValidationError(
          {
            errors: [
              {
                path: 'items',
                message: 'Đơn hàng do Hana tạo phải chọn đúng một sản phẩm gói đồng hành.',
              },
            ],
            req,
          },
          req?.t,
        )
      }

      const rawProduct = data.items[0].product
      const productId =
        typeof rawProduct === 'object' && rawProduct !== null
          ? (rawProduct as { id: number }).id
          : Number(rawProduct)

      const product = await req.payload.findByID({
        collection: 'products',
        id: productId,
        req,
        overrideAccess: true,
      })

      if (!product) {
        throw new ValidationError(
          {
            errors: [
              {
                path: 'items',
                message: 'Không tìm thấy sản phẩm được chọn.',
              },
            ],
            req,
          },
          req?.t,
        )
      }

      if (
        product.type !== 'package' ||
        product._status !== 'published' ||
        product.saleStatus === 'hidden'
      ) {
        throw new ValidationError(
          {
            errors: [
              {
                path: 'items',
                message: 'Đơn do Hana tạo phải chọn một gói đồng hành đã xuất bản và không ẩn.',
              },
            ],
            req,
          },
          req?.t,
        )
      }

      const now = new Date()
      const effective = getEffectivePrice(product, now)
      const itemPrice = effective.salePrice ?? effective.price
      if (itemPrice == null || itemPrice <= 0) {
        throw new ValidationError(
          {
            errors: [{ path: 'items', message: 'Giá sản phẩm không hợp lệ.' }],
            req,
          },
          req?.t,
        )
      }

      calculatedSubtotal = itemPrice
      calculatedTotal = itemPrice
      calculatedItems = [{ product: product.id, price: itemPrice }]

      if (product.type === 'package') {
        const packagePrice = itemPrice
        const siteSettings = await req.payload.findGlobal({
          slug: 'siteSettings',
          req,
          overrideAccess: true,
        })

        if (siteSettings?.trialCreditApplies === true) {
          const customerId =
            typeof data.customer === 'object' && data.customer !== null
              ? (data.customer as { id: number }).id
              : Number(data.customer)

          const paidOrders = await req.payload.find({
            collection: 'orders',
            where: {
              and: [{ customer: { equals: customerId } }, { paymentStatus: { equals: 'paid' } }],
            },
            req,
            overrideAccess: true,
            depth: 1,
            sort: 'createdAt',
          })

          for (const candidate of paidOrders.docs) {
            let hasCoachingTrial = false
            if (Array.isArray(candidate.items)) {
              for (const item of candidate.items) {
                const p = item.product
                if (
                  typeof p === 'object' &&
                  p !== null &&
                  (p as { type?: string }).type === 'coaching_trial'
                ) {
                  hasCoachingTrial = true
                  break
                }
                const pId = typeof p === 'number' || typeof p === 'string' ? Number(p) : null
                if (pId) {
                  const fetched = await req.payload.findByID({
                    collection: 'products',
                    id: pId,
                    depth: 0,
                    req,
                    overrideAccess: true,
                  })
                  if (fetched?.type === 'coaching_trial') {
                    hasCoachingTrial = true
                    break
                  }
                }
              }
            }

            if (hasCoachingTrial) {
              const alreadyCredited = await req.payload.find({
                collection: 'orders',
                where: { trialCreditOrder: { equals: candidate.id } },
                limit: 1,
                req,
                overrideAccess: true,
              })

              if (alreadyCredited.totalDocs === 0) {
                trialCreditOrderId = candidate.id
                const creditAmount = candidate.total || 0
                calculatedTotal = Math.max(0, packagePrice - creditAmount)
                const formattedCredit = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(creditAmount)
                const creditNoteText = `Đã trừ phí trải nghiệm ${formattedCredit} từ đơn ${candidate.paymentRef || candidate.id}.`
                notes = notes ? `${notes}\n${creditNoteText}` : creditNoteText
                break
              }
            }
          }
        }
      }
    }

    // REVIEW-REQUIRED: Khóa tạo đơn qua REST (không có context.paymentAction === true):
    // - Bỏ payToken người gọi gửi và luôn sinh ngẫu nhiên phía server
    // - Ép deliveryStatus = 'none' (chống leo thang gán email_sent/access_granted)
    // - Ép paymentStatus = 'pending', paidAt = null nếu không có paymentAction hoặc là editor
    const enforcedPayToken = isPaymentAction
      ? (data.payToken ?? generatePayToken())
      : data.payToken || createdByAdmin
        ? generatePayToken()
        : null

    const enforcedDeliveryStatus = isPaymentAction ? (data.deliveryStatus ?? 'none') : 'none'

    return {
      ...data,
      items: calculatedItems,
      subtotal: calculatedSubtotal,
      total: calculatedTotal,
      notes,
      paymentRef,
      payToken: enforcedPayToken,
      createdByAdmin,
      deliveryStatus: enforcedDeliveryStatus,
      termsAcceptedAt: createdByAdmin ? null : data.termsAcceptedAt,
      trialCreditOrder: trialCreditOrderId,
      ...(!isPaymentAction || editor ? { paymentStatus: 'pending', paidAt: null } : {}),
    }
  }

  // REVIEW-REQUIRED: Bắt buộc chọn khách hàng khi sửa đơn, trừ khi đơn đã ẩn danh hoặc đang được ẩn danh.
  const isAnonymizingNow = Boolean(data.anonymizedAt)
  const isAlreadyAnonymized = Boolean(originalDoc?.anonymizedAt)
  const isAnonymized = isAnonymizingNow || isAlreadyAnonymized

  // REVIEW-REQUIRED: Đơn đã ẩn danh không thể gán lại khách hàng.
  if (isAlreadyAnonymized && data.customer) {
    throw new ValidationError(
      {
        errors: [
          { path: 'customer', message: 'Không thể gán lại khách hàng cho đơn hàng đã ẩn danh.' },
        ],
        req,
      },
      req?.t,
    )
  }

  if (!isAnonymized) {
    const resultingCustomer = data.customer !== undefined ? data.customer : originalDoc?.customer
    if (!resultingCustomer) {
      throw new ValidationError(
        {
          errors: [{ path: 'customer', message: 'Vui lòng chọn khách hàng cho đơn hàng.' }],
          req,
        },
        req?.t,
      )
    }
  }

  // REVIEW-REQUIRED: Amounts and buyer are frozen once created, except an owner editing a
  // still-pending order. Otherwise the customer's QR amount or a paid order's history could change.
  // Khi đơn được ẩn danh, customer chuyển thành null vĩnh viễn.
  const amountsEditable = !editor && originalDoc?.paymentStatus === 'pending'
  const lockedCustomer = isAnonymized ? null : originalDoc?.customer
  const locked = {
    paymentRef: originalDoc?.paymentRef,
    payToken: originalDoc?.payToken,
    createdByAdmin: originalDoc?.createdByAdmin,
    trialCreditOrder: originalDoc?.trialCreditOrder,
    ...(amountsEditable
      ? isAnonymized
        ? { customer: null }
        : {}
      : {
          customer: lockedCustomer,
          items: originalDoc?.items,
          subtotal: originalDoc?.subtotal,
          discountCode: originalDoc?.discountCode,
          total: originalDoc?.total,
        }),
  }

  const anonymizedAtValue = isAlreadyAnonymized
    ? originalDoc.anonymizedAt
    : (data.anonymizedAt ?? null)

  // REVIEW-REQUIRED: Chặn sửa thẳng trạng thái đơn hàng (paymentStatus, paidAt, deliveryStatus).
  // Chỉ các hàm nghiệp vụ được ủy quyền (confirmManualPayment, cancelOrder, expirePendingOrders)
  // truyền context.paymentAction === true mới được phép cập nhật.
  if (editor || !isPaymentAction) {
    return {
      ...data,
      ...locked,
      anonymizedAt: anonymizedAtValue,
      paymentStatus: originalDoc?.paymentStatus,
      paidAt: originalDoc?.paidAt,
      deliveryStatus: originalDoc?.deliveryStatus,
    }
  }

  return { ...data, ...locked, anonymizedAt: anonymizedAtValue }
}

// No refund field and no shipping address by design (AGENTS.md mục 7, 14).
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Đơn hàng', plural: 'Đơn hàng' },
  admin: {
    group: vi.cms.nav.commerce,
    useAsTitle: 'paymentRef',
    description: 'Quản lý đơn hàng, tra cứu mã chuyển khoản và đối soát thanh toán.',
    defaultColumns: ['paymentRef', 'customer', 'total', 'paymentStatus', 'createdAt'],
    listSearchableFields: ['paymentRef'],
  },
  // REVIEW-REQUIRED: Editors may create and annotate orders but never delete them or change
  // payment status; only an owner (or a verified webhook via server code) marks an order paid.
  access: {
    read: adminOrSelfCustomer(),
    create: isEditorOrOwner,
    update: isEditorOrOwner,
    delete: isOwner,
  },
  hooks: { beforeChange: [protectOrderFields] },
  fields: [
    relation('customer', 'Khách hàng', 'customers'),
    {
      name: 'items',
      label: 'Sản phẩm trong đơn',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        { ...relation('product', 'Sản phẩm', 'products'), required: true },
        { ...number('price', 'Giá tại thời điểm mua'), required: true },
      ],
    },
    number('subtotal', 'Tạm tính'),
    relation('discountCode', 'Mã giảm giá', 'discountCodes'),
    { ...number('total', 'Tổng thanh toán'), required: true },
    {
      name: 'paymentRef',
      label: 'Mã chuyển khoản',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Tự sinh khi tạo đơn. Khách ghi mã này ở nội dung chuyển khoản.',
      },
    },
    {
      name: 'orderActions',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/OrderActions#OrderActions',
        },
      },
    },
    {
      name: 'paymentEventsList',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/OrderPaymentEvents#OrderPaymentEvents',
        },
      },
    },

    {
      ...select(
        'paymentStatus',
        'Trạng thái thanh toán',
        [
          ['pending', 'Chờ thanh toán'],
          ['paid', 'Đã thanh toán'],
          ['failed', 'Thất bại'],
          ['cancelled', 'Đã hủy'],
        ],
        { required: true, defaultValue: 'pending' },
      ),
      admin: {
        readOnly: true,
        description: 'Chỉ chủ sở hữu được xác nhận thủ công hoặc hủy đơn qua nút thao tác.',
      },
    },
    {
      ...select(
        'deliveryStatus',
        'Trạng thái giao',
        [
          ['none', 'Chưa giao'],
          ['access_granted', 'Đã mở quyền'],
          ['email_sent', 'Đã gửi email'],
          ['scheduled', 'Đã đặt lịch'],
        ],
        { defaultValue: 'none' },
      ),
      admin: {
        readOnly: true,
      },
    },
    {
      ...date('paidAt', 'Thanh toán lúc'),
      admin: {
        readOnly: true,
        description: 'Chỉ cập nhật khi chủ sở hữu xác nhận thanh toán thành công.',
      },
    },
    {
      ...date('anonymizedAt', 'Ẩn danh lúc'),
      admin: {
        readOnly: true,
        description: 'Thời điểm đơn hàng được ẩn danh khi khách hàng yêu cầu xóa dữ liệu.',
      },
      access: {
        create: nobody,
        update: nobody,
      },
    },
    {
      ...date('termsAcceptedAt', 'Đồng ý điều khoản lúc'),
      admin: {
        description: 'Thời điểm khách tick đồng ý Điều khoản và Chính sách giá – thanh toán.',
      },
    },
    checkbox('createdByAdmin', 'Hana tạo link thanh toán'),
    {
      ...relation('trialCreditOrder', 'Đơn trải nghiệm đã trừ', 'orders'),
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Đơn trải nghiệm đã dùng để trừ phí vào gói (chỉ trừ 1 lần).',
      },
    },
    {
      name: 'payToken',
      label: 'Mã link thanh toán',
      type: 'text',
      unique: true,
      index: true,
      access: { read: isEditorOrOwner },
      admin: { readOnly: true, description: 'Tự sinh cho link /thanh-toan/… khi Hana tạo đơn.' },
    },
    {
      name: 'customerNeed',
      label: 'Nhu cầu của khách',
      type: 'textarea',
      admin: { description: 'Nhu cầu hoặc mục tiêu khi đặt phiên trải nghiệm.' },
    },
    textarea('notes', 'Ghi chú'),
  ],
}
