import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeroImage, type HeroImageProps } from '@/components/site/HeroImage'
import { BRAND_COLOR_OPTIONS, FONT_SIZE_OPTIONS, PADDING_OPTIONS } from '../constants'
import { allowedTextColors } from '@/lib/brand/format-classes'

export type { HeroImageProps }

// Stats sit directly on the section background: offer only colours that pass WCAG AA there.
function statColorFields(bg: string) {
  return {
    statValueColor: {
      type: 'select' as const,
      label: 'Số liệu: màu con số',
      options: allowedTextColors(bg, true),
    },
    statLabelColor: {
      type: 'select' as const,
      label: 'Số liệu: màu nhãn',
      options: allowedTextColors(bg, false),
    },
  }
}

export const HeroImageBlock: ComponentConfig<HeroImageProps> = {
  label: 'Hero Ảnh biểu tượng (Hero Image)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: {
      type: 'text',
      label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
      contentEditable: true,
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
      contentEditable: true,
    },
    titleSize: { type: 'select', label: 'Cỡ chữ tiêu đề', options: [...FONT_SIZE_OPTIONS] },
    emotionLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc (Playfair Display Italic)',
      contentEditable: true,
    },
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
    buttonText: { type: 'text', label: 'Chữ trên nút chính (tùy chọn)', contentEditable: true },
    buttonLink: { type: 'text', label: 'Đường dẫn nút chính (tùy chọn)' },
    secondaryButtonText: {
      type: 'text',
      label: 'Chữ trên nút thứ 2 (viền, tùy chọn)',
      contentEditable: true,
    },
    secondaryButtonLink: { type: 'text', label: 'Đường dẫn nút thứ 2 (tùy chọn)' },
    badges: {
      type: 'array',
      label: 'Dải huy hiệu / nhãn ngắn (0 – 3 chip)',
      arrayFields: {
        text: { type: 'text', label: 'Nội dung chip (VD: Bảo mật tuyệt đối)' },
      },
      defaultItemProps: {
        text: '[MẪU] Nhãn chứng thực',
      },
    },
    stats: {
      type: 'array',
      label: 'Số liệu nhỏ dưới nút (0 – 3 ô)',
      arrayFields: {
        value: { type: 'text', label: 'Con số (VD: [MẪU] 500+)' },
        label: { type: 'text', label: 'Nhãn mô tả ngắn' },
      },
      defaultItemProps: {
        value: '[MẪU] 500+',
        label: '[MẪU] Giờ khai vấn',
      },
    },
    ...statColorFields('warm-ivory'),
    statValueSize: {
      type: 'select',
      label: 'Số liệu: cỡ con số',
      options: [...FONT_SIZE_OPTIONS],
    },
    statLabelSize: {
      type: 'select',
      label: 'Số liệu: cỡ nhãn',
      options: [...FONT_SIZE_OPTIONS],
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
    version: 2,
    seriesLabel: '[MẪU] Khởi đầu hành trình',
    titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
    titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
    emotionLine: '[MẪU] Dòng cảm xúc trích dẫn chạm đến trái tim',
    mediaId: '',
    imageUrl: '',
    imageAlt: '',
    buttonText: '[MẪU] Bắt đầu ngay',
    buttonLink: '#',
    secondaryButtonText: '',
    secondaryButtonLink: '',
    badges: [],
    stats: [],
    titleSize: 'md',
    statValueColor: 'deep-navy',
    statLabelColor: 'deep-navy',
    statValueSize: 'md',
    statLabelSize: 'md',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  resolveFields: (data, params) => ({
    ...params.fields,
    ...statColorFields(data.props?.bgColor || 'warm-ivory'),
  }),
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
