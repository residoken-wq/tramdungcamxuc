import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { createPageExternalField } from '../page-field'

export type CTAButtonBlockProps = {
  version?: number
  label: string
  linkType?: 'url' | 'page'
  pageId?: string | number
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'left' | 'center' | 'right'
  _resolved?: {
    pageSlug?: string | null
  }
}

export const CTAButtonBlock: ComponentConfig<CTAButtonBlockProps> = {
  label: 'Nút Kêu gọi hành động (CTA Button)',
  fields: {
    label: { type: 'text', label: 'Chữ hiển thị trên nút' },
    linkType: {
      type: 'select',
      label: 'Loại liên kết',
      options: [
        { label: 'Liên kết ngoài / Tự nhập', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    pageId: createPageExternalField({
      label: 'Chọn trang trong website',
    }),
    href: { type: 'text', label: 'Đường dẫn liên kết (khi chọn Tự nhập)' },
    variant: {
      type: 'select',
      label: 'Kiểu dáng nút',
      options: [
        { label: 'Chính (Hồng nhấn - Primary)', value: 'primary' },
        { label: 'Phụ (Xanh thẫm - Secondary)', value: 'secondary' },
        { label: 'Viền mảnh (Ghost)', value: 'ghost' },
      ],
    },
    size: {
      type: 'select',
      label: 'Kích thước',
      options: [
        { label: 'Nhỏ (S - 44px)', value: 'sm' },
        { label: 'Vừa (M - 48px)', value: 'md' },
        { label: 'Lớn (L - 56px)', value: 'lg' },
      ],
    },
    align: {
      type: 'select',
      label: 'Căn lề',
      options: [
        { label: 'Căn giữa', value: 'center' },
        { label: 'Căn trái', value: 'left' },
        { label: 'Căn phải', value: 'right' },
      ],
    },
  },
  defaultProps: {
    version: 2,
    label: '[MẪU] Kêu gọi hành động',
    linkType: 'url',
    pageId: '',
    href: '#',
    variant: 'primary',
    size: 'md',
    align: 'center',
  },
  render: ({
    label,
    linkType = 'url',
    href,
    variant = 'primary',
    size = 'md',
    align = 'center',
    _resolved,
  }) => {
    let safeLink: string | null = null

    if (linkType === 'page') {
      const resolvedSlug = _resolved?.pageSlug
      if (typeof resolvedSlug === 'string' && resolvedSlug.trim() !== '') {
        const slug = resolvedSlug.trim()
        safeLink = safeHref(slug === '/' ? '/' : slug.startsWith('/') ? slug : `/${slug}`)
      } else {
        safeLink = '#'
      }
    } else {
      safeLink = safeHref(href)
    }

    if (!safeLink || !label) {
      return <></>
    }

    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }[align]

    return (
      <div className="py-4 px-4">
        <div className={`mx-auto max-w-5xl flex ${alignClasses}`}>
          <Button href={safeLink} variant={variant} size={size}>
            {label}
          </Button>
        </div>
      </div>
    )
  },
}
