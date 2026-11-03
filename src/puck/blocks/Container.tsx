import React from 'react'
import type { ComponentConfig, Slot } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { CHILD_BLOCK_TYPES } from '../constants'
import { ContainerBackgroundField } from '../editor/ContainerBackgroundField'
import { ContainerLayoutField } from '../editor/ContainerLayoutField'
import { EmptyContainerPlaceholder } from '../editor/EmptyContainerPlaceholder'
import { isSafeBlockId, STYLE_ATTR } from '../style/style-css'
import { containerItemsClass } from '../style/container-css'
import { STYLES_IN_PLACE } from '../style/with-block-style'
import {
  CONTAINER_CONTENT_WIDTH,
  CONTAINER_MIN_HEIGHT,
  CONTAINER_TAG,
  CONTAINER_WIDTH,
  CONTENT_WIDTH_CLASSES,
  MIN_HEIGHT_CLASSES,
  type ContainerProps,
} from '../style/container-schema'

export type { ContainerProps }

const t = vi.eb05.layout

type SlotComponent = React.ComponentType<{ className?: string }>

export type ContainerViewProps = Omit<ContainerProps, 'items'> & {
  id?: string
  /** `_style.anchorId`, passed in by `withBlockStyle`. */
  anchorId?: string
  extraClassName?: string
  items?: SlotComponent | Slot | unknown
  /** EB-13b: true only in Puck editor mode, false on public pages. */
  isEditing?: boolean
  'data-eb-entrance'?: string
  'data-eb-entrance-delay'?: number
}

/**
 * EB-05: Elementor-style container. The outer element carries `data-eb-id`, so the background
 * (advanced and `_style`), padding and visibility cover the full width. The slot element itself is
 * the flex container (`.eb-c-<id>`, CSS from `containerCss`), so the dropped blocks are its direct
 * flex children both in the editor and on the public page.
 */
export const ContainerView: React.FC<ContainerViewProps> = ({
  id,
  tag = 'div',
  width = 'boxed',
  contentWidth = 'lg',
  minHeight = 'none',
  items,
  anchorId,
  extraClassName,
  isEditing = false,
  ...rest
}) => {
  const Tag = tag === 'section' ? 'section' : 'div'
  const safeId = isSafeBlockId(id) ? id : undefined
  const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')
  const outerClass = cx('flex w-full flex-col', MIN_HEIGHT_CLASSES[minHeight], extraClassName)
  const innerClass = cx(
    'flex w-full min-w-0 flex-1 flex-col',
    width !== 'full' && 'mx-auto',
    width !== 'full' && (CONTENT_WIDTH_CLASSES[contentWidth] ?? CONTENT_WIDTH_CLASSES.lg),
  )
  const itemsClass = cx(
    'flex min-h-[48px] w-full min-w-0 flex-1 flex-col',
    safeId && containerItemsClass(safeId),
  )
  const Items = typeof items === 'function' ? (items as SlotComponent) : null

  return (
    <Tag
      {...(safeId ? { [STYLE_ATTR]: safeId } : {})}
      id={anchorId}
      className={outerClass}
      data-eb-entrance={rest['data-eb-entrance']}
      data-eb-entrance-delay={rest['data-eb-entrance-delay']}
    >
      <div className={innerClass}>
        {Items ? <Items className={itemsClass} /> : <div className={itemsClass} />}
        {isEditing && safeId ? <EmptyContainerPlaceholder containerId={safeId} /> : null}
      </div>
    </Tag>
  )
}

Object.assign(ContainerView, { [STYLES_IN_PLACE]: true })

const select = <T extends string>(
  label: string,
  values: readonly T[],
  labels: Record<T, string>,
) => ({
  type: 'select' as const,
  label,
  options: values.map((value) => ({ label: labels[value], value })),
})

export const ContainerBlock: ComponentConfig<ContainerProps> = {
  label: vi.eb05.containerLabel,
  fields: {
    items: {
      type: 'slot',
      label: vi.eb05.container,
      // Child cards only belong inside their own parent block.
      disallow: [...CHILD_BLOCK_TYPES],
    },
    layout: {
      type: 'custom',
      label: vi.eb05.layout.title,
      render: ({ value, onChange }) => <ContainerLayoutField value={value} onChange={onChange} />,
    },
    width: select(t.width, CONTAINER_WIDTH, t.widthOptions),
    contentWidth: select(t.contentWidth, CONTAINER_CONTENT_WIDTH, t.contentWidthOptions),
    minHeight: select(t.minHeight, CONTAINER_MIN_HEIGHT, t.minHeightOptions),
    tag: select(t.tag, CONTAINER_TAG, t.tagOptions),
    background: {
      type: 'custom',
      label: vi.eb05.background.title,
      render: ({ value, onChange }) => (
        <ContainerBackgroundField value={value} onChange={onChange} />
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
    background: { type: 'none' },
    items: [],
  },
  resolveData: async (data) => {
    const background = data.props.background ?? { type: 'none' }
    const mediaId = background.type === 'image' ? background.mediaId : undefined
    if (!mediaId) {
      if (!background.imageUrl) return { props: data.props }
      return { props: { ...data.props, background: { ...background, imageUrl: '', imageAlt: '' } } }
    }
    if (typeof window === 'undefined') return { props: data.props }
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}?depth=0`, {
        credentials: 'include',
      })
      if (!res.ok) return { props: data.props }
      const json = (await res.json()) as { url?: unknown; alt?: unknown }
      if (typeof json.url !== 'string' || !json.url) return { props: data.props }
      return {
        props: {
          ...data.props,
          background: {
            ...background,
            imageUrl: json.url,
            imageAlt: typeof json.alt === 'string' ? json.alt.trim() : '',
          },
        },
      }
    } catch {
      // Keep the last resolved image on network errors.
      return { props: data.props }
    }
  },
  render: ({ puck, ...props }) => (
    <ContainerView {...props} isEditing={Boolean(puck?.isEditing)} />
  ),
}
