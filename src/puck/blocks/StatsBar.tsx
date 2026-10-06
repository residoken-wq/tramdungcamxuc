import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { StatsBar, type StatsBarProps } from '@/components/site/StatsBar'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '@/puck/config'

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
        value: '[MẪU] 100+',
        label: '[MẪU] Khách hàng đồng hành',
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
      { value: '[MẪU] 500+', label: '[MẪU] Giờ khai vấn chuyên sâu' },
      { value: '[MẪU] 1.000+', label: '[MẪU] Học viên tham gia rèn luyện' },
      { value: '[MẪU] 21', label: '[MẪU] Ngày đồng hành chuyển hóa cảm xúc' },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <StatsBar {...props} />,
}
