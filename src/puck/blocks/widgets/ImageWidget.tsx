import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  ImageWidget,
  type ImageWidgetProps,
  type ImageWidgetWidth,
} from '@/components/site/widgets/ImageWidget'
import { vi } from '@/lib/i18n/vi'
import { createMediaExternalField } from '@/puck/media-field'
import { createPageExternalField } from '@/puck/page-field'

export type { ImageWidgetProps, ImageWidgetWidth }

const t = vi.eb06.image

export const ImageWidgetBlock: ComponentConfig<ImageWidgetProps> = {
  label: t.label,
  fields: {
    mediaId: createMediaExternalField({ label: t.mediaId }),
    caption: {
      type: 'text',
      label: t.caption,
    },
    imageSize: {
      type: 'select',
      label: t.imageSize,
      options: [
        { label: '25%', value: '25' },
        { label: '50%', value: '50' },
        { label: '75%', value: '75' },
        { label: '100% (Đầy khung)', value: '100' },
      ],
    },
    linkType: {
      type: 'select',
      label: t.linkType,
      options: [
        { label: t.linkNone, value: 'none' },
        { label: t.linkUrl, value: 'url' },
        { label: t.linkPage, value: 'page' },
      ],
    },
    pageId: createPageExternalField({ label: t.pageId }),
    href: {
      type: 'text',
      label: t.href,
    },
    newTab: {
      type: 'radio',
      label: t.newTab,
      options: [
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ],
    },
  },
  defaultProps: {
    version: 1,
    mediaId: '',
    imageUrl: '',
    imageAlt: '',
    caption: '',
    imageSize: '100',
    linkType: 'none',
    pageId: '',
    href: '',
    newTab: false,
  },
  resolveData: async (data) => {
    const mediaId = data.props.mediaId
    if (!mediaId) {
      if (data.props.imageUrl) {
        return {
          props: {
            ...data.props,
            imageUrl: '',
            imageAlt: '',
          },
        }
      }
      return { props: data.props }
    }

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json && json.url) {
            const rawAlt = typeof json.alt === 'string' ? json.alt.trim() : ''
            // Alt bắt buộc: nếu không có alt thì không gán URL (yêu cầu alt bắt buộc)
            if (!rawAlt) {
              return {
                props: {
                  ...data.props,
                  imageUrl: '',
                  imageAlt: '',
                },
              }
            }
            return {
              props: {
                ...data.props,
                imageUrl: json.url,
                imageAlt: rawAlt,
              },
            }
          }
        }
      }
    } catch {
      // Preserve props on network error
    }

    return { props: data.props }
  },
  render: ({ puck: _puck, ...props }) => <ImageWidget {...props} puck={_puck} />,
}
