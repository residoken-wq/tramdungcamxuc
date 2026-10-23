import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ServiceCards, type ServiceCardsProps } from '@/components/site/ServiceCards'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { ServiceCardsProps }

export const ServiceCardsBlock: ComponentConfig<ServiceCardsProps> = {
  label: 'Các thẻ dịch vụ coaching (Service Cards)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: 'Nhãn series (Tùy chọn)',
    },
    titleLine1: {
      type: 'text',
      label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
    },
    emotionLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc (Playfair Display Italic, tùy chọn)',
    },
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Desktop)',
      options: [
        { label: '1 cột (Căn giữa)', value: 1 },
        { label: '2 cột', value: 2 },
        { label: '3 cột', value: 3 },
      ],
    },
    cards: {
      type: 'slot',
      label: 'Danh sách thẻ dịch vụ',
      allow: ['ServiceCard'],
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
    seriesLabel: '[MẪU] DỊCH VỤ ĐỒNG HÀNH',
    titleLine1: '[MẪU] CÁC LỘ TRÌNH',
    titleLine2: '[MẪU] COACHING 1:1',
    emotionLine: '[MẪU] Lắng nghe chính mình, kiến tạo chuyển hóa bền vững từ bên trong.',
    columns: 3,
    cards: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <ServiceCards {...props} />,
}
