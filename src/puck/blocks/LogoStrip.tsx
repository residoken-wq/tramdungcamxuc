import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { LogoStrip, type LogoStripProps } from '@/components/site/LogoStrip'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'

export type { LogoStripProps }

export const LogoStripBlock: ComponentConfig<LogoStripProps> = {
  label: 'Dải logo đối tác (Logo Strip)',
  fields: {
    title: {
      type: 'text',
      label: 'Tiêu đề hàng logo (tùy chọn)',
    },
    groups: {
      type: 'array',
      label: 'Danh sách nhóm logo đối tác',
      arrayFields: {
        label: {
          type: 'text',
          label:
            'Tên nhóm (VD "Doanh nghiệp", "Truyền thông" - để trống nếu không hiện tiêu đề nhóm)',
        },
        logos: {
          type: 'array',
          label: 'Danh sách logo trong nhóm',
          arrayFields: {
            mediaId: createMediaExternalField({ label: 'Ảnh logo (Thư viện media)' }),
            alt: { type: 'text', label: 'Tên đối tác / Mô tả ảnh (alt - bắt buộc)' },
            link: { type: 'text', label: 'Đường dẫn liên kết website (tùy chọn)' },
          },
          getItemSummary: (item) =>
            item?.alt || (item?.mediaId ? `Media ID: ${item.mediaId}` : 'Chưa đặt tên'),
        },
      },
      getItemSummary: (group, index) =>
        group?.label ||
        `Nhóm ${index !== undefined ? index + 1 : ''} (${group?.logos?.length || 0} logo)`,
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
    title: '[MẪU] ĐƯỢC ĐỒNG HÀNH VÀ TIN TƯỞNG BỞI',
    groups: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  resolveData: async (data) => {
    const { groups, logos } = data.props

    if (typeof window !== 'undefined') {
      try {
        let resolvedGroups = groups
        if (Array.isArray(groups) && groups.length > 0) {
          resolvedGroups = await Promise.all(
            groups.map(async (group) => {
              if (!Array.isArray(group?.logos) || group.logos.length === 0) return group
              const resLogos = await Promise.all(
                group.logos.map(async (item) => {
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
                    // ignore
                  }
                  return item
                }),
              )
              return { ...group, logos: resLogos }
            }),
          )
        }

        let resolvedLogos = logos
        if (Array.isArray(logos) && logos.length > 0) {
          resolvedLogos = await Promise.all(
            logos.map(async (item) => {
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
                // ignore
              }
              return item
            }),
          )
        }

        return {
          props: {
            ...data.props,
            ...(resolvedGroups ? { groups: resolvedGroups } : {}),
            ...(resolvedLogos ? { logos: resolvedLogos } : {}),
          },
        }
      } catch {
        // ignore
      }
    }

    return data
  },
  render: ({ puck, ...props }) => (
    <LogoStrip {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
