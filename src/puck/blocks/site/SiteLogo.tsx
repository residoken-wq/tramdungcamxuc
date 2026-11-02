import React from 'react'
import Link from 'next/link'
import type { ComponentConfig } from '@puckeditor/core'
import { Logo } from '@/components/brand/Logo'
import { vi } from '@/lib/i18n/vi'

export interface SiteLogoProps {
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right'
  src?: string
  alt?: string
}

export const SiteLogoBlock: ComponentConfig<SiteLogoProps> = {
  label: vi.eb10.siteLogoLabel,
  fields: {
    size: {
      type: 'select',
      label: 'Kích thước',
      options: [
        { label: 'Nhỏ (120px)', value: 'sm' },
        { label: 'Vừa (140px)', value: 'md' },
        { label: 'Lớn (160px)', value: 'lg' },
      ],
    },
    align: {
      type: 'select',
      label: 'Căn lề',
      options: [
        { label: 'Trái', value: 'left' },
        { label: 'Giữa', value: 'center' },
        { label: 'Phải', value: 'right' },
      ],
    },
  },
  defaultProps: {
    size: 'md',
    align: 'left',
  },
  render: ({ size = 'md', align = 'left', src, alt }) => {
    const dimensions = {
      sm: { width: 120, height: 36 },
      md: { width: 140, height: 42 },
      lg: { width: 160, height: 48 },
    }[size] || { width: 140, height: 42 }

    const alignClass =
      align === 'center'
        ? 'justify-center text-center'
        : align === 'right'
          ? 'justify-end text-right'
          : 'justify-start text-left'

    return (
      <div className={`flex items-center ${alignClass} w-full`}>
        <Link
          href="/"
          className="inline-block flex-shrink-0 focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
        >
          <Logo width={dimensions.width} height={dimensions.height} src={src} alt={alt} />
        </Link>
      </div>
    )
  },
}
