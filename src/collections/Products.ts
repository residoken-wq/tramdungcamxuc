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
import { showFor } from '../lib/cms/product-form'

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
          admin: {
            condition: showFor([
              'digital_tool',
              'ebook',
              'toolkit',
              'package',
              'coaching_trial',
              'workshop',
              'community',
              'b2b',
            ]),
          },
          fields: [
            {
              ...number('price', 'Giá bán'),
              admin: {
                ...number('price', 'Giá bán').admin,
                condition: showFor([
                  'digital_tool',
                  'ebook',
                  'toolkit',
                  'package',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
              },
            },
            {
              ...number('salePrice', 'Giá ưu đãi'),
              admin: {
                ...number('salePrice', 'Giá ưu đãi').admin,
                condition: showFor(['digital_tool']),
              },
            },
            {
              ...date('saleEndsAt', 'Hạn ưu đãi'),
              admin: {
                ...date('saleEndsAt', 'Hạn ưu đãi').admin,
                condition: showFor(['digital_tool']),
              },
            },
            {
              ...number('trialDays', 'Số ngày dùng thử', 0),
              admin: {
                description: 'Nhập 0 nếu không dùng thử. Công cụ số thường dùng 21 ngày.',
                condition: showFor(['digital_tool']),
              },
            },
            {
              ...number('accessDurationDays', 'Số ngày sử dụng'),
              admin: {
                description: 'Để trống nếu sử dụng vĩnh viễn.',
                condition: showFor(['digital_tool']),
              },
            },
            {
              ...text('ctaLabel', 'Nhãn nút'),
              admin: {
                ...text('ctaLabel', 'Nhãn nút').admin,
                condition: showFor([
                  'digital_tool',
                  'ebook',
                  'toolkit',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
              },
            },
            {
              ...select('ctaType', 'Hành động của nút', [
                ['buy', 'Mua'],
                ['download', 'Tải tài liệu'],
                ['book', 'Đặt lịch'],
                ['contact', 'Liên hệ'],
                ['external', 'Mở liên kết ngoài'],
              ]),
              admin: {
                description: 'Chọn một mục phù hợp.',
                condition: showFor([
                  'digital_tool',
                  'ebook',
                  'toolkit',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
              },
            },
          ],
        },
        {
          label: 'Nội dung trang',
          admin: {
            condition: showFor([
              'digital_tool',
              'ebook',
              'toolkit',
              'package',
              'coaching_trial',
              'workshop',
              'community',
              'b2b',
            ]),
          },
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
              admin: {
                condition: showFor(['digital_tool', 'package']),
              },
              fields: [text('question', 'Câu hỏi', true), textarea('answer', 'Trả lời')],
            },
            relation('relatedProducts', 'Sản phẩm liên quan', 'products', true),
          ],
        },
        {
          label: 'Gói & quyền',
          admin: {
            condition: showFor(['package']),
          },
          fields: [
            {
              name: 'components',
              label: 'Cấu phần của gói',
              type: 'array',
              admin: {
                description: 'Tổng giá trị được tính từ số lượng nhân giá trị mỗi cấu phần.',
                condition: showFor(['package']),
              },
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
              admin: {
                readOnly: true,
                description: 'Tự tính từ các cấu phần, không nhập tay.',
                condition: showFor(['package']),
              },
            },
            {
              ...number('discountPercent', 'Ưu đãi (%)'),
              admin: {
                readOnly: true,
                description: 'Tự tính theo giá ưu đãi, hoặc giá bán nếu chưa có giá ưu đãi.',
                condition: showFor(['package']),
              },
            },
          ],
        },
        {
          label: 'Tài liệu giao',
          admin: {
            condition: showFor(['ebook', 'toolkit']),
          },
          fields: [
            // REVIEW-REQUIRED: Paid files remain admin-only until entitlement checks in T0-07.
            {
              name: 'files',
              label: 'Tài liệu được giao',
              type: 'array',
              access: { read: authenticated },
              admin: {
                description: 'Chỉ quản trị viên xem được. Quyền giao tài liệu sẽ bổ sung sau.',
                condition: showFor(['ebook', 'toolkit']),
              },
              fields: [privateFile('file', 'Tài liệu')],
            },
          ],
        },
        {
          label: 'Liên kết ngoài',
          admin: {
            condition: showFor([
              'physical_external',
              'coaching_trial',
              'workshop',
              'community',
              'b2b',
            ]),
          },
          fields: [
            {
              ...internalOrExternalUrl(
                'externalUrl',
                'Liên kết của nút (ngoài web hoặc trong web)',
              ),
              admin: {
                ...internalOrExternalUrl(
                  'externalUrl',
                  'Liên kết của nút (ngoài web hoặc trong web)',
                ).admin,
                condition: showFor([
                  'physical_external',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
              },
            },
            {
              ...text('externalLabel', 'Nhãn liên kết ngoài'),
              admin: {
                ...text('externalLabel', 'Nhãn liên kết ngoài').admin,
                condition: showFor([
                  'physical_external',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
              },
            },
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
