import { contentCollection, date, relation, text, url } from '../fields/content'
import { authenticated } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'
import { collectionLivePreview } from '../lib/live-preview'

export const Workshops = contentCollection(
  'workshops',
  'Lịch workshop',
  vi.cms.nav.habit,
  'title',
  [
    text('title', 'Tên workshop', true),
    relation('product', 'Sản phẩm workshop', 'products'),
    date('startsAt', 'Bắt đầu'),
    date('endsAt', 'Kết thúc'),
    // REVIEW-REQUIRED: Meeting URLs must remain private until audience entitlement checks exist.
    { ...url('joinUrl', 'Liên kết tham gia'), access: { read: authenticated } },
    {
      ...relation('audienceProducts', 'Sản phẩm được tham gia', 'products', true),
      admin: {
        description: 'Khách đã mua các sản phẩm này sẽ thấy lịch và nhận email nhắc trước 24 giờ.',
      },
    },
  ],
)

Workshops.admin = {
  ...Workshops.admin,
  description: 'Lịch các buổi workshop trực tuyến đồng hành cùng học viên.',
  defaultColumns: ['title', 'product', 'startsAt', 'endsAt', 'updatedAt'],
  listSearchableFields: ['title'],
  livePreview: collectionLivePreview('workshops'),
  components: {
    beforeListTable: ['@/components/admin/workshop-wizard/CreateWorkshopButton#CreateWorkshopButton'],
  },
}
