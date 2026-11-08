import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { StoryLead, type StoryLeadProps } from '@/components/site/StoryLead'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { StoryLeadProps }

export const StoryLeadBlock: ComponentConfig<StoryLeadProps> = {
  label: vi.pk28?.storyLead?.label || 'Khối câu chuyện dẫn dắt (Story Lead)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc nghiêng (Playfair Display)' },
    content: { type: 'textarea', label: 'Nội dung đoạn văn' },
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
    seriesLabel: '[MẪU] 01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI',
    titleLine1: '[MẪU] Chuyển mình là hành trình khó khăn',
    titleLine2: '[MẪU] bạn luôn cần đi qua để trưởng thành.',
    emotionLine: '[MẪU] Nhưng bạn hoàn toàn có thể đi qua nó mà KHÔNG CHÊNH VÊNH.',
    content:
      '[MẪU] Chương trình đồng hành cùng phụ nữ công sở xây ba nền tảng — hành động bền bỉ, cảm xúc vững vàng, giao tiếp hài hòa — để mỗi bước chuyển trong sự nghiệp được đi trên một nền đủ vững và bình an hơn trong nội tâm.',
    bgColor: 'lavender-mist',
    padding: 'lg',
  },
  render: (props) => <StoryLead {...props} />,
}
