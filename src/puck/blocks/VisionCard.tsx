import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { VisionCardItem, type VisionCardItemProps } from '@/components/site/VisionCardItem'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'

export type { VisionCardItemProps as VisionCardProps }

function colorFields(realBg: string, titleLarge: boolean) {
  return {
    titleColor: {
      type: 'select' as const,
      label: 'Màu tiêu đề',
      options: allowedTextColors(realBg, titleLarge),
    },
    textColor: {
      type: 'select' as const,
      label: 'Màu nội dung',
      options: allowedTextColors(realBg, false),
    },
  }
}

/** Child block of VisionMission's `cards` slot (PK-09): one draggable vision / mission card. */
export const VisionCardBlock: ComponentConfig<VisionCardItemProps> = {
  label: 'Thẻ Tầm nhìn / Sứ mệnh',
  fields: {
    icon: {
      type: 'select',
      label: 'Biểu tượng',
      options: BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
    },
    title: { type: 'text', label: 'Tiêu đề thẻ', contentEditable: true },
    content: {
      type: 'textarea',
      label: 'Nội dung (các đoạn phân tách bằng 2 lần xuống dòng)',
      contentEditable: true,
    },
    ...colorFields('white', false),
    titleSize: { type: 'select', label: 'Cỡ chữ tiêu đề', options: [...FONT_SIZE_OPTIONS] },
    textSize: { type: 'select', label: 'Cỡ chữ nội dung', options: [...FONT_SIZE_OPTIONS] },
    align: { type: 'select', label: 'Căn lề', options: [...ALIGN_OPTIONS] },
  },
  defaultProps: {
    version: 1,
    icon: 'compass',
    title: '[MẪU] TIÊU ĐỀ THẺ',
    content: '[MẪU] Nội dung thẻ',
    titleColor: 'deep-navy',
    textColor: 'deep-navy',
    titleSize: 'md',
    textSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    // Cards sit on white (navy section → navy): offer only colours that pass WCAG AA there.
    const realBg = getChildRealBg(params?.parent, { cardStyle: 'white' })
    return { ...params.fields, ...colorFields(realBg, data.props?.titleSize === 'lg') }
  },
  render: ({ puck: _puck, ...props }) => <VisionCardItem {...props} />,
}
