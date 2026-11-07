import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeroImage, type HeroImageProps } from '@/components/site/HeroImage'
import { BRAND_COLOR_OPTIONS, FONT_SIZE_OPTIONS, PADDING_OPTIONS } from '../constants'
import { allowedTextColors } from '@/lib/brand/format-classes'
import { vi } from '@/lib/i18n/vi'
import {
  createBrandImageFields,
  brandImageDefaultProps,
  resolveBrandImageAvatars,
} from '../brand-image-fields'
import {
  HERO_LAYOUT_OPTIONS,
  HERO_IMAGE_SIDE_OPTIONS,
  HERO_OVERLAY_TONE_OPTIONS,
  HERO_OVERLAY_STRENGTH_OPTIONS,
  HERO_IMAGE_BLUR_OPTIONS,
  HERO_IMAGE_POSITION_OPTIONS,
  HERO_CONTENT_ALIGN_OPTIONS,
  HERO_MIN_HEIGHT_OPTIONS,
} from '@/lib/brand/hero-backdrop'

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
    seriesLabel: { type: 'text', label: vi.eb15a.seriesLabel },
    titleLine1: {
      type: 'text',
      label: vi.eb15a.titleLine1,
      contentEditable: true,
    },
    titleLine2: {
      type: 'text',
      label: vi.eb15a.titleLine2,
      contentEditable: true,
    },
    titleSize: { type: 'select', label: 'Cỡ chữ tiêu đề', options: [...FONT_SIZE_OPTIONS] },
    emotionLine: {
      type: 'textarea',
      label: vi.eb15a.emotionLine,
      contentEditable: true,
    },
    listTitle: {
      type: 'text',
      label: vi.pk26?.heroImage?.listTitle || 'Tiêu đề danh sách giai đoạn',
    },
    listItems: {
      type: 'array',
      label: vi.pk26?.heroImage?.listItems || 'Danh sách giai đoạn',
      getItemSummary: (it: { text?: string }) => it?.text || 'Giai đoạn',
      arrayFields: {
        text: {
          type: 'text',
          label: vi.pk26?.heroImage?.itemText || 'Nội dung giai đoạn',
        },
        muted: {
          type: 'radio',
          label: vi.pk26?.heroImage?.itemMuted || 'Giai đoạn tiếp theo (chấm rỗng, chữ mờ)',
          options: [
            { label: 'Rõ (chấm đặc)', value: false },
            { label: 'Mờ (chấm rỗng)', value: true },
          ],
        },
      },
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
    buttonText: { type: 'text', label: vi.eb15a.buttonText, contentEditable: true },
    buttonLink: { type: 'text', label: 'Đường dẫn nút chính (tùy chọn)' },
    secondaryButtonText: {
      type: 'text',
      label: vi.eb15a.secondaryButtonText,
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
    layout: {
      type: 'select',
      label: vi.eb14a.layout,
      options: [...HERO_LAYOUT_OPTIONS],
    },
    imageSide: {
      type: 'select',
      label: vi.pk25.imageSide,
      options: [...HERO_IMAGE_SIDE_OPTIONS],
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
    ...createBrandImageFields(),
  },
  defaultProps: {
    version: 3,
    seriesLabel: '[MẪU] Khởi đầu hành trình',
    titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
    titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
    emotionLine: '[MẪU] Dòng cảm xúc trích dẫn chạm đến trái tim',
    listTitle: '',
    listItems: [],
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
    layout: 'split',
    imageSide: 'right',
    overlayTone: 'dark',
    overlayStrength: 'lg',
    imageBlur: 'none',
    imagePosition: 'center',
    contentAlign: 'center',
    minHeight: 'lg',
    bgColor: 'warm-ivory',
    padding: 'md',
    ...brandImageDefaultProps,
  },
  resolveFields: (data, params) => {
    const isBackdrop = data?.props?.layout === 'backdrop'
    const isSide = data?.props?.layout === 'side'
    const effectiveBg = isBackdrop
      ? data?.props?.overlayTone === 'light'
        ? 'warm-ivory'
        : 'deep-navy'
      : data?.props?.bgColor || 'warm-ivory'

    const fields = {
      ...params.fields,
      ...statColorFields(effectiveBg),
    }

    if (!isBackdrop) {
      delete fields.overlayTone
      delete fields.overlayStrength
      delete fields.imageBlur
      delete fields.imagePosition
      delete fields.contentAlign
      delete fields.minHeight
    }

    if (!isSide) {
      delete fields.imageSide
    }

    return fields
  },
  resolveData: async (data) => {
    const avatars = await resolveBrandImageAvatars(data.props.imageCaptionAvatars)
    const baseProps = { ...data.props, imageCaptionAvatars: avatars }

    const { mediaId } = data.props
    if (!mediaId) {
      return { props: { ...baseProps, imageUrl: '', imageAlt: '' } }
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
                ...baseProps,
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

    return { props: { ...baseProps, imageUrl: '', imageAlt: '' } }
  },
  render: (props) => <HeroImage {...props} />,
}
