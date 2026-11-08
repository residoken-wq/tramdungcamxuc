import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeartLine } from '@/components/brand/HeartLine'
import { vi } from '@/lib/i18n/vi'

export interface TaglineProps {
  version?: number
  align?: 'left' | 'center' | 'right'
  showHeartLine?: boolean
  tagline?: string
}

export const TaglineBlock: ComponentConfig<TaglineProps> = {
  label: vi.eb10.taglineLabel,
  fields: {
    align: {
      type: 'select',
      label: 'Căn lề',
      options: [
        { label: 'Trái', value: 'left' },
        { label: 'Giữa', value: 'center' },
        { label: 'Phải', value: 'right' },
      ],
    },
    showHeartLine: {
      type: 'radio',
      label: 'Nét trái tim trang trí (HeartLine)',
      options: [
        { label: 'Hiện', value: true },
        { label: 'Ẩn', value: false },
      ],
    },
  },
  defaultProps: {
    version: 1,
    align: 'left',
    showHeartLine: true,
    tagline: '',
  },
  render: ({ align = 'left', showHeartLine = true, tagline, puck }) => {
    const text =
      tagline?.trim() ||
      (puck?.isEditing ? 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.' : '')

    if (!text) {
      return <></>
    }

    const alignClass =
      align === 'center'
        ? 'text-center items-center'
        : align === 'right'
          ? 'text-right items-end'
          : 'text-left items-start'

    return (
      <div className={`flex flex-col space-y-2 ${alignClass} w-full`}>
        <p className="font-quote italic text-base text-deep-navy/90 group-data-[footer-bg=deep-navy]/footer:text-white/90 leading-relaxed max-w-md">
          &ldquo;{text}&rdquo;
        </p>
        {showHeartLine && (
          <div className="pt-1">
            {/* a11y-contrast-ok: SVG trang trí HeartLine ở footer */}
            <HeartLine className="w-20 h-3 text-accent-pink/40 group-data-[footer-bg=deep-navy]/footer:text-soft-pink/50" />
          </div>
        )}
      </div>
    )
  },
}
