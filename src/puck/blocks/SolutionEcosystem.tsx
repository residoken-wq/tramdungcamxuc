import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  SolutionEcosystem,
  type SolutionEcosystemProps,
} from '@/components/site/SolutionEcosystem'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'
import { createServiceExternalField } from '../service-field'
import { createProgramExternalField } from '../program-field'

export type { SolutionEcosystemProps }

export const SolutionEcosystemBlock: ComponentConfig<SolutionEcosystemProps> = {
  label: 'Hệ sinh thái giải pháp (Solution Ecosystem)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    description: { type: 'textarea', label: 'Mô tả ngắn gọn dưới tiêu đề' },

    col1Title: { type: 'text', label: 'Cột 1: Tiêu đề (Sản phẩm)' },
    col1Description: { type: 'textarea', label: 'Cột 1: Mô tả' },
    col1Products: {
      type: 'array',
      label: 'Cột 1: Danh sách sản phẩm',
      arrayFields: {
        productId: createProductExternalField({
          label: 'Chọn sản phẩm',
        }),
      },
      getItemSummary: (item) => (item?.productId ? `Sản phẩm ID: ${item.productId}` : 'Chưa chọn'),
    },

    col2Title: { type: 'text', label: 'Cột 2: Tiêu đề (Dịch vụ coaching 1:1 - Nền Deep Navy)' },
    col2Description: { type: 'textarea', label: 'Cột 2: Mô tả' },
    col2Services: {
      type: 'array',
      label: 'Cột 2: Danh sách dịch vụ đồng hành',
      arrayFields: {
        serviceId: createServiceExternalField({
          label: 'Chọn dịch vụ',
        }),
      },
      getItemSummary: (item) => (item?.serviceId ? `Dịch vụ ID: ${item.serviceId}` : 'Chưa chọn'),
    },

    col3Title: { type: 'text', label: 'Cột 3: Tiêu đề (Chương trình doanh nghiệp)' },
    col3Description: { type: 'textarea', label: 'Cột 3: Mô tả' },
    col3Programs: {
      type: 'array',
      label: 'Cột 3: Danh sách chương trình doanh nghiệp',
      arrayFields: {
        programId: createProgramExternalField({
          label: 'Chọn chương trình',
        }),
      },
      getItemSummary: (item) => (item?.programId ? `Chương trình ID: ${item.programId}` : 'Chưa chọn'),
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
    version: 1,
    seriesLabel: '[MẪU] Hệ sinh thái giải pháp',
    titleLine1: '[MẪU] ĐỒNG HÀNH TOÀN DIỆN',
    titleLine2: '[MẪU] TRÊN MỌI CHẶNG ĐƯỜNG',
    emotionLine: '[MẪU] Từ bước tự nhận thức đầu tiên đến sự chuyển hóa sâu sắc',
    description: '',
    col1Title: '[MẪU] Đào tạo cá nhân',
    col1Description: '[MẪU] Các công cụ số và lộ trình tự học',
    col1Products: [],
    col2Title: '[MẪU] Khai vấn 1:1',
    col2Description: '[MẪU] Đồng hành chuyên sâu cá nhân hóa',
    col2Services: [],
    col3Title: '[MẪU] Doanh nghiệp',
    col3Description: '[MẪU] Giải pháp phát triển văn hóa và đội ngũ',
    col3Programs: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <SolutionEcosystem {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
