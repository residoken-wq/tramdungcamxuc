import { detailLivePreview } from '@/lib/live-preview'
import {
  contentCollection,
  lines,
  number,
  relation,
  saleStatus,
  select,
  slug,
  text,
  url,
} from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const Services = contentCollection(
  'services',
  'Dịch vụ đồng hành',
  vi.cms.nav.commerce,
  'name',
  [
    text('name', 'Tên dịch vụ', true),
    slug(),
    text('audience', 'Dành cho ai'),
    lines('situations', 'Tình huống phù hợp'),
    lines('outcomes', 'Kết quả mong đợi'),
    lines('process', 'Quy trình'),
    text('duration', 'Thời lượng'),
    text('format', 'Hình thức'),
    select(
      'priceMode',
      'Cách báo giá',
      [
        ['fixed', 'Giá cố định'],
        ['quote', 'Báo giá riêng'],
      ],
      { defaultValue: 'quote' },
    ),
    number('price', 'Giá dịch vụ'),
    url('bookingUrl', 'Liên kết đặt lịch'),
    relation('testimonials', 'Lời chia sẻ', 'testimonials', true),
    text('ctaLabel', 'Nhãn nút'),
    saleStatus(),
  ],
)

Services.admin = {
  ...Services.admin,
  description: 'Dịch vụ coaching 1:1 và các gói đồng hành chuyên sâu cá nhân.',
  defaultColumns: ['name', 'priceMode', 'price', 'saleStatus', 'updatedAt'],
  listSearchableFields: ['name', 'slug'],
  livePreview: detailLivePreview('services'),
}
