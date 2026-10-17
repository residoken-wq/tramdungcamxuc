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
  topicOptions,
  internalOrExternalUrl,
} from '../fields/content'
import { brandIconOptions } from '../lib/brand/icons'
import { authenticated } from '../lib/auth/access'
import { computePackageValue } from '../lib/pricing'
import { vi } from '../lib/i18n/vi'
import {
  showFor,
  validateCoverImageOnSale,
  validatePriceOnSale,
  validateSlugOnSale,
} from '../lib/cms/product-form'
import { collectionLivePreview } from '../lib/live-preview'

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
      {
        required: true,
        admin: {
          position: 'sidebar',
          description: vi.cms.productForm.sidebar.type,
        },
      },
    ),
    select(
      'web',
      'Khu vực',
      [
        ['site', 'Trang chính'],
        ['habit', 'Thói quen'],
        ['eq', 'EQ Buddy'],
      ],
      {
        required: true,
        admin: {
          position: 'sidebar',
          description: vi.cms.productForm.sidebar.web,
        },
      },
    ),
    saleStatus({
      admin: {
        position: 'sidebar',
        description: vi.cms.productForm.sidebar.saleStatus,
      },
    }),
    number('order', 'Thứ tự', 0, {
      admin: {
        position: 'sidebar',
        description: vi.cms.productForm.sidebar.order,
      },
    }),
    select('topic', 'Chủ đề', topicOptions, {
      admin: { position: 'sidebar', description: vi.cms.productForm.sidebar.topic },
    }),
    select(
      'audienceSegment',
      'Dành cho nhóm',
      [
        ['individual', 'Cá nhân'],
        ['business', 'Doanh nghiệp'],
      ],
      { admin: { position: 'sidebar', description: vi.cms.productForm.sidebar.audienceSegment } },
    ),

    // Tabs không tên (không đổi cấu trúc dữ liệu / schema)
    {
      type: 'tabs',
      tabs: [
        {
          label: vi.cms.productForm.tabs.basic,
          fields: [
            text('name', 'Tên sản phẩm', true, {
              admin: { description: vi.cms.productForm.descriptions.name },
            }),
            slug(false, {
              admin: { description: vi.cms.productForm.descriptions.slug },
              validate: validateSlugOnSale(false),
            }),
            image('coverImage', 'Ảnh bìa', {
              admin: { description: vi.cms.productForm.descriptions.coverImage },
              validate: validateCoverImageOnSale,
            }),
            textarea('shortDescription', 'Giới thiệu ngắn', {
              admin: { description: vi.cms.productForm.descriptions.shortDescription },
            }),
            text('tagline', 'Câu tóm tắt', false, {
              maxLength: 60,
              admin: { description: vi.cms.productForm.descriptions.tagline },
            }),
            select('icon', 'Biểu tượng', brandIconOptions, {
              admin: { description: vi.cms.productForm.descriptions.icon },
            }),
            select(
              'journeyStep',
              'Bước hành trình',
              [
                ['pause', 'Dừng lại'],
                ['feel', 'Cảm nhận'],
                ['name', 'Gọi tên'],
                ['choose', 'Lựa chọn'],
                ['practice', 'Thực hành'],
              ],
              {
                admin: { description: vi.cms.productForm.descriptions.journeyStep },
              },
            ),
            lines('audience', 'Dành cho ai', {
              admin: { description: vi.cms.productForm.descriptions.audience },
            }),
          ],
        },
        {
          label: vi.cms.productForm.tabs.pricing,
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
            number('price', 'Giá bán', undefined, {
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
                description: vi.cms.productForm.descriptions.price,
              },
              validate: validatePriceOnSale,
            }),
            number('salePrice', 'Giá ưu đãi', undefined, {
              admin: {
                condition: showFor(['digital_tool']),
                description: vi.cms.productForm.descriptions.salePrice,
              },
            }),
            date('saleEndsAt', 'Hạn ưu đãi', {
              admin: {
                condition: showFor(['digital_tool']),
                date: { pickerAppearance: 'dayAndTime' },
                description: vi.cms.productForm.descriptions.saleEndsAt,
              },
            }),
            number('trialDays', 'Số ngày dùng thử', 0, {
              admin: {
                condition: showFor(['digital_tool']),
                description: vi.cms.productForm.descriptions.trialDays,
              },
            }),
            number('accessDurationDays', 'Số ngày sử dụng', undefined, {
              admin: {
                condition: showFor(['digital_tool']),
                description: vi.cms.productForm.descriptions.accessDurationDays,
              },
            }),
            text('ctaLabel', 'Nhãn nút', false, {
              admin: {
                condition: showFor([
                  'digital_tool',
                  'ebook',
                  'toolkit',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
                description: vi.cms.productForm.descriptions.ctaLabel,
              },
            }),
            select(
              'ctaType',
              'Hành động của nút',
              [
                ['buy', 'Mua'],
                ['download', 'Tải tài liệu'],
                ['book', 'Đặt lịch'],
                ['contact', 'Liên hệ'],
                ['external', 'Mở liên kết ngoài'],
              ],
              {
                admin: {
                  condition: showFor([
                    'digital_tool',
                    'ebook',
                    'toolkit',
                    'coaching_trial',
                    'workshop',
                    'community',
                    'b2b',
                  ]),
                  description: vi.cms.productForm.descriptions.ctaType,
                },
              },
            ),
          ],
        },
        {
          label: vi.cms.productForm.tabs.content,
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
            textarea('painPoint', 'Khó khăn', {
              admin: { description: vi.cms.productForm.descriptions.painPoint },
            }),
            textarea('outcome', 'Kết quả mong đợi', {
              admin: { description: vi.cms.productForm.descriptions.outcome },
            }),
            richText('description', 'Giới thiệu chi tiết', {
              admin: { description: vi.cms.productForm.descriptions.description },
            }),
            lines('includes', 'Bao gồm', {
              admin: { description: vi.cms.productForm.descriptions.includes },
            }),
            image('preview', 'Ảnh xem trước', {
              admin: { description: vi.cms.productForm.descriptions.preview },
            }),
            {
              name: 'faq',
              label: 'Câu hỏi thường gặp',
              type: 'array',
              admin: {
                condition: showFor(['digital_tool', 'package']),
                description: vi.cms.productForm.descriptions.faq,
              },
              fields: [text('question', 'Câu hỏi', true), textarea('answer', 'Trả lời')],
            },
            relation('relatedProducts', 'Sản phẩm liên quan', 'products', true, {
              admin: { description: vi.cms.productForm.descriptions.relatedProducts },
            }),
          ],
        },
        {
          label: vi.cms.productForm.tabs.package,
          admin: {
            condition: showFor(['package']),
          },
          fields: [
            {
              name: 'components',
              label: 'Cấu phần của gói',
              type: 'array',
              admin: {
                condition: showFor(['package']),
                description: vi.cms.productForm.descriptions.components,
              },
              fields: [
                text('label', 'Tên cấu phần', true, {
                  admin: { description: vi.cms.productForm.descriptions.componentLabel },
                }),
                number('quantity', 'Số lượng', undefined, {
                  required: true,
                  admin: { description: vi.cms.productForm.descriptions.componentQuantity },
                }),
                number('unitValue', 'Giá trị mỗi đơn vị', undefined, {
                  required: true,
                  admin: { description: vi.cms.productForm.descriptions.componentUnitValue },
                }),
                number('retailPrice', 'Giá mua lẻ', undefined, {
                  admin: {
                    description: vi.cms.productForm.descriptions.componentRetailPrice,
                  },
                }),
                relation('grantsProduct', 'Sản phẩm được mở khóa', 'products', false, {
                  admin: {
                    description: vi.cms.productForm.descriptions.componentGrantsProduct,
                  },
                }),
              ],
            },
            number('totalValue', 'Tổng giá trị', undefined, {
              admin: {
                readOnly: true,
                condition: showFor(['package']),
                description: vi.cms.productForm.descriptions.totalValue,
                width: '50%',
              },
            }),
            number('discountPercent', 'Ưu đãi (%)', undefined, {
              admin: {
                readOnly: true,
                condition: showFor(['package']),
                description: vi.cms.productForm.descriptions.discountPercent,
                width: '50%',
              },
            }),
          ],
        },
        {
          label: vi.cms.productForm.tabs.files,
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
                condition: showFor(['ebook', 'toolkit']),
                description: vi.cms.productForm.descriptions.files,
              },
              fields: [privateFile('file', 'Tài liệu')],
            },
          ],
        },
        {
          label: vi.cms.productForm.tabs.links,
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
            internalOrExternalUrl('externalUrl', 'Liên kết của nút (ngoài web hoặc trong web)', {
              admin: {
                condition: showFor([
                  'physical_external',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
                description: vi.cms.productForm.descriptions.externalUrl,
              },
            }),
            text('externalLabel', 'Nhãn liên kết ngoài', false, {
              admin: {
                condition: showFor([
                  'physical_external',
                  'coaching_trial',
                  'workshop',
                  'community',
                  'b2b',
                ]),
                description: vi.cms.productForm.descriptions.externalLabel,
              },
            }),
          ],
        },
      ],
    },
  ]),
  hooks: { beforeChange: [computeValues] },
}

Products.admin = {
  ...Products.admin,
  description: vi.cms.productForm.collectionDescription,
  defaultColumns: ['name', 'type', 'saleStatus', 'price', 'updatedAt'],
  listSearchableFields: ['name', 'slug'],
  livePreview: collectionLivePreview('products'),
  components: {
    beforeListTable: ['@/components/admin/product-wizard/CreateProductButton#CreateProductButton'],
  },
}
