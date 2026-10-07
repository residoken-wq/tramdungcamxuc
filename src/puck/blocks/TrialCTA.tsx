import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TrialCTA, type TrialCTAProps } from '@/components/site/TrialCTA'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { TrialCTAProps }

export const TrialCTABlock: ComponentConfig<TrialCTAProps> = {
  label: 'Kêu gọi dùng thử 21 ngày (Trial CTA)',
  fields: {
    productId: createProductExternalField({
      label: 'Chọn công cụ có chính sách dùng thử (trialDays > 0)',
    }),
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
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
    productId: '',
    seriesLabel: '[MẪU] Trải nghiệm miễn phí',
    titleLine1: '[MẪU] DÙNG THỬ 21 NGÀY',
    titleLine2: '[MẪU] KHÁM PHÁ TIỀM NĂNG',
    emotionLine: '[MẪU] Bắt đầu hành trình chuyển hóa thói quen và cảm xúc ngay hôm nay.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // Pass only serialisable props: Puck's `puck` object holds functions that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <TrialCTA {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
