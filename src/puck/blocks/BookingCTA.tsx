import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { BookingCTA, type BookingCTAProps } from '@/components/site/BookingCTA'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { BookingCTAProps }

export const BookingCTABlock: ComponentConfig<BookingCTAProps & { productId?: string | number }> = {
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
  render: ({ puck, ...props }) => (
    <BookingCTA {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
