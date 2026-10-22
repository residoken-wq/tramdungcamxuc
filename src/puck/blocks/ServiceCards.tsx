import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ServiceCards, type ServiceCardsProps } from '@/components/site/ServiceCards'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createServiceExternalField } from '../service-field'

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
    services: {
      type: 'array',
      label: 'Danh sách dịch vụ (1 – 3 dịch vụ)',
      arrayFields: {
        serviceId: createServiceExternalField({
          label: 'Chọn dịch vụ đồng hành',
        }),
      },
      getItemSummary: (item) => (item?.serviceId ? `Dịch vụ ID: ${item.serviceId}` : 'Chưa chọn'),
    },
    highlightServiceId: createServiceExternalField({
      label: 'Dịch vụ nổi bật (Thẻ nền Deep Navy, tùy chọn)',
    }),
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
    seriesLabel: '[MẪU] DỊCH VỤ ĐỒNG HÀNH',
    titleLine1: '[MẪU] CÁC LỘ TRÌNH',
    titleLine2: '[MẪU] COACHING 1:1',
    emotionLine: '[MẪU] Lắng nghe chính mình, kiến tạo chuyển hóa bền vững từ bên trong.',
    services: [],
    highlightServiceId: '',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <ServiceCards {...props} />,
}
