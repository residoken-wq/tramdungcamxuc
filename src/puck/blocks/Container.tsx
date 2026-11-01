import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { CONTAINER_ALLOWED_BLOCKS } from '../constants'
import { ContainerBackgroundField } from '../editor/ContainerBackgroundField'
import { ContainerLayoutField } from '../editor/ContainerLayoutField'
import { STYLE_ATTR } from '../style/style-css'
import {
  CONTENT_WIDTH_CLASSES,
  MIN_HEIGHT_CLASSES,
  type ContainerProps,
} from '../style/container-schema'

export type { ContainerProps }

function renderSlotItems(items: ContainerProps['items'], isEditing: boolean) {
  if (typeof items === 'function') {
    const SlotComponent = items as React.ComponentType<{ className?: string }>
    return (
      <div className="min-w-0 w-full relative">
        <SlotComponent className="min-w-0 w-full" />
      </div>
    )
  }

  if (Array.isArray(items)) {
    if (items.length === 0) {
      if (isEditing) {
        return (
          <div
            data-eb-empty-hint="true"
            className="flex min-h-[96px] w-full items-center justify-center rounded-lg border-2 border-dashed border-deep-navy/20 bg-warm-ivory/50 p-4 font-ui text-xs font-semibold text-deep-navy/60"
          >
            {vi.eb05.emptyHint}
          </div>
        )
      }
      return null
    }

    return (
      <>
        {items.map((child: unknown, idx: number) => {
          if (React.isValidElement(child)) return child
          const item = child as { type?: string; props?: Record<string, unknown> } | null
          const key = (item?.props?.id as React.Key | undefined) ?? idx
          return (
            <div key={key} data-item-type={item?.type}>
              {/* Fallback item wrapper */}
            </div>
          )
        })}
      </>
    )
  }

  if (React.isValidElement(items)) {
    return items
  }

  if (isEditing) {
    return (
      <div
        data-eb-empty-hint="true"
        className="flex min-h-[96px] w-full items-center justify-center rounded-lg border-2 border-dashed border-deep-navy/20 bg-warm-ivory/50 p-4 font-ui text-xs font-semibold text-deep-navy/60"
      >
        {vi.eb05.emptyHint}
      </div>
    )
  }

  return null
}

export type ContainerViewProps = ContainerProps & {
  id?: string
  puck?: { isEditing?: boolean }
}

export const ContainerView: React.FC<ContainerViewProps> = ({
  id,
  tag = 'div',
  width = 'boxed',
  contentWidth = 'lg',
  minHeight = 'none',
  items,
  puck,
}) => {
  const isEditing = Boolean(puck?.isEditing)
  const Tag = tag === 'section' ? 'section' : 'div'
  const minHeightClass = MIN_HEIGHT_CLASSES[minHeight] || ''
  const isBoxed = width === 'boxed'
  const contentWidthClass = CONTENT_WIDTH_CLASSES[contentWidth] || CONTENT_WIDTH_CLASSES.lg
  const contentClass = isBoxed ? `mx-auto w-full ${contentWidthClass}` : 'w-full'

  return (
    <Tag className={`w-full ${minHeightClass}`}>
      <div {...(id ? { [STYLE_ATTR]: id } : {})} className={`w-full min-w-0 ${contentClass}`}>
        {renderSlotItems(items, isEditing)}
      </div>
    </Tag>
  )
}

export const ContainerBlock: ComponentConfig<ContainerProps> = {
  label: vi.eb05.containerLabel,
  fields: {
    items: {
      type: 'slot',
      label: 'Nội dung Container',
      allow: [...CONTAINER_ALLOWED_BLOCKS],
    },
    layout: {
      type: 'custom',
      label: vi.eb05.layout.title,
      render: ({ value, onChange }) => (
        <ContainerLayoutField value={value} onChange={onChange as (val: unknown) => void} />
      ),
    },
    background: {
      type: 'custom',
      label: vi.eb05.background.title,
      render: ({ value, onChange }) => (
        <ContainerBackgroundField value={value} onChange={onChange as (val: unknown) => void} />
      ),
    },
  },
  defaultProps: {
    version: 1,
    tag: 'div',
    width: 'boxed',
    contentWidth: 'lg',
    minHeight: 'none',
    layout: {
      direction: { desktop: 'column' },
      gap: { desktop: 'md' },
    },
    background: {
      type: 'none',
    },
    items: [],
  },
  resolveData: async (data) => {
    const mediaId = data.props.background?.mediaId
    const currentBg = data.props.background ?? { type: 'none' }
    if (!mediaId) {
      if (currentBg.imageUrl) {
        return {
          props: {
            ...data.props,
            background: {
              ...currentBg,
              imageUrl: '',
              imageAlt: '',
            },
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
            return {
              props: {
                ...data.props,
                background: {
                  ...currentBg,
                  imageUrl: json.url,
                  imageAlt: json.alt && typeof json.alt === 'string' ? json.alt.trim() : '',
                },
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
  render: ({ puck: _puck, ...props }) => <ContainerView {...props} puck={_puck} />,
}
