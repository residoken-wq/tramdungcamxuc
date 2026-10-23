import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { FaqItemView, type FaqItemViewProps } from '@/components/site/FaqItemView'
import { FONT_SIZE_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'
import { vi } from '@/lib/i18n/vi'

export type { FaqItemViewProps as FaqItemProps }

export const FaqItemBlock: ComponentConfig<FaqItemViewProps> = {
  label: vi.puckFaqItem?.label || 'Câu hỏi',
  permissions: {
    insert: false,
  },
  fields: {
    question: {
      type: 'text',
      label: vi.puckFaqItem?.question || 'Câu hỏi thắc mắc',
      contentEditable: true,
    },
    answer: {
      type: 'textarea',
      label: vi.puckFaqItem?.answer || 'Nội dung trả lời chi tiết',
      contentEditable: true,
    },
    questionColor: {
      type: 'select',
      label: vi.puckFaqItem?.questionColor || 'Màu chữ câu hỏi',
      options: allowedTextColors('white', true),
    },
    questionSize: {
      type: 'select',
      label: vi.puckFaqItem?.questionSize || 'Cỡ chữ câu hỏi',
      options: [...FONT_SIZE_OPTIONS],
    },
    answerColor: {
      type: 'select',
      label: vi.puckFaqItem?.answerColor || 'Màu chữ câu trả lời',
      options: allowedTextColors('white', false),
    },
    answerSize: {
      type: 'select',
      label: vi.puckFaqItem?.answerSize || 'Cỡ chữ câu trả lời',
      options: [...FONT_SIZE_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    question: '[MẪU] Câu hỏi thắc mắc mới?',
    answer: '[MẪU] Câu trả lời chi tiết, tận tâm và ấm áp từ Trạm.',
    questionColor: 'deep-navy',
    questionSize: 'md',
    answerColor: 'deep-navy',
    answerSize: 'md',
  },
  resolveFields: (data, params) => {
    const cardRealBg = getChildRealBg(params?.parent)
    const isQuestionLarge = data?.props?.questionSize === 'lg'
    const questionColors = allowedTextColors(cardRealBg, isQuestionLarge)
    const isAnswerLarge = data?.props?.answerSize === 'lg'
    const answerColors = allowedTextColors(cardRealBg, isAnswerLarge)

    return {
      ...params.fields,
      questionColor: {
        type: 'select',
        label: vi.puckFaqItem?.questionColor || 'Màu chữ câu hỏi',
        options: questionColors,
      },
      answerColor: {
        type: 'select',
        label: vi.puckFaqItem?.answerColor || 'Màu chữ câu trả lời',
        options: answerColors,
      },
    }
  },
  render: ({ puck, ...props }) => (
    <FaqItemView {...props} puck={{ isEditing: Boolean(puck?.isEditing) }} />
  ),
}
