import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { SolutionEcosystem, type SolutionEcosystemProps } from '@/components/site/SolutionEcosystem'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { createProductExternalField } from '../product-field'
import { createServiceExternalField } from '../service-field'
import { createProgramExternalField } from '../program-field'

export type { SolutionEcosystemProps }

export const SolutionEcosystemBlock: ComponentConfig<SolutionEcosystemProps> = {
  label: 'Hệ sinh thái giải pháp (Solution Ecosystem)',
  fields: {
    layout: {
      type: 'select',
      label: 'Bố cục hiển thị',
      options: [
        { label: 'Dạng thẻ (Mặc định cho trang cũ)', value: 'cards' },
        { label: 'Theo nhóm (Thiết kế 2026)', value: 'groups' },
      ],
    },
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    description: { type: 'textarea', label: 'Mô tả ngắn gọn dưới tiêu đề' },

    col1Title: { type: 'text', label: 'Cột 1: Tiêu đề (Sản phẩm)' },
    col1Description: { type: 'textarea', label: 'Cột 1: Mô tả' },
    col1Icon: {
      type: 'select',
      label: 'Cột 1: Biểu tượng (Icon)',
      options: [
        { label: 'Không có icon', value: '' },
        ...BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
      ],
    },
    col1Accent: {
      type: 'select',
      label: 'Cột 1: Vạch màu trên đầu thẻ',
      options: [{ label: 'Không có vạch màu (None)', value: 'none' }, ...BRAND_COLOR_OPTIONS],
    },
    col1Groups: {
      type: 'array',
      label: 'Cột 1: Các nhóm sản phẩm (Bố cục Theo nhóm)',
      arrayFields: {
        badge: { type: 'text', label: 'Huy hiệu nhóm (Tùy chọn, VD: SIGNATURE PROGRAM)' },
        title: { type: 'text', label: 'Tiêu đề nhóm (Tùy chọn)' },
        frame: {
          type: 'select',
          label: 'Khung viền',
          options: [
            { label: 'Bình thường (Plain)', value: 'plain' },
            { label: 'Khung viền hồng (Outlined)', value: 'outlined' },
          ],
        },
        itemStyle: {
          type: 'select',
          label: 'Kiểu hiển thị mục',
          options: [
            { label: 'Dòng gọn (Row)', value: 'row' },
            { label: 'Thẻ con (Card)', value: 'card' },
          ],
        },
        buttonStyle: {
          type: 'select',
          label: 'Kiểu nút',
          options: [
            { label: 'Nút viền (Outline)', value: 'outline' },
            { label: 'Nút đặc (Filled)', value: 'filled' },
          ],
        },
        items: {
          type: 'array',
          label: 'Danh sách sản phẩm trong nhóm',
          arrayFields: {
            productId: createProductExternalField({
              label: 'Chọn sản phẩm',
            }),
            heading: { type: 'text', label: 'Tiêu đề dòng/thẻ (Tùy chọn)' },
            buttonText: { type: 'text', label: 'Chữ trên nút (Tùy chọn ghi đè)' },
          },
          getItemSummary: (it) =>
            it?.heading || (it?.productId ? `Sản phẩm ID: ${it.productId}` : 'Mục sản phẩm'),
        },
      },
      getItemSummary: (grp) => grp?.title || grp?.badge || 'Nhóm sản phẩm',
    },
    col1Products: {
      type: 'array',
      label: 'Cột 1: Danh sách sản phẩm (Bố cục Thẻ cũ)',
      arrayFields: {
        productId: createProductExternalField({
          label: 'Chọn sản phẩm',
        }),
      },
      getItemSummary: (item) => (item?.productId ? `Sản phẩm ID: ${item.productId}` : 'Chưa chọn'),
    },

    col2Title: { type: 'text', label: 'Cột 2: Tiêu đề (Dịch vụ coaching 1:1 - Nền Deep Navy)' },
    col2Description: { type: 'textarea', label: 'Cột 2: Mô tả' },
    col2Icon: {
      type: 'select',
      label: 'Cột 2: Biểu tượng (Icon)',
      options: [
        { label: 'Không có icon', value: '' },
        ...BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
      ],
    },
    col2Accent: {
      type: 'select',
      label: 'Cột 2: Vạch màu trên đầu thẻ',
      options: [{ label: 'Không có vạch màu (None)', value: 'none' }, ...BRAND_COLOR_OPTIONS],
    },
    col2Groups: {
      type: 'array',
      label: 'Cột 2: Các nhóm dịch vụ (Bố cục Theo nhóm)',
      arrayFields: {
        badge: { type: 'text', label: 'Huy hiệu nhóm (Tùy chọn)' },
        title: { type: 'text', label: 'Tiêu đề nhóm (Tùy chọn)' },
        frame: {
          type: 'select',
          label: 'Khung viền',
          options: [
            { label: 'Bình thường (Plain)', value: 'plain' },
            { label: 'Khung viền hồng (Outlined)', value: 'outlined' },
          ],
        },
        itemStyle: {
          type: 'select',
          label: 'Kiểu hiển thị mục',
          options: [
            { label: 'Thẻ con (Card)', value: 'card' },
            { label: 'Dòng gọn (Row)', value: 'row' },
          ],
        },
        buttonStyle: {
          type: 'select',
          label: 'Kiểu nút',
          options: [
            { label: 'Nút viền (Outline)', value: 'outline' },
            { label: 'Nút đặc (Filled)', value: 'filled' },
          ],
        },
        items: {
          type: 'array',
          label: 'Danh sách dịch vụ trong nhóm',
          arrayFields: {
            serviceId: createServiceExternalField({
              label: 'Chọn dịch vụ',
            }),
            heading: { type: 'text', label: 'Tiêu đề dòng/thẻ (Tùy chọn)' },
            buttonText: { type: 'text', label: 'Chữ trên nút (Tùy chọn ghi đè)' },
          },
          getItemSummary: (it) =>
            it?.heading || (it?.serviceId ? `Dịch vụ ID: ${it.serviceId}` : 'Mục dịch vụ'),
        },
      },
      getItemSummary: (grp) => grp?.title || grp?.badge || 'Nhóm dịch vụ',
    },
    col2Services: {
      type: 'array',
      label: 'Cột 2: Danh sách dịch vụ đồng hành (Bố cục Thẻ cũ)',
      arrayFields: {
        serviceId: createServiceExternalField({
          label: 'Chọn dịch vụ',
        }),
      },
      getItemSummary: (item) => (item?.serviceId ? `Dịch vụ ID: ${item.serviceId}` : 'Chưa chọn'),
    },

    col3Title: { type: 'text', label: 'Cột 3: Tiêu đề (Chương trình doanh nghiệp)' },
    col3Description: { type: 'textarea', label: 'Cột 3: Mô tả' },
    col3Icon: {
      type: 'select',
      label: 'Cột 3: Biểu tượng (Icon)',
      options: [
        { label: 'Không có icon', value: '' },
        ...BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
      ],
    },
    col3Accent: {
      type: 'select',
      label: 'Cột 3: Vạch màu trên đầu thẻ',
      options: [{ label: 'Không có vạch màu (None)', value: 'none' }, ...BRAND_COLOR_OPTIONS],
    },
    col3Groups: {
      type: 'array',
      label: 'Cột 3: Các nhóm chương trình (Bố cục Theo nhóm)',
      arrayFields: {
        badge: { type: 'text', label: 'Huy hiệu nhóm (Tùy chọn)' },
        title: { type: 'text', label: 'Tiêu đề nhóm (Tùy chọn)' },
        frame: {
          type: 'select',
          label: 'Khung viền',
          options: [
            { label: 'Bình thường (Plain)', value: 'plain' },
            { label: 'Khung viền hồng (Outlined)', value: 'outlined' },
          ],
        },
        itemStyle: {
          type: 'select',
          label: 'Kiểu hiển thị mục',
          options: [
            { label: 'Thẻ con (Card)', value: 'card' },
            { label: 'Dòng gọn (Row)', value: 'row' },
          ],
        },
        buttonStyle: {
          type: 'select',
          label: 'Kiểu nút',
          options: [
            { label: 'Nút viền (Outline)', value: 'outline' },
            { label: 'Nút đặc (Filled)', value: 'filled' },
          ],
        },
        items: {
          type: 'array',
          label: 'Danh sách chương trình trong nhóm',
          arrayFields: {
            programId: createProgramExternalField({
              label: 'Chọn chương trình',
            }),
            heading: { type: 'text', label: 'Tiêu đề dòng/thẻ (Tùy chọn)' },
            buttonText: { type: 'text', label: 'Chữ trên nút (Tùy chọn ghi đè)' },
          },
          getItemSummary: (it) =>
            it?.heading ||
            (it?.programId ? `Chương trình ID: ${it.programId}` : 'Mục chương trình'),
        },
      },
      getItemSummary: (grp) => grp?.title || grp?.badge || 'Nhóm chương trình',
    },
    col3Programs: {
      type: 'array',
      label: 'Cột 3: Danh sách chương trình doanh nghiệp (Bố cục Thẻ cũ)',
      arrayFields: {
        programId: createProgramExternalField({
          label: 'Chọn chương trình',
        }),
      },
      getItemSummary: (item) =>
        item?.programId ? `Chương trình ID: ${item.programId}` : 'Chưa chọn',
    },

    bgColor: {
      type: 'select',
      label: 'Màu nền',
      options: [...BRAND_COLOR_OPTIONS],
    },
    padding: {
      type: 'select',
      label: 'Khoảng đệm (Padding)',
      options: [...PADDING_OPTIONS],
    },
  },
  defaultProps: {
    version: 2,
    layout: 'cards',
    seriesLabel: '[MẪU] Hệ sinh thái giải pháp',
    titleLine1: '[MẪU] ĐỒNG HÀNH TOÀN DIỆN',
    titleLine2: '[MẪU] TRÊN MỌI CHẶNG ĐƯỜNG',
    emotionLine: '[MẪU] Từ bước tự nhận thức đầu tiên đến sự chuyển hóa sâu sắc',
    description: '',
    col1Title: '[MẪU] Đào tạo cá nhân',
    col1Description: '[MẪU] Các công cụ số và lộ trình tự học',
    col1Icon: '',
    col1Accent: 'accent-pink',
    col1Groups: [],
    col1Products: [],
    col2Title: '[MẪU] Khai vấn 1:1',
    col2Description: '[MẪU] Đồng hành chuyên sâu cá nhân hóa',
    col2Icon: '',
    col2Accent: 'none',
    col2Groups: [],
    col2Services: [],
    col3Title: '[MẪU] Doanh nghiệp',
    col3Description: '[MẪU] Giải pháp phát triển văn hóa và đội ngũ',
    col3Icon: '',
    col3Accent: 'deep-navy',
    col3Groups: [],
    col3Programs: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <SolutionEcosystem {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
