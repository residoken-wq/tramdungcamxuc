import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TeamGrid, type TeamGridProps } from '@/components/site/TeamGrid'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { TeamGridProps }

export const TeamGridBlock: ComponentConfig<TeamGridProps> = {
  label: 'Lưới đội ngũ chuyên gia (Team Grid)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: 'Nhãn series (Tùy chọn)',
    },
    titleLine1: {
      type: 'text',
      label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
    },
    emotionLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc (Playfair Display Italic, tùy chọn)',
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
    seriesLabel: '[MẪU] ĐỘI NGŨ CHUYÊN GIA',
    titleLine1: '[MẪU] NHỮNG NGƯỜI ĐỒNG HÀNH',
    titleLine2: '[MẪU] CÙNG TRẠM DỪNG CẢM XÚC',
    emotionLine: '[MẪU] Tận tâm, thấu cảm và luôn sẵn sàng lắng nghe mọi trăn trở của bạn.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <TeamGrid {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
