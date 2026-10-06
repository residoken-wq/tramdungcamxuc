import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { StatsBar, type StatsBarProps } from '@/components/site/StatsBar'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { StatsBarProps }

export const StatsBarBlock: ComponentConfig<StatsBarProps> = {
  label: 'Thanh Số liệu ấn tượng (Stats Bar)',
  fields: {
    stats: {
      type: 'array',
      label: 'Danh sách số liệu (2 – 4 ô)',
      arrayFields: {
        value: {
          type: 'text',
          label: 'Con số / Chỉ số (Ví dụ: [MẪU] 500+)',
        },
        label: {
          type: 'text',
          label: 'Nhãn mô tả ý nghĩa',
        },
      },
      defaultItemProps: {
        value: '[MẪU] Số liệu',
        label: '[MẪU] Nhãn mô tả số liệu',
      },
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
    stats: [
      { value: '[MẪU] Số liệu 1', label: '[MẪU] Nhãn mô tả 1' },
      { value: '[MẪU] Số liệu 2', label: '[MẪU] Nhãn mô tả 2' },
      { value: '[MẪU] Số liệu 3', label: '[MẪU] Nhãn mô tả 3' },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <StatsBar {...props} />,
}
