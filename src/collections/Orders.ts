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
    return {
      ...data,
      paymentRef,
      payToken: data.createdByAdmin ? generatePayToken() : null,
      ...(editor ? { paymentStatus: 'pending', paidAt: null } : {}),
    }
  }
  const locked = {
    paymentRef: originalDoc?.paymentRef,
    payToken: originalDoc?.payToken,
    createdByAdmin: originalDoc?.createdByAdmin,
  }
  if (editor)
    return {
      ...data,
      ...locked,
      paymentStatus: originalDoc?.paymentStatus,
      paidAt: originalDoc?.paidAt,
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
      admin: { description: 'Chỉ chủ sở hữu được xác nhận thủ công hoặc hủy đơn.' },
    },
    select(
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
    { ...date('paidAt', 'Thanh toán lúc'), admin: { description: 'Chỉ chủ sở hữu được đặt.' } },
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
    textarea('notes', 'Ghi chú'),
  ],
}
