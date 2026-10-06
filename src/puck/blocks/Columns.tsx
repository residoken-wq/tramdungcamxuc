import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Columns, type ColumnsProps } from '@/components/site/Columns'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '@/puck/config'

export type { ColumnsProps }

export const ColumnsBlock: ComponentConfig<ColumnsProps> = {
  label: 'Bố cục Cột (2 hoặc 3 Cột)',
  fields: {
    numColumns: {
      type: 'select',
      label: 'Số lượng cột',
      options: [
        { label: '2 cột', value: '2' },
        { label: '3 cột', value: '3' },
      ],
    },
    col1: {
      type: 'slot',
      label: 'Nội dung Cột 1',
      disallow: ['Columns', 'HeroTwoEntries', 'HeroImage'],
    },
    col2: {
      type: 'slot',
      label: 'Nội dung Cột 2',
      disallow: ['Columns', 'HeroTwoEntries', 'HeroImage'],
    },
    col3: {
      type: 'slot',
      label: 'Nội dung Cột 3 (khi chọn 3 cột)',
      disallow: ['Columns', 'HeroTwoEntries', 'HeroImage'],
    },
    gap: {
      type: 'select',
      label: 'Khoảng cách giữa các cột',
      options: [
        { label: 'Nhỏ (16px)', value: 'sm' },
        { label: 'Vừa (24px)', value: 'md' },
        { label: 'Lớn (32px)', value: 'lg' },
      ],
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
    numColumns: '2',
    gap: 'md',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <Columns {...props} />,
}
