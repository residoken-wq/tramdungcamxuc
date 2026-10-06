import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Spacer, type SpacerProps, type SpacerHeight } from '@/components/site/Spacer'

export type { SpacerProps, SpacerHeight }

export const SPACER_HEIGHT_OPTIONS = [
  { label: '16px (Rất nhỏ)', value: 16 },
  { label: '24px (Nhỏ)', value: 24 },
  { label: '32px (Vừa)', value: 32 },
  { label: '48px (Lớn)', value: 48 },
  { label: '64px (Rất lớn)', value: 64 },
] as const

export const SpacerBlock: ComponentConfig<SpacerProps> = {
  label: 'Khoảng đệm (Spacer)',
  fields: {
    height: {
      type: 'select',
      label: 'Chiều cao khoảng trống (px)',
      options: [...SPACER_HEIGHT_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    height: 32,
  },
  render: (props) => <Spacer {...props} />,
}
