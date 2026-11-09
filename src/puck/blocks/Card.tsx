import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { IconCard, type IconCardProps } from '@/components/site/IconCard'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { createMediaExternalField } from '../media-field'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getCardRealBg } from '@/lib/brand/format-classes'
import { vi } from '@/lib/i18n/vi'
import {
  createBrandImageFields,
  brandImageDefaultProps,
  resolveBrandImageAvatars,
} from '../brand-image-fields'

export type { IconCardProps as CardProps }

export const CardBlock: ComponentConfig<IconCardProps> = {
  label: vi.puckCard?.label || 'Thẻ',
  fields: {
    icon: {
      type: 'select',
      label: vi.puckCard?.icon || 'Biểu tượng thương hiệu',
      options: [
        { label: vi.pk26?.noIcon || 'Không dùng biểu tượng', value: 'none' },
        ...BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
      ],
    },
    mediaId: createMediaExternalField({
      label: vi.puckCard?.media || 'Ảnh thẻ (Thư viện media - thay thế biểu tượng)',
    }),
    title: {
      type: 'text',
      label: vi.puckCard?.title || 'Tiêu đề thẻ',
      contentEditable: true,
    },
    titleFont: {
      type: 'select',
      label: vi.cd01?.card?.titleFont || 'Font chữ tiêu đề thẻ',
      options: [
        { label: vi.cd01?.card?.titleFontUi || 'Chữ không chân (Montserrat)', value: 'ui' },
        { label: vi.cd01?.card?.titleFontDisplay || 'Tiêu đề lớn (Anton)', value: 'display' },
      ],
    },
    showDivider: {
      type: 'radio',
      label: vi.cd01?.card?.showDivider || 'Đường kẻ mảnh dưới tiêu đề thẻ',
      options: [
        { label: 'Không có', value: false },
        { label: 'Có đường kẻ', value: true },
      ],
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
      options: [
        ...FONT_SIZE_OPTIONS,
        { label: vi.cd02?.card?.titleSizeXl || 'Rất lớn (XL)', value: 'xl' },
      ],
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
    highlight: {
      type: 'select',
      label: vi.pk20?.highlight?.label || 'Kiểu nổi bật thẻ',
      options: [
        { label: vi.pk20?.highlight?.none || 'Mặc định (Không nổi bật)', value: 'none' },
        { label: vi.pk20?.highlight?.outline || 'Viền hồng (Accent Pink)', value: 'outline' },
        { label: vi.pk20?.highlight?.navy || 'Nền xanh thẫm (Deep Navy)', value: 'navy' },
        {
          label:
            vi.cd01?.card?.highlightComingSoon ||
            'Sắp ra mắt (Coming Soon - Viền xám, không vạch màu)',
          value: 'coming-soon',
        },
      ],
    },
    cardBg: {
      type: 'select',
      label: vi.pk26?.card?.cardBg || 'Màu nền thẻ',
      options: [
        { label: vi.pk26?.card?.cardBgNone || 'Theo kiểu thẻ chung', value: 'none' },
        { label: 'Trắng ngà (Warm Ivory)', value: 'warm-ivory' },
        { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
        { label: 'Tím nhạt (Lavender Mist)', value: 'lavender-mist' },
        { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
        { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
        { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
        { label: 'Hồng sen (Bright Magenta)', value: 'bright-magenta' },
        { label: 'Hồng nhấn (Accent Pink)', value: 'accent-pink' },
      ],
    },
    eyebrow: {
      type: 'text',
      label: vi.pk26?.card?.eyebrow || 'Nhãn nhỏ trên tiêu đề (Eyebrow)',
    },
    eyebrowBar: {
      type: 'radio',
      label: vi.pk26?.card?.eyebrowBar || 'Vạch hồng bên trái nhãn',
      options: [
        { label: 'Không có', value: false },
        { label: 'Có vạch hồng', value: true },
      ],
    },
    eyebrowColor: {
      type: 'select',
      label: vi.cd04?.eyebrowColor?.label || 'Màu nhãn',
      options: [
        {
          label: vi.cd04?.eyebrowColor?.accent || 'Màu nổi bật (Mặc định - Hồng sen)',
          value: 'accent',
        },
        { label: vi.cd04?.eyebrowColor?.muted || 'Màu xám thẫm (Deep Navy 70%)', value: 'muted' },
      ],
    },
    subtitle: {
      type: 'text',
      label: vi.pk26?.card?.subtitle || 'Tiêu đề phụ đậm (Subtitle)',
    },
    subtitleColor: {
      type: 'select',
      label: vi.pk31?.card?.subtitleColor || 'Màu tiêu đề phụ',
      options: allowedTextColors('warm-ivory', false),
    },
    subtitleCase: {
      type: 'select',
      label: vi.cd02?.card?.subtitleCase || 'Kiểu chữ tiêu đề phụ',
      options: [
        {
          label: vi.cd02?.card?.subtitleCaseNone || 'Giữ nguyên chữ thường (Mặc định)',
          value: 'none',
        },
        { label: vi.cd02?.card?.subtitleCaseUpper || 'IN HOA ĐẬM (UPPERCASE)', value: 'upper' },
      ],
    },
    chip: {
      type: 'text',
      label: vi.pk26?.card?.chip || 'Huy hiệu / Nhãn chip',
    },
    items: {
      type: 'array',
      label: vi.pk26?.card?.items || 'Danh sách mục tiêu đề & mô tả',
      arrayFields: {
        title: { type: 'text', label: vi.pk26?.card?.itemTitle || 'Tiêu đề mục' },
        text: { type: 'text', label: vi.pk26?.card?.itemText || 'Mô tả mục' },
      },
    },
    itemsColumns: {
      type: 'radio',
      label: vi.pk26?.card?.itemsColumns || 'Bố cục danh sách mục',
      options: [
        { label: vi.pk26?.card?.itemsColumns1 || '1 cột', value: 1 },
        { label: vi.pk26?.card?.itemsColumns2 || '2 cột', value: 2 },
      ],
    },
    itemsTitleCase: {
      type: 'select',
      label: vi.cd01?.card?.itemsTitleCase || 'Kiểu chữ mục con',
      options: [
        { label: vi.cd01?.card?.itemsTitleCaseNone || 'Chữ thường đậm (Mặc định)', value: 'none' },
        { label: vi.cd01?.card?.itemsTitleCaseUpper || 'IN HOA ĐẬM', value: 'upper' },
      ],
    },
    itemsTitleColor: {
      type: 'select',
      label: vi.cd01?.card?.itemsTitleColor || 'Màu tiêu đề mục con',
      options: [
        { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
        { label: 'Hồng nhấn (Accent Pink)', value: 'accent-pink' },
        { label: 'Hồng sen (Bright Magenta)', value: 'bright-magenta' },
      ],
    },
    linkText: {
      type: 'text',
      label: vi.cd01?.card?.linkText || 'Chữ liên kết thẻ (VD: Khám phá →)',
    },
    linkHref: {
      type: 'text',
      label: vi.cd01?.card?.linkHref || 'Đường dẫn liên kết (VD: #me-time)',
    },
    linkVariant: {
      type: 'select',
      label: vi.cd01?.card?.linkVariant || 'Màu liên kết',
      options: [
        { label: 'Hồng sen (Bright Magenta)', value: 'magenta' },
        { label: 'Hồng nhấn (Accent Pink)', value: 'pink' },
      ],
    },
    note: {
      type: 'object',
      label: vi.pk26?.card?.note || 'Hộp ghi chú (Mang về)',
      objectFields: {
        title: { type: 'text', label: vi.pk26?.card?.noteTitle || 'Tiêu đề ghi chú' },
        text: { type: 'textarea', label: vi.pk26?.card?.noteText || 'Nội dung ghi chú' },
        tone: {
          type: 'select',
          label: vi.pk26?.card?.noteTone || 'Tông màu hộp ghi chú',
          options: [
            { label: 'Tự động theo nền thẻ', value: '' },
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
            { label: 'Tím nhạt (Lavender Mist)', value: 'lavender-mist' },
            { label: 'Trắng ngà (Warm Ivory)', value: 'warm-ivory' },
          ],
        },
      },
    },
    ...createBrandImageFields(),
  },
  defaultProps: {
    version: 1,
    icon: 'star',
    title: '[MẪU] Tiêu đề thẻ',
    titleFont: 'ui',
    text: '[MẪU] Nội dung mô tả chi tiết của thẻ giúp người học thấu hiểu rõ hơn.',
    titleColor: 'deep-navy',
    textColor: 'deep-navy',
    titleSize: 'md',
    textSize: 'md',
    align: 'left',
    highlight: 'none',
    cardBg: 'none',
    eyebrow: '',
    eyebrowBar: false,
    eyebrowColor: 'accent',
    subtitle: '',
    subtitleColor: 'deep-navy',
    subtitleCase: 'none',
    chip: '',
    showDivider: false,
    linkText: '',
    linkHref: '',
    linkVariant: 'magenta',
    items: [],
    itemsColumns: 1,
    itemsTitleCase: 'none',
    itemsTitleColor: 'deep-navy',
    ...brandImageDefaultProps,
  },
  resolveFields: (data, params) => {
    const cardRealBg = getCardRealBg(params?.parent)
    const isTitleLarge = data?.props?.titleSize === 'lg' || data?.props?.titleSize === 'xl'
    const titleColors = allowedTextColors(cardRealBg, isTitleLarge)
    const subtitleColors = allowedTextColors(cardRealBg, false)
    const textColors = allowedTextColors(cardRealBg, false)
    const isFollowingGrid =
      params?.parent?.props?.cardAlign === 'left' || params?.parent?.props?.cardAlign === 'center'
    const alignLabel = isFollowingGrid
      ? `${vi.puckCard?.align || 'Căn lề'} (${vi.eb15b?.cardAlignFollowingGrid || 'Đang theo khung'})`
      : vi.puckCard?.align || 'Căn lề'

    return {
      ...params.fields,
      align: {
        type: 'select',
        label: alignLabel,
        options: [...ALIGN_OPTIONS],
      },
      titleColor: {
        type: 'select',
        label: vi.puckCard?.titleColor || 'Màu tiêu đề',
        options: titleColors,
      },
      subtitleColor: {
        type: 'select',
        label: vi.pk31?.card?.subtitleColor || 'Màu tiêu đề phụ',
        options: subtitleColors,
      },
      textColor: {
        type: 'select',
        label: vi.puckCard?.textColor || 'Màu nội dung',
        options: textColors,
      },
    }
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
  render: (props) => <IconCard {...props} />,
}
