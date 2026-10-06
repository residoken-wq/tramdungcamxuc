import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuoteBlock as UiQuoteBlock } from '@/components/ui/QuoteBlock'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export interface QuoteBlockProps {
  version?: number
  quote: string
  cite?: string
  roleOrContext?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

export const QuoteBlockConfig: ComponentConfig<QuoteBlockProps> = {
  label: 'Khối Trích dẫn cảm xúc (Quote Block)',
  fields: {
    quote: {
      type: 'textarea',
      label: 'Câu trích dẫn (Playfair Display Italic)',
    },
    cite: {
      type: 'text',
      label: 'Tác giả / Người nói (Tùy chọn)',
    },
    roleOrContext: {
      type: 'text',
      label: 'Vai trò / Ngữ cảnh (Tùy chọn)',
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
    quote:
      '[MẪU] Cảm xúc không phải là trở ngại cần vượt qua, mà là người bạn nhắc ta dừng lại và lắng nghe chính mình.',
    cite: '[MẪU] Hana Lương',
    roleOrContext: '[MẪU] Chuyên gia Khai vấn Cảm xúc ICF',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ quote, cite, roleOrContext, bgColor = 'warm-ivory', padding = 'md' }) => {
    const isDeepNavy = bgColor === 'deep-navy'

    return (
      <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-4xl">
          <UiQuoteBlock
            quote={quote}
            cite={cite}
            roleOrContext={roleOrContext}
            theme={isDeepNavy ? 'dark' : 'light'}
          />
        </div>
      </section>
    )
  },
}
