import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeroImage, type HeroImageProps } from '@/components/site/HeroImage'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '@/puck/config'

export type { HeroImageProps }

export const HeroImageBlock: ComponentConfig<HeroImageProps> = {
  label: 'Hero Ảnh biểu tượng (Hero Image)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    mediaId: {
      type: 'external',
      label: 'Ảnh minh họa chính (Thư viện media)',
      placeholder: 'Chọn ảnh từ thư viện media...',
      showSearch: true,
      fetchList: async ({ query }) => {
        try {
          const searchParam = query ? `&where[alt][like]=${encodeURIComponent(query)}` : ''
          const res = await fetch(`/api/media?limit=50&depth=0${searchParam}`, {
            credentials: 'include',
          })
          if (!res.ok) return []
          const data = await res.json()
          const docs = (data.docs || []).filter(
            (doc: { alt?: string }) =>
              doc.alt && typeof doc.alt === 'string' && doc.alt.trim().length > 0,
          )
          return docs
        } catch {
          return []
        }
      },
      mapProp: (item: { id?: string }) => item?.id || '',
      mapRow: (item: { url?: string; thumbnailURL?: string; alt?: string; filename?: string }) => ({
        'Hình ảnh': (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url || item.thumbnailURL || ''}
            alt={item.alt || ''}
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
          />
        ),
        'Mô tả (alt)': item.alt || '',
        'Tên file': item.filename || '',
      }),
      getItemSummary: (id: string) => (id ? `Media ID: ${id}` : 'Chưa chọn ảnh'),
    },
    buttonText: { type: 'text', label: 'Chữ trên nút (tùy chọn)' },
    buttonLink: { type: 'text', label: 'Đường dẫn liên kết (tùy chọn)' },
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
    seriesLabel: '[MẪU] Khởi đầu hành trình',
    titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
    titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
    emotionLine: '[MẪU] Dòng cảm xúc trích dẫn chạm đến trái tim',
    mediaId: '',
    imageUrl: '',
    imageAlt: '',
    buttonText: '[MẪU] Bắt đầu ngay',
    buttonLink: '#',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  resolveData: async (data) => {
    const { mediaId } = data.props
    if (!mediaId) {
      return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
    }

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json && json.alt && typeof json.alt === 'string' && json.alt.trim().length > 0) {
            return {
              props: {
                ...data.props,
                imageUrl: json.url || '',
                imageAlt: json.alt.trim(),
              },
            }
          }
        }
      }
    } catch {
      // If resolution fails, preserve props without throwing
    }

    return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
  },
  render: (props) => <HeroImage {...props} />,
}
