import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { StatItem, type StatItemProps } from '@/components/site/StatItem'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'
import { vi } from '@/lib/i18n/vi'

export type { StatItemProps as StatProps }

export const StatBlock: ComponentConfig<StatItemProps> = {
  label: vi.puckStat?.label || 'Ô số liệu',
  permissions: {
    insert: false,
  },
  fields: {
    value: {
      type: 'text',
      label: vi.puckStat?.value || 'Con số / Chỉ số (Ví dụ: [MẪU] 500+)',
      contentEditable: true,
    },
    label: {
      type: 'text',
      label: vi.puckStat?.labelField || 'Nhãn mô tả ý nghĩa',
      contentEditable: true,
    },
    description: {
      type: 'text',
      label: vi.puckStat?.description || 'Mô tả phụ (Tùy chọn)',
      contentEditable: true,
    },
    icon: {
      type: 'select',
      label: vi.puckStat?.icon || 'Biểu tượng (Hiện thay cho số - Tùy chọn)',
      options: [
        { label: 'Không dùng biểu tượng', value: '' },
        ...BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
      ],
    },
    valueColor: {
      type: 'select',
      label: vi.puckStat?.valueColor || 'Màu con số',
      options: allowedTextColors('warm-ivory', true),
    },
    valueSize: {
      type: 'select',
      label: vi.puckStat?.valueSize || 'Cỡ con số',
      options: [...FONT_SIZE_OPTIONS],
    },
    labelColor: {
      type: 'select',
      label: vi.puckStat?.labelColor || 'Màu nhãn mô tả',
      options: allowedTextColors('warm-ivory', false),
    },
    labelSize: {
      type: 'select',
      label: vi.puckStat?.labelSize || 'Cỡ nhãn mô tả',
      options: [...FONT_SIZE_OPTIONS],
    },
    align: {
      type: 'select',
      label: vi.puckStat?.align || 'Căn lề',
      options: [...ALIGN_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    value: '[MẪU] 500+',
    label: '[MẪU] Nhãn mô tả',
    description: '',
    icon: '',
    valueColor: 'bright-magenta',
    valueSize: 'md',
    labelColor: 'deep-navy',
    labelSize: 'md',
    align: 'center',
  },
  resolveFields: (data, params) => {
    const realBg = getChildRealBg(params?.parent)
    const valueColors = allowedTextColors(realBg, true)
    const isLabelLarge = data?.props?.labelSize === 'lg'
    const labelColors = allowedTextColors(realBg, isLabelLarge)

    return {
      ...params.fields,
      valueColor: {
        type: 'select',
        label: vi.puckStat?.valueColor || 'Màu con số',
        options: valueColors,
      },
      labelColor: {
        type: 'select',
        label: vi.puckStat?.labelColor || 'Màu nhãn mô tả',
        options: labelColors,
      },
    }
  },
  render: (props) => <StatItem {...props} />,
}
