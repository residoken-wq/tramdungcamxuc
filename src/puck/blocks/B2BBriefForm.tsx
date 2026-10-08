import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { B2BBriefForm, type B2BBriefFormProps } from '@/components/site/B2BBriefForm'

export type { B2BBriefFormProps }

export const B2BBriefFormBlock: ComponentConfig<B2BBriefFormProps> = {
  label: 'Form Gửi brief Doanh nghiệp (B2B Brief Form)',
  fields: {
    title: { type: 'text', label: 'Tiêu đề form' },
    description: { type: 'textarea', label: 'Mô tả ngắn' },
    submitLabel: { type: 'text', label: 'Chữ trên nút gửi' },
  },
  defaultProps: {
    version: 1,
    title: '[MẪU] Gửi brief đào tạo & đồng hành doanh nghiệp',
    description:
      '[MẪU] Chia sẻ nhu cầu và bối cảnh đội ngũ của bạn để Trạm Dừng Cảm Xúc thiết kế giải pháp phù hợp nhất.',
    submitLabel: 'Gửi brief yêu cầu',
  },
  render: ({ puck, ...props }) => (
    <div className="py-8 px-4">
      <B2BBriefForm {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
    </div>
  ),
}
