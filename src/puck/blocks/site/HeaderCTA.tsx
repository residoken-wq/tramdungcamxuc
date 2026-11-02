import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'

export interface HeaderCTAProps {
  version?: number
  variant?: ButtonVariant
  size?: ButtonSize
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
        { label: 'Trong suốt (Ghost)', value: 'ghost' },
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
    version: 1,
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
      return <></>
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
