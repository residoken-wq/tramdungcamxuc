import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { StatsBar, type StatsBarProps } from '@/components/site/StatsBar'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { StatsBarProps }

export const StatsBarBlock: ComponentConfig<StatsBarProps> = {
  label: 'Thanh Số liệu ấn tượng (Stats Bar)',
  fields: {
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Desktop)',
      options: [
        { label: '2 cột', value: 2 },
        { label: '3 cột', value: 3 },
        { label: '4 cột', value: 4 },
      ],
    },
    stats: {
      type: 'slot',
      label: 'Danh sách số liệu',
      allow: ['Stat'],
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
    version: 3,
    columns: 3,
    stats: [
      {
        type: 'Stat',
        props: {
          id: 'stat-default-1',
          value: '[MẪU] 500+',
          label: '[MẪU] Giờ khai vấn chuyên sâu',
          description: '',
          icon: '',
          valueColor: 'bright-magenta',
          valueSize: 'md',
          labelColor: 'deep-navy',
          labelSize: 'md',
          align: 'center',
        },
      },
      {
        type: 'Stat',
        props: {
          id: 'stat-default-2',
          value: '[MẪU] 10+',
          label: '[MẪU] Năm kinh nghiệm đồng hành',
          description: '',
          icon: '',
          valueColor: 'bright-magenta',
          valueSize: 'md',
          labelColor: 'deep-navy',
          labelSize: 'md',
          align: 'center',
        },
      },
      {
        type: 'Stat',
        props: {
          id: 'stat-default-3',
          value: '[MẪU] 1.000+',
          label: '[MẪU] Khách hàng chuyển hóa tích cực',
          description: '',
          icon: '',
          valueColor: 'bright-magenta',
          valueSize: 'md',
          labelColor: 'deep-navy',
          labelSize: 'md',
          align: 'center',
        },
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <StatsBar {...props} />,
}
