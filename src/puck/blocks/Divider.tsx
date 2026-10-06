import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Divider, type DividerProps, type DividerVariant } from '@/components/site/Divider'
import { BRAND_COLOR_OPTIONS } from '@/puck/config'

export type { DividerProps, DividerVariant }

export const DividerBlock: ComponentConfig<DividerProps> = {
  label: 'Đường phân cách (Divider)',
  fields: {
    variant: {
      type: 'select',
      label: 'Kiểu phân cách',
      options: [
        { label: 'Đường kẻ mảnh (Thin Line)', value: 'thin-line' },
        { label: 'Nét trái tim (Heart Line)', value: 'heart-line' },
      ],
    },
    spacing: {
      type: 'select',
      label: 'Khoảng cách trên/dưới',
      options: [
        { label: 'Nhỏ (16px)', value: 'sm' },
        { label: 'Vừa (24px)', value: 'md' },
        { label: 'Lớn (32px)', value: 'lg' },
      ],
    },
    align: {
      type: 'select',
      label: 'Căn lề',
      options: [
        { label: 'Căn giữa', value: 'center' },
        { label: 'Căn trái', value: 'left' },
        { label: 'Căn phải', value: 'right' },
      ],
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền',
      options: [...BRAND_COLOR_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    variant: 'thin-line',
    spacing: 'md',
    align: 'center',
    bgColor: 'warm-ivory',
  },
  render: (props) => <Divider {...props} />,
}
