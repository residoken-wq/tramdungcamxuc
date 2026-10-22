import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ServiceCardItem, type ServiceCardItemProps } from '@/components/site/ServiceCardItem'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'
import { createServiceExternalField } from '../service-field'
import { vi } from '@/lib/i18n/vi'

export type { ServiceCardItemProps as ServiceCardProps }

export const ServiceCardBlock: ComponentConfig<ServiceCardItemProps> = {
  label: vi.puckServiceCard?.label || 'Thẻ dịch vụ',
  permissions: {
    insert: false,
  },
  fields: {
    serviceId: createServiceExternalField({
      label: vi.puckServiceCard?.serviceId || 'Chọn dịch vụ đồng hành',
    }),
    highlight: {
      type: 'select',
      label: vi.puckServiceCard?.highlight || 'Dịch vụ nổi bật (Nền xanh thẫm Deep Navy)',
      options: [
        { label: 'Không (Mặc định)', value: false },
        { label: 'Có (Dịch vụ nổi bật - Nền Navy)', value: true },
      ],
    },
    nameColor: {
      type: 'select',
      label: vi.puckServiceCard?.nameColor || 'Màu tên dịch vụ',
      options: allowedTextColors('white', true),
    },
    nameSize: {
      type: 'select',
      label: vi.puckServiceCard?.nameSize || 'Cỡ tên dịch vụ',
      options: [...FONT_SIZE_OPTIONS],
    },
    textColor: {
      type: 'select',
      label: vi.puckServiceCard?.textColor || 'Màu nội dung mô tả',
      options: allowedTextColors('white', false),
    },
    textSize: {
      type: 'select',
      label: vi.puckServiceCard?.textSize || 'Cỡ nội dung mô tả',
      options: [...FONT_SIZE_OPTIONS],
    },
    align: {
      type: 'select',
      label: vi.puckServiceCard?.align || 'Căn lề',
      options: [...ALIGN_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    serviceId: '',
    highlight: false,
    nameColor: 'deep-navy',
    nameSize: 'md',
    textColor: 'deep-navy',
    textSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    const isHighlight = Boolean(data?.props?.highlight)
    const realBg = getChildRealBg(params?.parent, { highlight: isHighlight })
    const isNameLarge = true
    const nameColors = allowedTextColors(realBg, isNameLarge)
    const isTextLarge = data?.props?.textSize === 'lg'
    const textColors = allowedTextColors(realBg, isTextLarge)

    return {
      ...params.fields,
      nameColor: {
        type: 'select',
        label: vi.puckServiceCard?.nameColor || 'Màu tên dịch vụ',
        options: nameColors,
      },
      textColor: {
        type: 'select',
        label: vi.puckServiceCard?.textColor || 'Màu nội dung mô tả',
        options: textColors,
      },
    }
  },
  render: (props) => <ServiceCardItem {...props} />,
}
