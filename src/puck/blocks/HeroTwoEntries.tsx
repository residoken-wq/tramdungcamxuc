import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeroTwoEntries, type HeroTwoEntriesProps } from '@/components/site/HeroTwoEntries'
import { BRAND_COLOR_OPTIONS, FONT_SIZE_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'
import { vi } from '@/lib/i18n/vi'
import {
  HERO_LAYOUT_OPTIONS,
  HERO_OVERLAY_TONE_OPTIONS,
  HERO_OVERLAY_STRENGTH_OPTIONS,
  HERO_IMAGE_BLUR_OPTIONS,
  HERO_IMAGE_POSITION_OPTIONS,
  HERO_CONTENT_ALIGN_OPTIONS,
  HERO_MIN_HEIGHT_OPTIONS,
} from '@/lib/brand/hero-backdrop'

export type { HeroTwoEntriesProps }

export const HeroTwoEntriesBlock: ComponentConfig<HeroTwoEntriesProps> = {
  label: 'Hero 2 Lối vào (Cá nhân & Tổ chức)',
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
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    description: { type: 'textarea', label: 'Đoạn mô tả ngắn dưới tiêu đề' },
    mediaId: createMediaExternalField({
      label: 'Ảnh chân dung / minh họa Hero (Thư viện media)',
    }),
    titleSize: {
      type: 'select',
      label: 'Cỡ chữ tiêu đề',
      options: [...FONT_SIZE_OPTIONS],
    },
    entries: {
      type: 'slot',
      label: 'Các thẻ lối vào (kéo thả để đổi thứ tự)',
      allow: ['EntryCard'],
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
    layout: {
      type: 'select',
      label: vi.eb14a.layout,
      options: [...HERO_LAYOUT_OPTIONS],
    },
    overlayTone: {
      type: 'select',
      label: vi.eb14a.overlayTone,
      options: [...HERO_OVERLAY_TONE_OPTIONS],
    },
    overlayStrength: {
      type: 'select',
      label: vi.eb14a.overlayStrength,
      options: [...HERO_OVERLAY_STRENGTH_OPTIONS],
    },
    imageBlur: {
      type: 'select',
      label: vi.eb14a.imageBlur,
      options: [...HERO_IMAGE_BLUR_OPTIONS],
    },
    imagePosition: {
      type: 'select',
      label: vi.eb14a.imagePosition,
      options: [...HERO_IMAGE_POSITION_OPTIONS],
    },
    contentAlign: {
      type: 'select',
      label: vi.eb14a.contentAlign,
      options: [...HERO_CONTENT_ALIGN_OPTIONS],
    },
    minHeight: {
      type: 'select',
      label: vi.eb14a.minHeight,
      options: [...HERO_MIN_HEIGHT_OPTIONS],
    },
    entriesLayout: {
      type: 'select',
      label: vi.eb14a.entriesLayoutLabel,
      options: [
        { label: vi.eb14a.entriesLayoutColumns, value: 'columns' },
        { label: vi.eb14a.entriesLayoutRows, value: 'rows' },
      ],
    },
    entriesPlacement: {
      type: 'select',
      label: vi.eb14a.entriesPlacementLabel,
      options: [
        { label: vi.eb14a.entriesPlacementBelow, value: 'below' },
        { label: vi.eb14a.entriesPlacementTextColumn, value: 'textColumn' },
      ],
    },
  },
  defaultProps: {
    version: 4,
    seriesLabel: '[MẪU] Series nhãn',
    titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
    titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
    emotionLine: '[MẪU] Dòng cảm xúc trích dẫn ấm áp và chân thành',
    description: '',
    mediaId: '',
    imageUrl: '',
    imageAlt: '',
    layout: 'split',
    overlayTone: 'dark',
    overlayStrength: 'lg',
    imageBlur: 'none',
    imagePosition: 'center',
    contentAlign: 'center',
    minHeight: 'lg',
    entriesLayout: 'columns',
    entriesPlacement: 'below',
    bgColor: 'warm-ivory',
    padding: 'md',
    titleSize: 'md',
    entries: [
      {
        type: 'EntryCard',
        props: {
          version: 1,
          groupLabel: '',
          label: '[MẪU] Lối vào 1',
          description: '[MẪU] Mô tả ngắn gọn về lối vào dành cho cá nhân',
          buttonText: '[MẪU] Khám phá ngay',
          buttonLink: '#',
          buttonStyle: 'solid',
          badgeColor: 'soft-pink',
          labelColor: 'deep-navy',
          textColor: 'deep-navy',
          labelSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
      {
        type: 'EntryCard',
        props: {
          version: 1,
          groupLabel: '',
          label: '[MẪU] Lối vào 2',
          description: '[MẪU] Mô tả ngắn gọn về lối vào dành cho tổ chức',
          buttonText: '[MẪU] Tìm hiểu thêm',
          buttonLink: '#',
          buttonStyle: 'outline',
          badgeColor: 'lavender-mist',
          labelColor: 'deep-navy',
          textColor: 'deep-navy',
          labelSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
    ],
  },
  resolveFields: (data, params) => {
    const fields = { ...params.fields }
    if (data?.props?.layout !== 'backdrop') {
      delete fields.overlayTone
      delete fields.overlayStrength
      delete fields.imageBlur
      delete fields.imagePosition
      delete fields.contentAlign
      delete fields.minHeight
    } else {
      delete fields.entriesPlacement
    }
    return fields
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
      // Fallback
    }

    return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
  },
  // `puck` carries functions (renderDropZone) that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <HeroTwoEntries {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
