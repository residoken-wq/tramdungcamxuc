import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuoteBlock as UiQuoteBlock } from '@/components/ui/QuoteBlock'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { alignField, sizeField } from '../format-fields'
import type { AlignOption, FontSizeOption } from '@/lib/brand/format-classes'

export interface QuoteBlockProps {
  version?: number
  quote: string
  cite?: string
  roleOrContext?: string
  tone?: 'light' | 'dark'
  quoteSize?: FontSizeOption
  align?: AlignOption
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
      contentEditable: true,
    },
    cite: {
      type: 'text',
      label: 'Tác giả / Người nói (Tùy chọn)',
    },
    roleOrContext: {
      type: 'text',
      label: 'Vai trò / Ngữ cảnh (Tùy chọn)',
    },
    quoteSize: sizeField('Cỡ chữ trích dẫn'),
    align: alignField(),
    tone: {
      type: 'select',
      label: 'Sắc thái giao diện (Tone)',
      options: [
        { label: 'Sáng (Mặc định)', value: 'light' },
        { label: 'Tối (Nền Deep Navy, chữ trắng)', value: 'dark' },
      ],
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
    version: 2,
    tone: 'light',
    quoteSize: 'md',
    align: 'left',
    quote: '[MẪU] Câu trích dẫn cảm xúc ấm áp và sâu sắc chạm đến người đọc.',
    cite: '[MẪU] Tên người nói',
    roleOrContext: '[MẪU] Vai trò / bối cảnh',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({
    quote,
    cite,
    roleOrContext,
    tone = 'light',
    quoteSize,
    align,
    bgColor = 'warm-ivory',
    padding = 'md',
  }) => {
    const isDark = tone === 'dark' || bgColor === 'deep-navy'
    const sectionBg = tone === 'dark' ? 'bg-deep-navy text-white' : BG_COLORS[bgColor]

    return (
      <section className={`w-full ${sectionBg} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-4xl">
          <UiQuoteBlock
            quote={quote}
            cite={cite}
            roleOrContext={roleOrContext}
            theme={isDark ? 'dark' : 'light'}
            size={quoteSize}
            align={align}
          />
        </div>
      </section>
    )
  },
}
