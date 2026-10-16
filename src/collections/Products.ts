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
  internalOrExternalUrl,
} from '../fields/content'
import { authenticated } from '../lib/auth/access'
import { computePackageValue } from '../lib/pricing'
import { vi } from '../lib/i18n/vi'

const computeValues: CollectionBeforeChangeHook = ({ data, originalDoc }) => ({
  ...data,
  ...computePackageValue({ ...originalDoc, ...data }),
})

export const Products: CollectionConfig = {
  ...contentCollection('products', 'Sản phẩm', vi.cms.nav.commerce, 'name', [
    // Trường hiển thị ở cột Sidebar (admin.position: 'sidebar')
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
      { required: true, admin: { position: 'sidebar', description: 'Chọn một mục phù hợp.' } },
    ),
    select(
      'web',
      'Khu vực',
      [
        ['site', 'Trang chính'],
        ['habit', 'Thói quen'],
        ['eq', 'EQ Buddy'],
      ],
      { required: true, admin: { position: 'sidebar', description: 'Chọn một mục phù hợp.' } },
    ),
    saleStatus({ admin: { position: 'sidebar', description: 'Chọn một mục phù hợp.' } }),
    {
      ...number('order', 'Thứ tự', 0),
      admin: { position: 'sidebar', description: 'Nhập số không âm. Số nhỏ hơn đứng trước.' },
    },

    // Tabs không tên (không đổi cấu trúc dữ liệu / schema)
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Cơ bản',
          fields: [
            text('name', 'Tên sản phẩm', true),
            slug(),
            image('coverImage', 'Ảnh bìa'),
            textarea('shortDescription', 'Giới thiệu ngắn'),
            select('journeyStep', 'Bước hành trình', [
              ['pause', 'Dừng lại'],
              ['feel', 'Cảm nhận'],
              ['name', 'Gọi tên'],
              ['choose', 'Lựa chọn'],
              ['practice', 'Thực hành'],
            ]),
            lines('audience', 'Dành cho ai'),
          ],
        },
        {
          label: 'Giá & bán',
          fields: [
            number('price', 'Giá bán'),
            number('salePrice', 'Giá ưu đãi'),
            date('saleEndsAt', 'Hạn ưu đãi'),
            {
              ...number('trialDays', 'Số ngày dùng thử', 0),
              admin: { description: 'Nhập 0 nếu không dùng thử. Công cụ số thường dùng 21 ngày.' },
            },
            {
              ...number('accessDurationDays', 'Số ngày sử dụng'),
              admin: { description: 'Để trống nếu sử dụng vĩnh viễn.' },
            },
            text('ctaLabel', 'Nhãn nút'),
            select('ctaType', 'Hành động của nút', [
              ['buy', 'Mua'],
              ['download', 'Tải tài liệu'],
              ['book', 'Đặt lịch'],
              ['contact', 'Liên hệ'],
              ['external', 'Mở liên kết ngoài'],
            ]),
          ],
        },
        {
          label: 'Nội dung trang',
          fields: [
            textarea('painPoint', 'Khó khăn'),
            textarea('outcome', 'Kết quả mong đợi'),
            richText('description', 'Giới thiệu chi tiết'),
            lines('includes', 'Bao gồm'),
            image('preview', 'Ảnh xem trước'),
            {
              name: 'faq',
              label: 'Câu hỏi thường gặp',
              type: 'array',
              fields: [text('question', 'Câu hỏi', true), textarea('answer', 'Trả lời')],
            },
            relation('relatedProducts', 'Sản phẩm liên quan', 'products', true),
          ],
        },
        {
          label: 'Gói & quyền',
          fields: [
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
          ],
        },
        {
          label: 'Tài liệu giao',
          fields: [
            // REVIEW-REQUIRED: Paid files remain admin-only until entitlement checks in T0-07.
            {
              name: 'files',
              label: 'Tài liệu được giao',
              type: 'array',
              access: { read: authenticated },
              admin: { description: 'Chỉ quản trị viên xem được. Quyền giao tài liệu sẽ bổ sung sau.' },
              fields: [privateFile('file', 'Tài liệu')],
            },
          ],
        },
        {
          label: 'Liên kết ngoài',
          fields: [
            internalOrExternalUrl('externalUrl', 'Liên kết của nút (ngoài web hoặc trong web)'),
            text('externalLabel', 'Nhãn liên kết ngoài'),
          ],
        },
      ],
    },
  ]),
  hooks: { beforeChange: [computeValues] },
}

Products.admin = {
  ...Products.admin,
  description: 'Tất cả sản phẩm mở bán hoặc tặng: công cụ số, sách điện tử, gói đồng hành.',
  defaultColumns: ['name', 'type', 'saleStatus', 'price', 'updatedAt'],
  listSearchableFields: ['name', 'slug'],
}
