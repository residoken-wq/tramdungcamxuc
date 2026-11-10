import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PhotoGallery, type PhotoGalleryProps } from '@/components/site/PhotoGallery'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'
import { vi } from '@/lib/i18n/vi'

export type { PhotoGalleryProps }

export const PhotoGalleryBlock: ComponentConfig<PhotoGalleryProps> = {
  label: vi.pk21?.photoGallery?.label || 'Thư viện ảnh khoảnh khắc (Photo Gallery)',
  fields: {
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
    headerAlign: {
      type: 'radio',
      label: 'Căn lề tiêu đề',
      options: [
        { label: 'Căn trái', value: 'left' },
        { label: 'Căn giữa', value: 'center' },
      ],
    },
    layout: {
      type: 'select',
      label: vi.pk21?.photoGallery?.layout || 'Bố cục hiển thị',
      options: [
        {
          label: vi.pk21?.photoGallery?.mosaic || 'Ảnh ghép (Mosaic)',
          value: 'mosaic',
        },
        {
          label: vi.pk21?.photoGallery?.grid || 'Lưới 3 cột (Grid)',
          value: 'grid',
        },
      ],
    },
    arrowPosition: {
      type: 'radio',
      label: vi.cd04?.arrowPosition?.label || 'Vị trí mũi tên',
      options: [
        { label: vi.cd04?.arrowPosition?.top || 'Cạnh tiêu đề (Mặc định)', value: 'top' },
        { label: vi.cd04?.arrowPosition?.sides || 'Hai bên (Giữa hàng)', value: 'sides' },
      ],
    },
    items: {
      type: 'array',
      label: vi.pk21?.photoGallery?.items || 'Danh sách ảnh',
      arrayFields: {
        mediaId: createMediaExternalField({ label: 'Ảnh (Thư viện media)' }),
        alt: { type: 'text', label: 'Mô tả ảnh (alt - hỗ trợ người khiếm thị)' },
        caption: {
          type: 'text',
          label: vi.pk21?.photoGallery?.caption || 'Chú thích ảnh (tùy chọn)',
        },
      },
      getItemSummary: (item, index) =>
        item?.caption || item?.alt || `Ảnh ${index !== undefined ? index + 1 : ''}`,
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
    seriesLabel: '[MẪU] KHOẢNH KHẮC',
    titleLine1: '[MẪU] NHỮNG KHOẢNH KHẮC',
    titleLine2: '[MẪU] CHẠM ĐẾN BÌNH YÊN',
    emotionLine: '[MẪU] Nơi mỗi cảm xúc đều tìm thấy điểm dừng dịu êm.',
    headerAlign: 'left',
    layout: 'mosaic',
    arrowPosition: 'top',
    items: [
      {
        imageUrl: '/brand/logo.png',
        alt: '[MẪU] Khoảnh khắc 1',
        caption: '[MẪU] Giữ tâm tĩnh lặng',
      },
      {
        imageUrl: '/brand/logo.png',
        alt: '[MẪU] Khoảnh khắc 2',
        caption: '[MẪU] Kết nối sâu sắc',
      },
      {
        imageUrl: '/brand/logo.png',
        alt: '[MẪU] Khoảnh khắc 3',
        caption: '[MẪU] Lắng nghe chính mình',
      },
      {
        imageUrl: '/brand/logo.png',
        alt: '[MẪU] Khoảnh khắc 4',
        caption: '[MẪU] Bình yên hiện diện',
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  resolveData: async (data) => {
    const { items } = data.props

    if (typeof window !== 'undefined' && Array.isArray(items) && items.length > 0) {
      try {
        const resolvedItems = await Promise.all(
          items.map(async (item) => {
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
              // ignore fetch failure
            }
            return item
          }),
        )
        return {
          props: {
            ...data.props,
            items: resolvedItems,
          },
        }
      } catch {
        // ignore
      }
    }

    return data
  },
  render: ({ puck, ...props }) => (
    <PhotoGallery {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
