import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HanaStory, type HanaStoryProps } from '@/components/site/HanaStory'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'

export type { HanaStoryProps }

export const HanaStoryBlock: ComponentConfig<HanaStoryProps> = {
  label: 'Câu chuyện Hana (Hana Story)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    storyContent: {
      type: 'textarea',
      label: 'Đoạn kể câu chuyện (các đoạn phân tách bằng 2 lần xuống dòng)',
    },
    quoteLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc trích dẫn (Playfair Display Italic)',
    },
    mediaId: createMediaExternalField({
      label: 'Ảnh chân dung (Thư viện media)',
      placeholder: 'Chọn ảnh chân dung...',
    }),
    buttonText: { type: 'text', label: 'Chữ trên nút liên kết (tùy chọn)' },
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
    seriesLabel: '[MẪU] Về người đồng hành',
    titleLine1: '[MẪU] HÀNH TRÌNH ĐỒNG HÀNH',
    titleLine2: '[MẪU] THẤU CẢM & CHUYỂN HÓA',
    storyContent:
      '[MẪU] Đoạn văn bản thứ nhất kể về hành trình và chiêm nghiệm.\n\n[MẪU] Đoạn văn bản thứ hai làm rõ hơn giá trị và sự đồng hành.',
    quoteLine: '[MẪU] Dòng cảm xúc trích dẫn chạm đến trái tim người đọc.',
    mediaId: '',
    imageUrl: '',
    imageAlt: '',
    buttonText: '',
    buttonLink: '',
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
      // If resolution fails, preserve props
    }

    return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
  },
  render: ({ puck, ...props }) => (
    <HanaStory {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
