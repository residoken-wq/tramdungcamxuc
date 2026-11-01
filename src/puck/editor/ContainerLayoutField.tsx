'use client'

import React from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import {
  DEVICES,
  resolveDevice,
  SPACING_PRESETS,
  type Device,
  type Responsive,
} from '@/puck/style/style-schema'
import {
  CONTAINER_ALIGN,
  CONTAINER_CONTENT_WIDTH,
  CONTAINER_JUSTIFY,
  CONTAINER_MIN_HEIGHT,
  CONTAINER_TAG,
  CONTAINER_WIDTH,
  CONTAINER_WRAP,
  type ContainerAlign,
  type ContainerContentWidth,
  type ContainerDirection,
  type ContainerJustify,
  type ContainerLayout,
  type ContainerMinHeight,
  type ContainerProps,
  type ContainerTag,
  type ContainerWidth,
  type ContainerWrap,
} from '@/puck/style/container-schema'
import { useStylePanel } from './style-context'
import {
  DEVICE_WIDTH,
  deviceForWidth,
  FieldLabel,
  Group,
  InheritedBadge,
  LengthControl,
} from './style-controls'

const usePuckSelector = createUsePuck()
const t = vi.eb05.layout
const t4 = vi.eb04

// Direction SVGs
const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M4 10h12M12 6l4 4-4 4" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M10 4v12M6 12l4 4 4-4" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M16 10H4M8 6l-4 4 4 4" />
  </svg>
)

const ArrowUpIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M10 16V4M6 8l4-4 4 4" />
  </svg>
)

export function ContainerLayoutField({
  value,
  onChange,
}: {
  value?: unknown
  onChange?: (val: unknown) => void
}) {
  const { tab } = useStylePanel()
  const width = usePuckSelector((s) => s.appState.ui.viewports.current.width)
  const dispatch = usePuckSelector((s) => s.dispatch)
  const selectedItem = usePuckSelector((s) => {
    const itemSelector = s.appState.ui.itemSelector
    if (!itemSelector) return null
    const content = s.appState.data.content as Array<{ props?: ContainerProps & { id?: string } }> | undefined
    return content?.[itemSelector.index] ?? null
  })

  // EB-05 Lỗi 1: Custom field must self-filter and only render on Content tab
  if (tab !== 'content') return <></>

  const device = deviceForWidth(typeof width === 'number' ? width : undefined)

  // Direct read/update from puck data
  const updateProps = (patch: Partial<ContainerProps>) => {
    if (patch.layout) {
      onChange?.(patch.layout)
    }
    dispatch({
      type: 'setData',
      data: (prev) => {
        const updateTree = (items: unknown[]): unknown[] =>
          items.map((it) => {
            if (!it || typeof it !== 'object') return it
            const node = it as { type?: string; props?: ContainerProps & { id?: string } }
            if (node.props?.id && node.props.id === selectedItem?.props?.id) {
              return { ...node, props: { ...node.props, ...patch } }
            }
            // Recurse into slots
            const nextProps: Record<string, unknown> = { ...(node.props ?? {}) }
            let mutated = false
            for (const [key, val] of Object.entries(nextProps)) {
              if (
                Array.isArray(val) &&
                val.some((x) => x && typeof x === 'object' && 'type' in x)
              ) {
                nextProps[key] = updateTree(val)
                mutated = true
              }
            }
            return mutated ? { ...node, props: nextProps } : node
          })

        const content = Array.isArray(prev.content) ? updateTree(prev.content) : prev.content
        return { ...prev, content } as any
      },
    })
  }

  const props: ContainerProps = selectedItem?.props ?? {}
  const layout: ContainerLayout = (value as ContainerLayout) ?? props.layout ?? {}

  const updateLayoutResponsive = <K extends keyof ContainerLayout>(
    key: K,
    v: NonNullable<ContainerLayout[K]>[Device] | undefined,
  ) => {
    const current = { ...(layout[key] as Responsive<unknown> | undefined) }
    if (v === undefined) delete current[device]
    else current[device] = v
    const nextLayout: ContainerLayout = {
      ...layout,
      [key]: Object.keys(current).length ? current : undefined,
    }
    updateProps({ layout: nextLayout })
  }

  const isInherited = <T,>(v: Responsive<T> | undefined) =>
    v?.[device] === undefined && resolveDevice(v, device) !== undefined

  const currentDir = resolveDevice(layout.direction, device) || 'column'
  const currentJustify = resolveDevice(layout.justify, device)
  const currentAlign = resolveDevice(layout.align, device)
  const currentWrap = resolveDevice(layout.wrap, device) || 'nowrap'

  const deviceBar = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-[11px] text-deep-navy font-ui">
        {t4.devices.editing(t4.devices[device])}
      </span>
      <div role="group" aria-label={t4.devices.editing(t4.devices[device])} className="flex gap-1">
        {DEVICES.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={device === d}
            aria-label={t4.devices[d]}
            title={t4.devices[d]}
            onClick={() =>
              dispatch({
                type: 'setUi',
                ui: (prev) => ({
                  viewports: {
                    ...prev.viewports,
                    current: { width: DEVICE_WIDTH[d], height: 'auto' },
                  },
                }),
              })
            }
            className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
              device === d
                ? 'bg-deep-navy text-white'
                : 'bg-warm-ivory text-deep-navy hover:bg-lavender-mist'
            }`}
          >
            {t4.devices[d]}
          </button>
        ))}
      </div>
    </div>
  )

  const directions: { value: ContainerDirection; label: string; icon: React.FC }[] = [
    { value: 'row', label: t.directions.row, icon: ArrowRightIcon },
    { value: 'column', label: t.directions.column, icon: ArrowDownIcon },
    { value: 'row-reverse', label: t.directions['row-reverse'], icon: ArrowLeftIcon },
    { value: 'column-reverse', label: t.directions['column-reverse'], icon: ArrowUpIcon },
  ]

  return (
    <div className="pt-2" data-testid="container-layout-field">
      {deviceBar}

      {/* Direction */}
      <Group title={t.direction}>
        <div className="flex items-center justify-between">
          <FieldLabel>{t.direction}</FieldLabel>
          <InheritedBadge show={isInherited(layout.direction)} />
        </div>
        <div role="group" aria-label={t.direction} className="grid grid-cols-4 gap-1.5">
          {directions.map((d) => {
            const Icon = d.icon
            const active = currentDir === d.value
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={active}
                aria-label={d.label}
                title={d.label}
                onClick={() => updateLayoutResponsive('direction', d.value)}
                className={`flex h-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                  active
                    ? 'border-bright-magenta bg-soft-pink/50 text-bright-magenta'
                    : 'border-deep-navy/15 bg-white text-deep-navy/70 hover:border-deep-navy/30'
                }`}
              >
                <Icon />
              </button>
            )
          })}
        </div>
      </Group>

      {/* Alignment & Justification */}
      <Group title="Căn chỉnh">
        {/* Justify */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="container-justify">{t.justify}</FieldLabel>
            <InheritedBadge show={isInherited(layout.justify)} />
          </div>
          <select
            id="container-justify"
            value={currentJustify ?? ''}
            onChange={(e) =>
              updateLayoutResponsive('justify', (e.target.value as ContainerJustify) || undefined)
            }
            className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
          >
            <option value="">{t4.fields.defaultValue}</option>
            {CONTAINER_JUSTIFY.map((j) => (
              <option key={j} value={j}>
                {t.justifyOptions[j]}
              </option>
            ))}
          </select>
        </div>

        {/* Align */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="container-align">{t.align}</FieldLabel>
            <InheritedBadge show={isInherited(layout.align)} />
          </div>
          <select
            id="container-align"
            value={currentAlign ?? ''}
            onChange={(e) =>
              updateLayoutResponsive('align', (e.target.value as ContainerAlign) || undefined)
            }
            className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
          >
            <option value="">{t4.fields.defaultValue}</option>
            {CONTAINER_ALIGN.map((a) => (
              <option key={a} value={a}>
                {t.alignOptions[a]}
              </option>
            ))}
          </select>
        </div>
      </Group>

      {/* Spacing & Wrapping */}
      <Group title="Khoảng cách & Xuống dòng">
        <LengthControl
          label={t.gap}
          value={layout.gap?.[device]}
          presets={SPACING_PRESETS}
          kind="spacing"
          inherited={isInherited(layout.gap)}
          onChange={(v) => updateLayoutResponsive('gap', v)}
        />

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="container-wrap">{t.wrap}</FieldLabel>
            <InheritedBadge show={isInherited(layout.wrap)} />
          </div>
          <select
            id="container-wrap"
            value={currentWrap}
            onChange={(e) =>
              updateLayoutResponsive('wrap', (e.target.value as ContainerWrap) || undefined)
            }
            className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
          >
            {CONTAINER_WRAP.map((w) => (
              <option key={w} value={w}>
                {t.wrapOptions[w]}
              </option>
            ))}
          </select>
        </div>
      </Group>

      {/* Sizing & Structure (Non-responsive) */}
      <Group title="Kích thước & Cấu trúc">
        {/* Width mode */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="container-width">{t.width}</FieldLabel>
          <select
            id="container-width"
            value={props.width ?? 'boxed'}
            onChange={(e) => updateProps({ width: e.target.value as ContainerWidth })}
            className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
          >
            {CONTAINER_WIDTH.map((w) => (
              <option key={w} value={w}>
                {t.widthOptions[w]}
              </option>
            ))}
          </select>
        </div>

        {/* Content width (when boxed) */}
        {props.width !== 'full' ? (
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="container-content-width">{t.contentWidth}</FieldLabel>
            <select
              id="container-content-width"
              value={props.contentWidth ?? 'lg'}
              onChange={(e) =>
                updateProps({ contentWidth: e.target.value as ContainerContentWidth })
              }
              className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
            >
              {CONTAINER_CONTENT_WIDTH.map((cw) => (
                <option key={cw} value={cw}>
                  {t.contentWidthOptions[cw]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Min height */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="container-min-height">{t.minHeight}</FieldLabel>
          <select
            id="container-min-height"
            value={props.minHeight ?? 'none'}
            onChange={(e) => updateProps({ minHeight: e.target.value as ContainerMinHeight })}
            className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
          >
            {CONTAINER_MIN_HEIGHT.map((mh) => (
              <option key={mh} value={mh}>
                {t.minHeightOptions[mh]}
              </option>
            ))}
          </select>
        </div>

        {/* HTML Tag */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="container-tag">{t.tag}</FieldLabel>
          <select
            id="container-tag"
            value={props.tag ?? 'div'}
            onChange={(e) => updateProps({ tag: e.target.value as ContainerTag })}
            className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
          >
            {CONTAINER_TAG.map((tag) => (
              <option key={tag} value={tag}>
                {t.tagOptions[tag]}
              </option>
            ))}
          </select>
        </div>
      </Group>
    </div>
  )
}
