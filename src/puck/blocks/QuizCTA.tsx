import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizCTA, type QuizCTAProps } from '@/components/site/QuizCTA'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { QuizCTAProps }

export const QuizCTABlock: ComponentConfig<QuizCTAProps> = {
  label: 'Kêu gọi Chẩn đoán Thói quen 5 phút (Quiz CTA)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    buttonText: { type: 'text', label: 'Chữ trên nút bắt đầu' },
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
    seriesLabel: '[MẪU] Thấu hiểu bản thân',
    titleLine1: '[MẪU] 5 PHÚT CHẨN ĐOÁN',
    titleLine2: '[MẪU] ĐIỂM NGHẼN THÓI QUEN',
    emotionLine:
      '[MẪU] Nhận diện nguyên nhân gốc rễ và bức tranh cảm xúc đang chi phối hành động của bạn.',
    buttonText: 'Bắt đầu chẩn đoán 5 phút',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <QuizCTA {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
