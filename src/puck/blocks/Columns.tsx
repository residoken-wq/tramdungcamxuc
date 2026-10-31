import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Columns, type ColumnsProps } from '@/components/site/Columns'
import { BRAND_COLOR_OPTIONS, ELEMENT_BLOCK_TYPES, PADDING_OPTIONS } from '../constants'

// No nested Columns or heroes. Card, Stat, ServiceCard and PackageCard may sit in a column
// (PK-05); the other child blocks only make sense inside their own parent.
const COLUMNS_DISALLOW = [
  'Columns',
  'HeroTwoEntries',
  'HeroImage',
  'Step',
  'FaqItem',
  'EntryCard',
  'PathCard',
  'VisionCard',
  // PK-13: a free section is itself a section; its elements only live inside it.
  'FreeSection',
  ...ELEMENT_BLOCK_TYPES,
]

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
      disallow: COLUMNS_DISALLOW,
    },
    col2: {
      type: 'slot',
      label: 'Nội dung Cột 2',
      disallow: COLUMNS_DISALLOW,
    },
    col3: {
      type: 'slot',
      label: 'Nội dung Cột 3 (khi chọn 3 cột)',
      disallow: COLUMNS_DISALLOW,
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
