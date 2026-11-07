import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ServiceCards, type ServiceCardsProps } from '@/components/site/ServiceCards'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS, GRID_CARD_ALIGN_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'
import { vi } from '@/lib/i18n/vi'

export type { ServiceCardsProps }

export const ServiceCardsBlock: ComponentConfig<ServiceCardsProps> = {
  label: 'Các thẻ dịch vụ coaching (Service Cards)',
  fields: {
    layout: {
      type: 'select',
      label: 'Bố cục hiển thị',
      options: [
        { label: 'Mặc định (Cards)', value: 'default' },
        {
          label: vi.pk21?.serviceCards?.layoutDetailed || 'Chi tiết (Detailed)',
          value: 'detailed',
        },
      ],
    },
    seriesLabel: {
      type: 'text',
      label: vi.eb15a?.seriesLabel || 'Nhãn series',
    },
    titleLine1: {
      type: 'text',
      label: vi.eb15a?.titleLine1 || 'Tiêu đề dòng 1',
    },
    titleLine2: {
      type: 'text',
      label: vi.eb15a?.titleLine2 || 'Tiêu đề dòng 2',
    },
    emotionLine: {
      type: 'textarea',
      label: vi.eb15a?.emotionLine || 'Dòng cảm xúc',
    },
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Desktop)',
      options: [
        { label: '1 cột (Căn giữa)', value: 1 },
        { label: '2 cột', value: 2 },
        { label: '3 cột', value: 3 },
      ],
    },
    cardAlign: {
      type: 'select',
      label: vi.eb15b?.gridCardAlign || 'Căn lề tất cả thẻ',
      options: [...GRID_CARD_ALIGN_OPTIONS],
    },
    cardTitles: {
      type: 'array',
      label: vi.pk21?.serviceCards?.cardTitles || 'Tiêu đề thẻ tùy chọn',
      arrayFields: {
        text: { type: 'text', label: 'Tiêu đề thẻ (để trống sẽ dùng tên dịch vụ)' },
      },
      getItemSummary: (item, idx) => item?.text || `Thẻ ${idx !== undefined ? idx + 1 : ''}`,
    },
    cardMedia: {
      type: 'array',
      label: vi.pk21?.serviceCards?.cardMedia || 'Ảnh thẻ tùy chọn',
      arrayFields: {
        mediaId: createMediaExternalField({ label: 'Ảnh minh họa' }),
      },
      getItemSummary: (item, idx) =>
        item?.mediaId ? `Ảnh ID: ${item.mediaId}` : `Ảnh ${idx !== undefined ? idx + 1 : ''}`,
    },
    cards: {
      type: 'slot',
      label: 'Danh sách thẻ dịch vụ',
      allow: ['ServiceCard'],
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
    layout: 'default',
    seriesLabel: '[MẪU] DỊCH VỤ ĐỒNG HÀNH',
    titleLine1: '[MẪU] CÁC LỘ TRÌNH',
    titleLine2: '[MẪU] COACHING 1:1',
    emotionLine: '[MẪU] Lắng nghe chính mình, kiến tạo chuyển hóa bền vững từ bên trong.',
    columns: 3,
    cardAlign: 'inherit',
    cardTitles: [],
    cardMedia: [],
    cards: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  resolveData: async (data) => {
    const { cardMedia } = data.props

    if (typeof window !== 'undefined' && Array.isArray(cardMedia) && cardMedia.length > 0) {
      try {
        const resolvedMedia = await Promise.all(
          cardMedia.map(async (item) => {
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
                }
              }
            } catch {
              // ignore
            }
            return item
          }),
        )
        return {
          props: {
            ...data.props,
            cardMedia: resolvedMedia,
          },
        }
      } catch {
        // ignore
      }
    }

    return data
  },
  // PK-14c: keep `puck` out (as before PK-14) so the builder renders the block exactly like the
  // public page (v1 packages resolve their names); only the empty-slot hint knows it is editing.
  render: ({ puck, ...props }) => (
    <ServiceCards {...props} _editingHint={Boolean(puck?.isEditing)} />
  ),
}
