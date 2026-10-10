import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { BookingCTA, type BookingCTAProps } from '@/components/site/BookingCTA'
import type { PublicProduct } from '@/lib/products'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { BookingCTAProps }

export type BookingCTABlockProps = BookingCTAProps & {
  productId?: string | number
  // Filled server-side by resolvePuckData (src/puck/resolve.server.ts); never stored in puckData.
  _resolved?: { product?: PublicProduct | null }
}

export const BookingCTABlock: ComponentConfig<BookingCTABlockProps> = {
  label: 'Kêu gọi Đặt phiên trải nghiệm (Booking CTA)',
  fields: {
    productId: createProductExternalField({
      label: 'Chọn phiên trải nghiệm (loại coaching_trial)',
      filterType: 'coaching_trial',
    }),
    title: { type: 'text', label: 'Tiêu đề khối' },
    description: { type: 'textarea', label: 'Mô tả ngắn' },
    buttonLabel: { type: 'text', label: 'Chữ trên nút đặt phiên' },
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
    title: '[MẪU] Phiên trải nghiệm Growth Mirror',
    description:
      '[MẪU] Một phiên khai vấn cá nhân 1:1 giúp bạn nhìn nhận rõ nét cảm xúc và bức tranh hiện tại.',
    buttonLabel: 'Đặt phiên trải nghiệm',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // The resolved product carries the numeric id the booking page needs (?san-pham=<id>) and the
  // price; without it the button linked to /dat-phien-trai-nghiem with no product → 404.
  render: ({ puck, _resolved, ...props }) => (
    <BookingCTA
      {...props}
      product={_resolved?.product ?? null}
      puck={{ isEditing: puck?.isEditing ?? false }}
    />
  ),
}
