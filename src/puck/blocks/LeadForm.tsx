import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { LeadForm } from '@/components/site/LeadForm'
import { createProductExternalField } from '../product-field'

export interface LeadFormBlockProps {
  version?: number
  title: string
  description?: string
  resourceProductId?: string | number
  need?: 'resource' | 'personal' | 'business'
  interestTags?: string
  submitLabel?: string
  pageSlug?: string
  _resolved?: {
    resource?: {
      id: string | number
      name: string
      slug: string
    } | null
  }
}

export const LeadFormBlock: ComponentConfig<LeadFormBlockProps> = {
  label: 'Form Thu lead & Nhận tài nguyên (Lead Form)',
  fields: {
    title: { type: 'text', label: 'Tiêu đề form' },
    description: { type: 'textarea', label: 'Mô tả ngắn' },
    resourceProductId: createProductExternalField({
      label: 'Tài nguyên giao qua email (Ebook / Toolkit miễn phí)',
    }),
    need: {
      type: 'select',
      label: 'Nhu cầu (need)',
      options: [
        { label: 'Tài nguyên (resource)', value: 'resource' },
        { label: 'Cá nhân (personal)', value: 'personal' },
        { label: 'Doanh nghiệp (business)', value: 'business' },
      ],
    },
    interestTags: {
      type: 'text',
      label: 'Thẻ quan tâm (cách nhau bởi dấu phẩy, vd: ebook, habit)',
    },
    submitLabel: { type: 'text', label: 'Chữ trên nút gửi' },
  },
  defaultProps: {
    version: 1,
    title: '[MẪU] Nhận tài nguyên cảm xúc & thói quen',
    description:
      '[MẪU] Để lại email để nhận bản tin và tài nguyên chuyển hóa cảm xúc từ Trạm Dừng Cảm Xúc.',
    resourceProductId: '',
    need: 'resource',
    interestTags: 'resource',
    submitLabel: 'Nhận tài nguyên',
  },
  render: ({
    title,
    description,
    need = 'resource',
    interestTags = 'resource',
    submitLabel,
    pageSlug,
    _resolved,
    puck,
  }) => {
    const parsedTags =
      typeof interestTags === 'string'
        ? interestTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []

    return (
      <div className="py-8 px-4">
        <LeadForm
          title={title}
          description={description}
          need={need}
          interestTags={parsedTags}
          resourceSlug={_resolved?.resource?.slug}
          submitLabel={submitLabel}
          pageSlug={pageSlug}
          puck={{ isEditing: puck?.isEditing ?? false }}
        />
      </div>
    )
  },
}
