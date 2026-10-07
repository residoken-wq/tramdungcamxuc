import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TestimonialGrid, type TestimonialGridProps } from '@/components/site/TestimonialGrid'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createTestimonialExternalField } from '../testimonial-field'

export type { TestimonialGridProps }

export const TestimonialGridBlock: ComponentConfig<TestimonialGridProps> = {
  label: 'Lưới lời chia sẻ (Testimonial Grid)',
  fields: {
    mode: {
      type: 'select',
      label: 'Phương thức hiển thị',
      options: [
        { label: 'Chọn tay từng lời chia sẻ', value: 'manual' },
        { label: 'Mới nhất từ hệ thống', value: 'recent' },
      ],
    },
    manualTestimonials: {
      type: 'array',
      label: 'Danh sách lời chia sẻ chọn tay',
      arrayFields: {
        testimonialId: createTestimonialExternalField({ label: 'Chọn lời chia sẻ' }),
      },
      getItemSummary: (item) =>
        item?.testimonialId ? `Lời chia sẻ ID: ${item.testimonialId}` : 'Chưa chọn',
    },
    limit: {
      type: 'select',
      label: 'Số lượng tối đa (Theo mới nhất)',
      options: [
        { label: '3 lời chia sẻ', value: 3 },
        { label: '6 lời chia sẻ', value: 6 },
      ],
    },
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Máy tính)',
      options: [
        { label: '2 cột', value: 2 },
        { label: '3 cột', value: 3 },
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
    version: 1,
    mode: 'manual',
    manualTestimonials: [],
    limit: 6,
    columns: 3,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <TestimonialGrid {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
