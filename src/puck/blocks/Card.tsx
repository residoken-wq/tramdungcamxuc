import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { IconCard, type IconCardProps } from '@/components/site/IconCard'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { createMediaExternalField } from '../media-field'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getCardRealBg } from '@/lib/brand/format-classes'
import { vi } from '@/lib/i18n/vi'

export type { IconCardProps as CardProps }

export const CardBlock: ComponentConfig<IconCardProps> = {
  label: vi.puckCard?.label || 'Thẻ',
  fields: {
    icon: {
      type: 'select',
      label: vi.puckCard?.icon || 'Biểu tượng thương hiệu',
      options: BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
    },
    mediaId: createMediaExternalField({
      label: vi.puckCard?.media || 'Ảnh thẻ (Thư viện media - thay thế biểu tượng)',
    }),
    title: {
      type: 'text',
      label: vi.puckCard?.title || 'Tiêu đề thẻ',
      contentEditable: true,
    },
    text: {
      type: 'textarea',
      label: vi.puckCard?.text || 'Nội dung mô tả',
      contentEditable: true,
    },
    titleColor: {
      type: 'select',
      label: vi.puckCard?.titleColor || 'Màu tiêu đề',
      options: allowedTextColors('warm-ivory', false),
    },
    textColor: {
      type: 'select',
      label: vi.puckCard?.textColor || 'Màu nội dung',
      options: allowedTextColors('warm-ivory', false),
    },
    titleSize: {
      type: 'select',
      label: vi.puckCard?.titleSize || 'Cỡ chữ tiêu đề',
      options: [...FONT_SIZE_OPTIONS],
    },
    textSize: {
      type: 'select',
      label: vi.puckCard?.textSize || 'Cỡ chữ nội dung',
      options: [...FONT_SIZE_OPTIONS],
    },
    align: {
      type: 'select',
      label: vi.puckCard?.align || 'Căn lề',
      options: [...ALIGN_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    icon: 'star',
    title: '[MẪU] Tiêu đề thẻ',
    text: '[MẪU] Nội dung mô tả chi tiết của thẻ giúp người học thấu hiểu rõ hơn.',
    titleColor: 'deep-navy',
    textColor: 'deep-navy',
    titleSize: 'md',
    textSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    const cardRealBg = getCardRealBg(params?.parent)
    const isTitleLarge = data?.props?.titleSize === 'lg'
    const titleColors = allowedTextColors(cardRealBg, isTitleLarge)
    const textColors = allowedTextColors(cardRealBg, false)

    return {
      ...params.fields,
      titleColor: {
        type: 'select',
        label: vi.puckCard?.titleColor || 'Màu tiêu đề',
        options: titleColors,
      },
      textColor: {
        type: 'select',
        label: vi.puckCard?.textColor || 'Màu nội dung',
        options: textColors,
      },
    }
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
  render: (props) => <IconCard {...props} />,
}
