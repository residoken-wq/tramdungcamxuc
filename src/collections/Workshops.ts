import { contentCollection, date, relation, text, url } from '../fields/content'
import { authenticated } from '../lib/auth/access'

export const Workshops = contentCollection('workshops', 'Lịch workshop', 'Khóa học', 'title', [
  text('title', 'Tên workshop', true),
  relation('product', 'Sản phẩm workshop', 'products'),
  date('startsAt', 'Bắt đầu'),
  date('endsAt', 'Kết thúc'),
  // REVIEW-REQUIRED: Meeting URLs must remain private until audience entitlement checks exist.
  { ...url('joinUrl', 'Liên kết tham gia'), access: { read: authenticated } },
  relation('audienceProducts', 'Sản phẩm được tham gia', 'products', true),
])
