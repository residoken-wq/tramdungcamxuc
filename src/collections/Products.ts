import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import {
  contentCollection,
  date,
  image,
  lines,
  number,
  privateFile,
  relation,
  richText,
  saleStatus,
  select,
  slug,
  text,
  textarea,
  url,
} from '../fields/content'
import { authenticated } from '../lib/auth/access'
import { computePackageValue } from '../lib/pricing'

const computeValues: CollectionBeforeChangeHook = ({ data, originalDoc }) => ({
  ...data,
  ...computePackageValue({ ...originalDoc, ...data }),
})

export const Products: CollectionConfig = {
  ...contentCollection('products', 'Sản phẩm', 'Bán hàng', 'name', [
    text('name', 'Tên sản phẩm', true),
    slug(),
    select(
      'web',
      'Khu vực',
      [
        ['site', 'Trang chính'],
        ['habit', 'Thói quen'],
        ['eq', 'EQ Buddy'],
      ],
      { required: true },
    ),
    select(
      'type',
      'Loại sản phẩm',
      [
        ['ebook', 'Sách điện tử'],
        ['toolkit', 'Bộ tài nguyên'],
        ['digital_tool', 'Công cụ số'],
        ['physical_external', 'Sản phẩm trên Shopee'],
        ['workshop', 'Workshop'],
        ['community', 'Cộng đồng'],
        ['coaching_trial', 'Phiên trải nghiệm'],
        ['package', 'Gói đồng hành'],
        ['b2b', 'Doanh nghiệp'],
      ],
      { required: true },
    ),
    select('journeyStep', 'Bước hành trình', [
      ['pause', 'Dừng lại'],
      ['feel', 'Cảm nhận'],
      ['name', 'Gọi tên'],
      ['choose', 'Lựa chọn'],
      ['practice', 'Thực hành'],
    ]),
    lines('audience', 'Dành cho ai'),
    textarea('painPoint', 'Khó khăn'),
    textarea('outcome', 'Kết quả mong đợi'),
    textarea('shortDescription', 'Giới thiệu ngắn'),
    richText('description', 'Giới thiệu chi tiết'),
    lines('includes', 'Bao gồm'),
    image('preview', 'Ảnh xem trước'),
    number('price', 'Giá bán'),
    number('salePrice', 'Giá ưu đãi'),
    date('saleEndsAt', 'Hạn ưu đãi'),
    image('coverImage', 'Ảnh bìa'),
    // REVIEW-REQUIRED: Paid files remain admin-only until entitlement checks in T0-07.
    {
      name: 'files',
      label: 'Tài liệu được giao',
      type: 'array',
      access: { read: authenticated },
      admin: { description: 'Chỉ quản trị viên xem được. Quyền giao tài liệu sẽ bổ sung sau.' },
      fields: [privateFile('file', 'Tài liệu')],
    },
    text('ctaLabel', 'Nhãn nút'),
    select('ctaType', 'Hành động của nút', [
      ['buy', 'Mua'],
      ['download', 'Tải tài liệu'],
      ['book', 'Đặt lịch'],
      ['contact', 'Liên hệ'],
      ['external', 'Mở liên kết ngoài'],
    ]),
    {
      name: 'faq',
      label: 'Câu hỏi thường gặp',
      type: 'array',
      fields: [text('question', 'Câu hỏi', true), textarea('answer', 'Trả lời')],
    },
    saleStatus(),
    relation('relatedProducts', 'Sản phẩm liên quan', 'products', true),
    number('order', 'Thứ tự', 0),
    {
      ...number('trialDays', 'Số ngày dùng thử', 0),
      admin: { description: 'Nhập 0 nếu không dùng thử. Công cụ số thường dùng 21 ngày.' },
    },
    {
      ...number('accessDurationDays', 'Số ngày sử dụng'),
      admin: { description: 'Để trống nếu sử dụng vĩnh viễn.' },
    },
    url('externalUrl', 'Liên kết bán bên ngoài'),
    text('externalLabel', 'Nhãn liên kết ngoài'),
    {
      name: 'components',
      label: 'Cấu phần của gói',
      type: 'array',
      admin: { description: 'Tổng giá trị được tính từ số lượng nhân giá trị mỗi cấu phần.' },
      fields: [
        text('label', 'Tên cấu phần', true),
        { ...number('quantity', 'Số lượng'), required: true },
        { ...number('unitValue', 'Giá trị mỗi đơn vị'), required: true },
        {
          ...number('retailPrice', 'Giá mua lẻ'),
          admin: { description: 'Chỉ để tham khảo, không dùng để tính tổng giá trị gói.' },
        },
        relation('grantsProduct', 'Sản phẩm được mở khóa', 'products'),
      ],
    },
    {
      ...number('totalValue', 'Tổng giá trị'),
      admin: { readOnly: true, description: 'Tự tính từ các cấu phần, không nhập tay.' },
    },
    {
      ...number('discountPercent', 'Ưu đãi (%)'),
      admin: {
        readOnly: true,
        description: 'Tự tính theo giá ưu đãi, hoặc giá bán nếu chưa có giá ưu đãi.',
      },
    },
  ]),
  hooks: { beforeChange: [computeValues] },
}
