import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { checkbox, date, number, relation, select, textarea } from '../fields/content'
import {
  adminOrSelfCustomer,
  isAdminUser,
  isEditorOrOwner,
  isOwner,
  isOwnerUser,
} from '../lib/auth/access'
import { generatePayToken, generateUniquePaymentRef } from '../lib/payments/payment-ref'

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
  const editor = isAdminUser(req.user) && !isOwnerUser(req.user)
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

    // REVIEW-REQUIRED: Khóa tạo đơn qua REST (không có context.paymentAction === true):
    // - Bỏ payToken người gọi gửi và luôn sinh ngẫu nhiên phía server
    // - Ép deliveryStatus = 'none' (chống leo thang gán email_sent/access_granted)
    // - Ép paymentStatus = 'pending', paidAt = null nếu không có paymentAction hoặc là editor
    const enforcedPayToken = isPaymentAction
      ? (data.payToken ?? generatePayToken())
      : data.payToken || data.createdByAdmin
        ? generatePayToken()
        : null

    const enforcedDeliveryStatus = isPaymentAction ? (data.deliveryStatus ?? 'none') : 'none'

    return {
      ...data,
      paymentRef,
      payToken: enforcedPayToken,
      deliveryStatus: enforcedDeliveryStatus,
      ...(!isPaymentAction || editor ? { paymentStatus: 'pending', paidAt: null } : {}),
    }
  }
  // REVIEW-REQUIRED: Amounts and buyer are frozen once created, except an owner editing a
  // still-pending order. Otherwise the customer's QR amount or a paid order's history could change.
  const amountsEditable = !editor && originalDoc?.paymentStatus === 'pending'
  const locked = {
    paymentRef: originalDoc?.paymentRef,
    payToken: originalDoc?.payToken,
    createdByAdmin: originalDoc?.createdByAdmin,
    ...(amountsEditable
      ? {}
      : {
          customer: originalDoc?.customer,
          items: originalDoc?.items,
          subtotal: originalDoc?.subtotal,
          discountCode: originalDoc?.discountCode,
          total: originalDoc?.total,
        }),
  }

  // REVIEW-REQUIRED: Chặn sửa thẳng trạng thái đơn hàng (paymentStatus, paidAt, deliveryStatus).
  // Chỉ các hàm nghiệp vụ được ủy quyền (confirmManualPayment, cancelOrder, expirePendingOrders)
  // truyền context.paymentAction === true mới được phép cập nhật.
  if (editor || !isPaymentAction) {
    return {
      ...data,
      ...locked,
      paymentStatus: originalDoc?.paymentStatus,
      paidAt: originalDoc?.paidAt,
      deliveryStatus: originalDoc?.deliveryStatus,
    }
  }

  return { ...data, ...locked }
}

// No refund field and no shipping address by design (AGENTS.md mục 7, 14).
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Đơn hàng', plural: 'Đơn hàng' },
  admin: {
    group: 'Bán hàng',
    useAsTitle: 'paymentRef',
    defaultColumns: ['paymentRef', 'customer', 'total', 'paymentStatus', 'createdAt'],
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
    { ...relation('customer', 'Khách hàng', 'customers'), required: true },
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
      ...date('termsAcceptedAt', 'Đồng ý điều khoản lúc'),
      required: true,
      admin: {
        description: 'Thời điểm khách tick đồng ý Điều khoản và Chính sách giá – thanh toán.',
      },
    },
    checkbox('createdByAdmin', 'Hana tạo link thanh toán'),
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
