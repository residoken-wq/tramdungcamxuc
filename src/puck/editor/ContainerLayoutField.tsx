'use client'

import React, { useId } from 'react'
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
  CONTAINER_JUSTIFY,
  CONTAINER_WRAP,
  type ContainerAlign,
  type ContainerDirection,
  type ContainerJustify,
  type ContainerLayout,
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
  value?: ContainerLayout
  onChange: (value: ContainerLayout) => void
}) {
  const { tab } = useStylePanel()
  const width = usePuckSelector((s) => s.appState.ui.viewports.current.width)
  const dispatch = usePuckSelector((s) => s.dispatch)
  // Puck mounts the fields twice (one hidden copy): ids must be unique per instance.
  const uid = useId()

  // Custom fields are not filtered by `tabFieldTypes` (EB-04b): show only on the Content tab.
  if (tab !== 'content') return <></>

  const device = deviceForWidth(typeof width === 'number' ? width : undefined)
  const layout: ContainerLayout = value ?? {}

  const setResponsive = <K extends keyof ContainerLayout>(
    key: K,
    v: NonNullable<ContainerLayout[K]>[Device] | undefined,
  ) => {
    const current = { ...(layout[key] as Responsive<unknown> | undefined) }
    if (v === undefined) delete current[device]
    else current[device] = v
    const next: ContainerLayout = { ...layout }
    if (Object.keys(current).length) next[key] = current as ContainerLayout[K]
    else delete next[key]
    onChange(next)
  }

  const isInherited = <T,>(v: Responsive<T> | undefined) =>
    v?.[device] === undefined && resolveDevice(v, device) !== undefined

  const currentDir = resolveDevice(layout.direction, device) ?? 'column'
  const currentJustify = resolveDevice(layout.justify, device)
  const currentAlign = resolveDevice(layout.align, device)
  const currentWrap = resolveDevice(layout.wrap, device) ?? 'nowrap'

  const directions: { value: ContainerDirection; icon: React.FC }[] = [
    { value: 'row', icon: ArrowRightIcon },
    { value: 'column', icon: ArrowDownIcon },
    { value: 'row-reverse', icon: ArrowLeftIcon },
    { value: 'column-reverse', icon: ArrowUpIcon },
  ]
  const selectClass =
    'h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy'

  return (
    <div className="pt-2" data-testid="container-layout-field">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-ui text-[11px] text-deep-navy">
          {t4.devices.editing(t4.devices[device])}
        </span>
        <div
          role="group"
          aria-label={t4.devices.editing(t4.devices[device])}
          className="flex gap-1"
        >
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
                aria-label={t.directions[d.value]}
                title={t.directions[d.value]}
                onClick={() => setResponsive('direction', d.value)}
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

      <Group title={t.groupAlign}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={`${uid}-justify`}>{t.justify}</FieldLabel>
            <InheritedBadge show={isInherited(layout.justify)} />
          </div>
          <select
            id={`${uid}-justify`}
            value={currentJustify ?? ''}
            onChange={(e) =>
              setResponsive('justify', (e.target.value as ContainerJustify) || undefined)
            }
            className={selectClass}
          >
            <option value="">{t4.fields.defaultValue}</option>
            {CONTAINER_JUSTIFY.map((j) => (
              <option key={j} value={j}>
                {t.justifyOptions[j]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={`${uid}-align`}>{t.align}</FieldLabel>
            <InheritedBadge show={isInherited(layout.align)} />
          </div>
          <select
            id={`${uid}-align`}
            value={currentAlign ?? ''}
            onChange={(e) =>
              setResponsive('align', (e.target.value as ContainerAlign) || undefined)
            }
            className={selectClass}
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

      <Group title={t.groupSpacing}>
        <LengthControl
          label={t.gap}
          value={layout.gap?.[device]}
          presets={SPACING_PRESETS}
          kind="spacing"
          inherited={isInherited(layout.gap)}
          onChange={(v) => setResponsive('gap', v)}
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={`${uid}-wrap`}>{t.wrap}</FieldLabel>
            <InheritedBadge show={isInherited(layout.wrap)} />
          </div>
          <select
            id={`${uid}-wrap`}
            value={currentWrap}
            onChange={(e) => setResponsive('wrap', e.target.value as ContainerWrap)}
            className={selectClass}
          >
            {CONTAINER_WRAP.map((w) => (
              <option key={w} value={w}>
                {t.wrapOptions[w]}
              </option>
            ))}
          </select>
        </div>
      </Group>
    </div>
  )
}
