import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TestimonialSlider, type TestimonialSliderProps } from '@/components/site/TestimonialSlider'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createTestimonialExternalField } from '../testimonial-field'

export type { TestimonialSliderProps }

export const TestimonialSliderBlock: ComponentConfig<TestimonialSliderProps> = {
  label: 'Thanh trượt lời chia sẻ (Testimonial Slider)',
  fields: {
    manualTestimonials: {
      type: 'array',
      label: 'Danh sách lời chia sẻ (2–8 mục)',
      arrayFields: {
        testimonialId: createTestimonialExternalField({ label: 'Chọn lời chia sẻ' }),
      },
      getItemSummary: (item) =>
        item?.testimonialId ? `Lời chia sẻ ID: ${item.testimonialId}` : 'Chưa chọn',
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
    manualTestimonials: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <TestimonialSlider {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
