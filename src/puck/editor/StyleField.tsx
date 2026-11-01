'use client'

import React, { useId, useState } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { contrastRatio, isOpen, isValidHex } from '@/lib/design/design-system'
import { DESIGN_FONT_OPTIONS } from '@/lib/design/fonts'
import { vi } from '@/lib/i18n/vi'
import {
  DEVICES,
  FONT_SIZE_PRESETS,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  RADIUS_PRESETS,
  resolveDevice,
  SHADOWS,
  SIDES,
  SPACING_PRESETS,
  TEXT_ALIGNS,
  type BlockStyle,
  type Box,
  type Device,
  type LengthKind,
  type Responsive,
} from '@/puck/style/style-schema'
import { useStylePanel } from './style-context'
import {
  ColorControl,
  DEVICE_WIDTH,
  deviceForWidth,
  FieldLabel,
  Group,
  LengthControl,
  SelectControl,
} from './style-controls'

const usePuckSelector = createUsePuck()
const t = vi.eb04

export { deviceForWidth }

export const STYLE_TAB_KEYS: (keyof BlockStyle)[] = [
  'background',
  'textColor',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'radius',
  'borderWidth',
  'borderColor',
  'shadow',
]
export const ADVANCED_TAB_KEYS: (keyof BlockStyle)[] = ['padding', 'margin', 'hideOn', 'anchorId']

/** Drops empty values so `_style` stays small (and absent when nothing is set). */
export function compactStyle(style: BlockStyle): BlockStyle | undefined {
  const entries = Object.entries(style).filter(([, v]) => {
    if (v === undefined || v === '') return false
    if (Array.isArray(v)) return v.length > 0
    if (v && typeof v === 'object') return Object.keys(v).length > 0
    return true
  })
  return entries.length ? (Object.fromEntries(entries) as BlockStyle) : undefined
}

function BoxControl({
  label,
  kind,
  value,
  inheritedValue,
  onChange,
}: {
  label: string
  kind: LengthKind
  value: Box | undefined
  inheritedValue: Box | undefined
  onChange: (value: Box | undefined) => void
}) {
  const [linked, setLinked] = useState(false)
  const setSide = (side: (typeof SIDES)[number], v: string | undefined) => {
    const next: Box = linked
      ? Object.fromEntries(SIDES.map((s) => [s, v]))
      : { ...value, [side]: v }
    const clean = Object.fromEntries(Object.entries(next).filter(([, x]) => x !== undefined))
    onChange(Object.keys(clean).length ? (clean as Box) : undefined)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-ui text-xs font-semibold text-deep-navy">{label}</span>
        <label className="flex items-center gap-1 text-[11px] text-deep-navy">
          <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} />
          {t.fields.linkSides}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SIDES.map((side) => (
          <LengthControl
            key={side}
            label={t.sides[side]}
            value={value?.[side]}
            presets={SPACING_PRESETS}
            kind={kind}
            inherited={value?.[side] === undefined && inheritedValue?.[side] !== undefined}
            onChange={(v) => setSide(side, v)}
          />
        ))}
      </div>
    </div>
  )
}

function hexOf(value: string | undefined, palette: { token: string; hex: string }[]) {
  if (!value) return undefined
  if (isValidHex(value)) return value
  return palette.find((c) => c.token === value)?.hex
}

/**
 * EB-04b: the `_style` custom field. Draws the Style or Advanced tab (nothing on Content), with
 * per-device values for spacing, font size and alignment. Controls follow the brand locks.
 */
export function StyleField({
  value,
  onChange,
}: {
  value: unknown
  onChange: (value: BlockStyle | undefined) => void
}) {
  const { ds, tab } = useStylePanel()
  const width = usePuckSelector((s) => s.appState.ui.viewports.current.width)
  const dispatch = usePuckSelector((s) => s.dispatch)
  const device = deviceForWidth(typeof width === 'number' ? width : undefined)
  const style: BlockStyle =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as BlockStyle) : {}

  if (tab === 'content') return <></>

  const update = (patch: Partial<BlockStyle>) => onChange(compactStyle({ ...style, ...patch }))
  const setResponsive = <K extends 'fontSize' | 'textAlign' | 'padding' | 'margin'>(
    key: K,
    v: NonNullable<BlockStyle[K]>[Device] | undefined,
  ) => {
    const current = { ...(style[key] as Responsive<unknown> | undefined) }
    if (v === undefined) delete current[device]
    else current[device] = v
    update({ [key]: Object.keys(current).length ? current : undefined } as Partial<BlockStyle>)
  }
  const inheritedFrom = <T,>(v: Responsive<T> | undefined) =>
    v?.[device] === undefined ? resolveDevice(v, device) : undefined
  const resetTab = () =>
    onChange(
      compactStyle(
        Object.fromEntries(
          Object.entries(style).filter(
            ([k]) =>
              !(tab === 'style' ? STYLE_TAB_KEYS : ADVANCED_TAB_KEYS).includes(
                k as keyof BlockStyle,
              ),
          ),
        ) as BlockStyle,
      ),
    )

  const deviceBar = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-[11px] text-deep-navy">{t.devices.editing(t.devices[device])}</span>
      <div role="group" aria-label={t.devices.editing(t.devices[device])} className="flex gap-1">
        {DEVICES.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={device === d}
            aria-label={t.devices[d]}
            title={t.devices[d]}
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
            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
              device === d ? 'bg-deep-navy text-white' : 'bg-warm-ivory text-deep-navy'
            }`}
          >
            {t.devices[d]}
          </button>
        ))}
      </div>
    </div>
  )

  const locked = !isOpen(ds, 'colors') || !isOpen(ds, 'sizes') || !isOpen(ds, 'fonts')
  const textHex = hexOf(style.textColor, ds.colors)
  const bgHex = hexOf(style.background, ds.colors)
  const ratio = textHex && bgHex ? contrastRatio(textHex, bgHex) : null

  return (
    <div className="pt-2" data-testid={`style-field-${tab}`}>
      {deviceBar}
      {locked ? <p className="mb-3 text-[11px] text-deep-navy/80">{t.lockedHint}</p> : null}

      {tab === 'style' ? (
        <>
          <Group title={t.groups.background}>
            <ColorControl
              label={t.fields.background}
              value={style.background}
              onChange={(v) => update({ background: v })}
            />
          </Group>
          <Group title={t.groups.text}>
            <ColorControl
              label={t.fields.textColor}
              value={style.textColor}
              onChange={(v) => update({ textColor: v })}
            />
            {ds.lock.contrastCheck && ratio !== null && ratio < 4.5 ? (
              <p
                role="alert"
                className="rounded-md bg-butter-cream px-2 py-1.5 text-[11px] text-deep-navy"
              >
                {t.contrastWarning(ratio.toFixed(2))}
              </p>
            ) : null}
            {isOpen(ds, 'fonts') ? (
              <SelectControl
                label={t.fields.fontFamily}
                value={style.fontFamily}
                options={DESIGN_FONT_OPTIONS.map((f) => f.value)}
                onChange={(v) => update({ fontFamily: v })}
              />
            ) : null}
            <LengthControl
              label={t.fields.fontSize}
              value={style.fontSize?.[device]}
              presets={FONT_SIZE_PRESETS}
              kind="fontSize"
              inherited={inheritedFrom(style.fontSize) !== undefined}
              onChange={(v) => setResponsive('fontSize', v)}
            />
            <SelectControl
              label={t.fields.fontWeight}
              value={style.fontWeight ? String(style.fontWeight) : undefined}
              options={FONT_WEIGHTS.map(String)}
              onChange={(v) => update({ fontWeight: v ? Number(v) : undefined })}
            />
            <SelectControl
              label={t.fields.lineHeight}
              value={style.lineHeight}
              options={LINE_HEIGHTS}
              onChange={(v) => update({ lineHeight: v })}
            />
            <SelectControl
              label={t.fields.textAlign}
              value={style.textAlign?.[device]}
              options={TEXT_ALIGNS}
              inherited={inheritedFrom(style.textAlign) !== undefined}
              onChange={(v) => setResponsive('textAlign', v)}
            />
          </Group>
          <Group title={t.groups.border}>
            <LengthControl
              label={t.fields.radius}
              value={style.radius}
              presets={RADIUS_PRESETS}
              kind="radius"
              onChange={(v) => update({ radius: v })}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel>{t.fields.borderWidth}</FieldLabel>
              <input
                type="number"
                min={0}
                max={16}
                aria-label={t.fields.borderWidth}
                value={style.borderWidth ?? ''}
                onChange={(e) =>
                  update({
                    borderWidth: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="h-8 rounded-md border border-deep-navy/20 px-2 text-xs text-deep-navy"
              />
            </div>
            <ColorControl
              label={t.fields.borderColor}
              value={style.borderColor}
              onChange={(v) => update({ borderColor: v })}
            />
          </Group>
          <Group title={t.groups.shadow}>
            <SelectControl
              label={t.fields.shadow}
              value={style.shadow}
              options={SHADOWS}
              onChange={(v) => update({ shadow: v })}
            />
          </Group>
        </>
      ) : (
        <>
          <Group title={t.groups.spacing}>
            <BoxControl
              label={t.fields.padding}
              kind="spacing"
              value={style.padding?.[device]}
              inheritedValue={inheritedFrom(style.padding)}
              onChange={(v) => setResponsive('padding', v)}
            />
            <BoxControl
              label={t.fields.margin}
              kind="margin"
              value={style.margin?.[device]}
              inheritedValue={inheritedFrom(style.margin)}
              onChange={(v) => setResponsive('margin', v)}
            />
          </Group>
          <Group title={t.groups.visibility}>
            <span className="font-ui text-xs font-semibold text-deep-navy">{t.fields.hideOn}</span>
            {DEVICES.map((d) => (
              <label key={d} className="flex items-center gap-2 text-xs text-deep-navy">
                <input
                  type="checkbox"
                  checked={style.hideOn?.includes(d) ?? false}
                  onChange={(e) => {
                    const set = new Set(style.hideOn ?? [])
                    if (e.target.checked) set.add(d)
                    else set.delete(d)
                    update({ hideOn: [...set] })
                  }}
                />
                {t.devices[d]}
              </label>
            ))}
          </Group>
          <Group title={t.groups.anchor}>
            <AnchorControl value={style.anchorId} onChange={(v) => update({ anchorId: v })} />
          </Group>
        </>
      )}

      <button
        type="button"
        onClick={resetTab}
        className="mt-1 rounded-lg border border-deep-navy/20 px-3 py-1.5 font-ui text-xs font-semibold text-deep-navy hover:bg-soft-pink/40"
      >
        {t.reset}
      </button>
    </div>
  )
}

function AnchorControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id}>{t.fields.anchorId}</FieldLabel>
      <input
        id={id}
        type="text"
        value={value ?? ''}
        placeholder="dang-ky"
        onChange={(e) => onChange(e.target.value.trim() || undefined)}
        className="h-8 rounded-md border border-deep-navy/20 px-2 text-xs text-deep-navy"
      />
      <span className="text-[11px] text-deep-navy/80">{t.fields.anchorHint}</span>
    </div>
  )
}
