import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { LogoStrip, type LogoStripProps } from '@/components/site/LogoStrip'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'

export type { LogoStripProps }

export const LogoStripBlock: ComponentConfig<LogoStripProps> = {
  label: 'Dải logo đối tác (Logo Strip)',
  fields: {
    title: {
      type: 'text',
      label: 'Tiêu đề hàng logo (tùy chọn)',
    },
    logos: {
      type: 'array',
      label: 'Danh sách logo đối tác',
      arrayFields: {
        mediaId: createMediaExternalField({ label: 'Ảnh logo (Thư viện media)' }),
        alt: { type: 'text', label: 'Tên đối tác / Mô tả ảnh (alt - bắt buộc)' },
        link: { type: 'text', label: 'Đường dẫn liên kết website (tùy chọn)' },
      },
      getItemSummary: (item) =>
        item?.alt || (item?.mediaId ? `Media ID: ${item.mediaId}` : 'Chưa đặt tên'),
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
    title: '[MẪU] ĐƯỢC ĐỒNG HÀNH VÀ TIN TƯỞNG BỞI',
    logos: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  resolveData: async (data) => {
    const { logos } = data.props
    if (!Array.isArray(logos) || logos.length === 0) {
      return data
    }

    try {
      if (typeof window !== 'undefined') {
        const resolvedLogos = await Promise.all(
          logos.map(async (item) => {
            if (!item?.mediaId) return item
            try {
              const res = await fetch(`/api/media/${encodeURIComponent(item.mediaId)}`, {
                credentials: 'include',
              })
              if (res.ok) {
                const json = await res.json()
                return {
                  ...item,
                  imageUrl: json.url || item.imageUrl || '',
                  alt: item.alt || json.alt || '',
                }
              }
            } catch {
              // ignore fetch error
            }
            return item
          }),
        )
        return { props: { ...data.props, logos: resolvedLogos } }
      }
    } catch {
      // ignore
    }

    return data
  },
  render: ({ puck, ...props }) => (
    <LogoStrip {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
