import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  LeadMagnetCarousel,
  type LeadMagnetCarouselProps,
  type LeadMagnetItem,
} from '@/components/site/LeadMagnetCarousel'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { LeadMagnetCarouselProps, LeadMagnetItem }

export const LeadMagnetCarouselBlock: ComponentConfig<LeadMagnetCarouselProps> = {
  label: 'Carousel Tài nguyên miễn phí (Lead Magnet Carousel)',
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
    mode: {
      type: 'select',
      label: 'Chế độ lấy tài nguyên',
      options: [
        { label: 'Tự động (theo thứ tự CMS, tối đa 12)', value: 'auto' },
        { label: 'Chọn tay từng sản phẩm (1–12)', value: 'manual' },
      ],
    },
    manualProducts: {
      type: 'array',
      label: 'Danh sách sản phẩm chọn tay (saleStatus = free & có files)',
      arrayFields: {
        productId: createProductExternalField({ label: 'Chọn tài nguyên' }),
      },
      getItemSummary: (item) => (item?.productId ? `Sản phẩm ID: ${item.productId}` : 'Chưa chọn'),
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
    seriesLabel: '[MẪU] TÀI NGUYÊN MIỄN PHÍ',
    titleLine1: '[MẪU] TÀI LIỆU CHUYỂN HÓA',
    titleLine2: '[MẪU] CẢM XÚC & THÓI QUEN',
    emotionLine:
      '[MẪU] Tải về miễn phí để bắt đầu hành trình thấu hiểu và chuyển mình mỗi ngày cùng Hana.',
    mode: 'auto',
    manualProducts: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // Isolate puck prop so no functions are passed to client components
  render: ({ puck, ...props }) => (
    <LeadMagnetCarousel {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
