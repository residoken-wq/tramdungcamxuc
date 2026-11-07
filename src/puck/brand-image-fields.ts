import type { Field } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { createMediaExternalField } from './media-field'

export interface BrandImageBlockProps {
  imageShape?: 'rounded' | 'arch-left' | 'arch-right' | 'wave'
  imageBadge?: string
  imageCaptionTitle?: string
  imageCaptionSubtitle?: string
  imageCaptionAvatars?: Array<{ mediaId?: string | number; url?: string }>
  captionPosition?: 'bottom-left' | 'bottom-right'
}

export function createBrandImageFields(): Record<string, Field<any>> {
  return {
    imageShape: {
      type: 'select',
      label: vi.pk20?.image?.shape || 'Hình dạng ảnh',
      options: [
        { label: vi.pk20?.image?.shapeRounded || 'Bo góc thường (Mặc định)', value: 'rounded' },
        { label: vi.pk20?.image?.shapeArchLeft || 'Vòm trái (Bo lớn góc trái)', value: 'arch-left' },
        { label: vi.pk20?.image?.shapeArchRight || 'Vòm phải (Bo lớn góc phải)', value: 'arch-right' },
        { label: vi.pk20?.image?.shapeWave || 'Mép sóng cong tự nhiên (Wave)', value: 'wave' },
      ],
    },
    imageBadge: {
      type: 'text',
      label: vi.pk20?.image?.badge || 'Nhãn trên ảnh (Góc trên trái)',
    },
    imageCaptionTitle: {
      type: 'text',
      label: vi.pk20?.image?.captionTitle || 'Tiêu đề thẻ chú thích',
    },
    imageCaptionSubtitle: {
      type: 'text',
      label: vi.pk20?.image?.captionSubtitle || 'Dòng phụ chú thích',
    },
    imageCaptionAvatars: {
      type: 'array',
      label: vi.pk20?.image?.captionAvatars || 'Danh sách avatar nổi (tối đa 4)',
      arrayFields: {
        mediaId: createMediaExternalField({ label: 'Ảnh avatar (Thư viện media)' }),
        url: { type: 'text', label: 'Hoặc đường dẫn ảnh trực tiếp' },
      },
      getItemSummary: (item, index) =>
        item?.url || (item?.mediaId ? `Media ID: ${item.mediaId}` : `Avatar ${index !== undefined ? index + 1 : ''}`),
    },
    captionPosition: {
      type: 'select',
      label: vi.pk20?.image?.captionPosition || 'Vị trí thẻ chú thích',
      options: [
        { label: vi.pk20?.image?.captionPositionLeft || 'Góc dưới trái', value: 'bottom-left' },
        { label: vi.pk20?.image?.captionPositionRight || 'Góc dưới phải', value: 'bottom-right' },
      ],
    },
  }
}

export const brandImageDefaultProps: BrandImageBlockProps = {
  imageShape: 'rounded',
  imageBadge: '',
  imageCaptionTitle: '',
  imageCaptionSubtitle: '',
  imageCaptionAvatars: [],
  captionPosition: 'bottom-left',
}

export async function resolveBrandImageAvatars(
  avatars?: Array<{ mediaId?: string | number; url?: string }>,
): Promise<Array<{ mediaId?: string | number; url?: string }>> {
  if (!Array.isArray(avatars) || avatars.length === 0) return []
  if (typeof window === 'undefined') return avatars

  const resolved = await Promise.all(
    avatars.slice(0, 4).map(async (av) => {
      if (!av) return av
      if (av.url || !av.mediaId) return av
      try {
        const res = await fetch(`/api/media/${encodeURIComponent(av.mediaId)}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const doc = await res.json()
          if (doc?.url) {
            return { ...av, url: doc.url }
          }
        }
      } catch {
        // ignore
      }
      return av
    }),
  )
  return resolved
}
