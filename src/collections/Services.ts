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

export const Services = contentCollection('services', 'Dịch vụ đồng hành', 'Bán hàng', 'name', [
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
])
