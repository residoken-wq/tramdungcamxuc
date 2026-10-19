import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { NewsletterForm, type NewsletterFormProps } from '@/components/site/NewsletterForm'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { NewsletterFormProps }

export const NewsletterFormBlock: ComponentConfig<NewsletterFormProps> = {
  label: 'Đăng ký bản tin (Newsletter Form)',
  fields: {
    title: {
      type: 'text',
      label: 'Tiêu đề form',
    },
    description: {
      type: 'textarea',
      label: 'Mô tả ngắn (Chỉ hứa điều đang làm được)',
    },
    submitLabel: {
      type: 'text',
      label: 'Chữ trên nút gửi',
    },
    consentText: {
      type: 'text',
      label: 'Câu đồng ý nhận tin',
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
    title: '[MẪU] Nhận bản tin từ Trạm Dừng Cảm Xúc',
    description:
      '[MẪU] Những góc nhìn thực tiễn và bài tập thực hành được gửi trực tiếp đến hộp thư của bạn.',
    submitLabel: 'Đăng ký nhận tin',
    consentText: '[MẪU] Tôi đồng ý nhận email chia sẻ định kỳ từ Trạm Dừng Cảm Xúc theo',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // Isolate puck prop so no functions are passed to client components
  render: ({ puck, ...props }) => (
    <NewsletterForm {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
