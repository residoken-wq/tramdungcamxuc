import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HanaStory, type HanaStoryProps } from '@/components/site/HanaStory'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'

export type { HanaStoryProps }

export const HanaStoryBlock: ComponentConfig<HanaStoryProps> = {
  label: 'Câu chuyện Hana (Hana Story)',
  fields: {
    tone: {
      type: 'select',
      label: 'Sắc thái giao diện',
      options: [
        { label: 'Sáng (Light - Mặc định)', value: 'light' },
        { label: 'Tối (Dark - Nền xanh thẫm Deep Navy)', value: 'dark' },
      ],
    },
    layout: {
      type: 'select',
      label: 'Bố cục',
      options: [
        { label: 'Câu chuyện kể (Story - Mặc định)', value: 'story' },
        { label: 'Thư từ nhà sáng lập (Letter)', value: 'letter' },
      ],
    },
    imagePosition: {
      type: 'select',
      label: 'Vị trí ảnh chân dung',
      options: [
        { label: 'Bên trái (Mặc định)', value: 'left' },
        { label: 'Bên phải', value: 'right' },
      ],
    },
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    jobTitle: {
      type: 'text',
      label: 'Chức danh / Vai trò (tùy chọn)',
    },
    storyContent: {
      type: 'textarea',
      label: 'Đoạn kể câu chuyện (các đoạn phân tách bằng 2 lần xuống dòng)',
    },
    quoteLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc trích dẫn (Playfair Display Italic)',
    },
    chips: {
      type: 'array',
      label: 'Nhãn giá trị / từ khóa (tối đa 6 từ)',
      max: 6,
      arrayFields: {
        text: { type: 'text', label: 'Từ khóa' },
      },
      getItemSummary: (item) => item?.text || 'Từ khóa',
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
    version: 2,
    tone: 'light',
    layout: 'story',
    imagePosition: 'left',
    seriesLabel: '[MẪU] Về người đồng hành',
    titleLine1: '[MẪU] HÀNH TRÌNH ĐỒNG HÀNH',
    titleLine2: '[MẪU] THẤU CẢM & CHUYỂN HÓA',
    jobTitle: '',
    chips: [],
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
    let resolvedImageUrl = ''
    let resolvedImageAlt = ''
    let resolvedSigUrl: string | null = null
    let resolvedSigAlt: string | null = null

    try {
      if (typeof window !== 'undefined') {
        if (data.props.mediaId) {
          const res = await fetch(`/api/media/${encodeURIComponent(data.props.mediaId)}`, {
            credentials: 'include',
          })
          if (res.ok) {
            const json = await res.json()
            if (json && json.alt && typeof json.alt === 'string' && json.alt.trim().length > 0) {
              resolvedImageUrl = json.url || ''
              resolvedImageAlt = json.alt.trim()
            }
          }
        }

        const siteRes = await fetch('/api/globals/siteSettings?depth=1', {
          credentials: 'include',
        })
        if (siteRes.ok) {
          const siteJson = await siteRes.json()
          const sig = siteJson?.founderSignature
          if (sig && typeof sig === 'object' && sig.url) {
            resolvedSigUrl = sig.url
            resolvedSigAlt = sig.alt || 'Chữ ký nhà sáng lập Hana Lương'
          }
        }
      }
    } catch {
      // ignore
    }

    return {
      props: {
        ...data.props,
        imageUrl: resolvedImageUrl || data.props.imageUrl || '',
        imageAlt: resolvedImageAlt || data.props.imageAlt || '',
        _resolved: {
          founderSignatureUrl: resolvedSigUrl,
          founderSignatureAlt: resolvedSigAlt,
        },
      },
    }
  },
  render: ({ puck, ...props }) => (
    <HanaStory {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
