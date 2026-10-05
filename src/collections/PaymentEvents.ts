import type { CollectionConfig } from 'payload'
import { checkbox, date, relation, text } from '../fields/content'
import { isOwner, nobody } from '../lib/auth/access'

// REVIEW-REQUIRED: Append-only log of every payment webhook / manual confirmation.
// Owner reads; nobody edits or deletes through the API; server code writes.
export const PaymentEvents: CollectionConfig = {
  slug: 'paymentEvents',
  labels: { singular: 'Sự kiện thanh toán', plural: 'Sự kiện thanh toán' },
  admin: {
    group: 'Hệ thống',
    defaultColumns: ['provider', 'order', 'signatureValid', 'result', 'receivedAt'],
  },
  access: { read: isOwner, create: nobody, update: nobody, delete: nobody },
  fields: [
    relation('order', 'Đơn hàng', 'orders'),
    { ...text('provider', 'Cổng thanh toán', true) },
    { name: 'rawPayload', label: 'Dữ liệu gốc', type: 'json' },
    checkbox('signatureValid', 'Chữ ký hợp lệ'),
    text('result', 'Kết quả xử lý'),
    { ...date('receivedAt', 'Nhận lúc'), defaultValue: () => new Date().toISOString() },
  ],
}
