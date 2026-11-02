import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'

export interface HeaderCTAProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  href?: string
}

export const HeaderCTABlock: ComponentConfig<HeaderCTAProps> = {
  label: vi.eb10.headerCtaLabel,
  fields: {
    variant: {
      type: 'select',
      label: 'Kiểu nút',
      options: [
        { label: 'Chính (Primary)', value: 'primary' },
        { label: 'Phụ (Secondary)', value: 'secondary' },
        { label: 'Viền (Outline)', value: 'outline' },
      ],
    },
    size: {
      type: 'select',
      label: 'Kích cỡ',
      options: [
        { label: 'Nhỏ (sm)', value: 'sm' },
        { label: 'Vừa (md)', value: 'md' },
        { label: 'Lớn (lg)', value: 'lg' },
      ],
    },
  },
  defaultProps: {
    variant: 'primary',
    size: 'md',
    label: '',
    href: '',
  },
  render: ({ variant = 'primary', size = 'md', label, href, puck }) => {
    // If not resolved or empty, in editor show placeholder
    const displayLabel = label || (puck?.isEditing ? '[MẪU CTA]' : '')
    const displayHref = href || '#'

    if (!displayLabel) {
      return null
    }

    return (
      <div className="flex items-center">
        <Button href={displayHref} variant={variant} size={size}>
          {displayLabel}
        </Button>
      </div>
    )
  },
}
