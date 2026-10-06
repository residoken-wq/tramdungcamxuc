import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { FAQ, type FAQProps } from '@/components/site/FAQ'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { FAQProps }

export const FAQBlock: ComponentConfig<FAQProps> = {
  label: 'Hỏi & Đáp thường gặp (FAQ Accordion)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    items: {
      type: 'array',
      label: 'Danh sách câu hỏi & trả lời',
      arrayFields: {
        question: {
          type: 'text',
          label: 'Câu hỏi',
        },
        answer: {
          type: 'textarea',
          label: 'Câu trả lời chi tiết',
        },
      },
      defaultItemProps: {
        question: '[MẪU] Câu hỏi thắc mắc mới?',
        answer: '[MẪU] Câu trả lời chi tiết, tận tâm và ấm áp từ Hana.',
      },
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
    seriesLabel: '[MẪU] Thắc mắc thường gặp',
    titleLine1: '[MẪU] CÂU HỎI THƯỜNG GẶP',
    titleLine2: '[MẪU] GIẢI ĐÁP BĂN KHOĂN',
    items: [
      {
        question: '[MẪU] Câu hỏi thường gặp 1',
        answer:
          '[MẪU] Nội dung giải đáp câu hỏi thường gặp một cách chi tiết và rõ ràng.',
      },
      {
        question: '[MẪU] Câu hỏi thường gặp 2',
        answer:
          '[MẪU] Nội dung giải đáp câu hỏi thường gặp một cách chi tiết và rõ ràng.',
      },
      {
        question: '[MẪU] Câu hỏi thường gặp 3',
        answer:
          '[MẪU] Nội dung giải đáp câu hỏi thường gặp một cách chi tiết và rõ ràng.',
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <FAQ {...props} />,
}
