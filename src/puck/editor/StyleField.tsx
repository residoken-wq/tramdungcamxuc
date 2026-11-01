'use client'

import React, { useId, useState } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { contrastRatio, isOpen, isValidHex } from '@/lib/design/design-system'
import { DESIGN_FONT_OPTIONS } from '@/lib/design/fonts'
import { vi } from '@/lib/i18n/vi'
import {
  cleanLength,
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

const usePuckSelector = createUsePuck()
const t = vi.eb04

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1440, tablet: 768, mobile: 375 }

export function deviceForWidth(width: number | undefined): Device {
  if (!width || width >= 1024) return 'desktop'
  return width >= 768 ? 'tablet' : 'mobile'
}

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

const presetLabel = (value: string) => (t.presets as Record<string, string>)[value] ?? value

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-4 rounded-xl border border-deep-navy/10 p-3">
      <legend className="px-1 font-ui text-xs font-bold uppercase tracking-wide text-deep-navy">
        {title}
      </legend>
      <div className="flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-ui text-xs font-semibold text-deep-navy">
      {children}
    </label>
  )
}

function InheritedBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      title={t.devices.inheritedHint}
      className="ml-2 rounded bg-lavender-mist px-1.5 py-0.5 text-[10px] font-semibold text-deep-navy"
    >
      {t.devices.inherited}
    </span>
  )
}

/** Palette swatches (+ a free picker when colours are open). */
function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const { ds } = useStylePanel()
  const pickerId = useId()
  const free = isOpen(ds, 'colors')
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange(undefined)}
          className={`h-7 rounded-md border px-2 text-[11px] font-semibold ${
            !value
              ? 'border-bright-magenta text-deep-navy'
              : 'border-deep-navy/20 text-deep-navy/80'
          }`}
        >
          {t.fields.none}
        </button>
        {ds.colors.map((color) => (
          <button
            key={color.token}
            type="button"
            title={`${color.token} – ${color.label}`}
            aria-label={`${color.token} – ${color.label}`}
            aria-pressed={value === color.token}
            onClick={() => onChange(color.token)}
            className={`h-7 w-7 rounded-md border-2 ${
              value === color.token ? 'border-bright-magenta' : 'border-deep-navy/15'
            }`}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
      {free ? (
        <div className="flex items-center gap-2">
          <input
            id={pickerId}
            type="color"
            aria-label={`${label} – ${t.fields.customColor}`}
            value={value && isValidHex(value) ? value.toLowerCase() : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
          />
          <span className="text-[11px] text-deep-navy/70">{t.fields.customColor}</span>
        </div>
      ) : null}
    </div>
  )
}

/** Preset select, plus a free value input when sizes are open. */
function LengthControl({
  label,
  value,
  presets,
  kind,
  onChange,
  inherited = false,
}: {
  label: string
  value: string | undefined
  presets: readonly string[]
  kind: LengthKind
  onChange: (value: string | undefined) => void
  inherited?: boolean
}) {
  const { ds } = useStylePanel()
  const id = useId()
  const free = isOpen(ds, 'sizes')
  const isPreset = value === undefined || presets.includes(value)
  const [draft, setDraft] = useState(isPreset ? '' : (value ?? ''))
  const invalid = draft !== '' && cleanLength(draft, kind, presets, ds) === undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <InheritedBadge show={inherited} />
      </div>
      <select
        id={id}
        value={isPreset ? (value ?? '') : ''}
        onChange={(e) => {
          setDraft('')
          onChange(e.target.value || undefined)
        }}
        className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
      >
        <option value="">{t.fields.defaultValue}</option>
        {presets.map((p) => (
          <option key={p} value={p}>
            {presetLabel(p)}
          </option>
        ))}
      </select>
      {free ? (
        <>
          <input
            type="text"
            aria-label={`${label} – ${t.fields.freeValue}`}
            placeholder={t.fields.freeValue}
            value={draft}
            onChange={(e) => {
              const next = e.target.value.trim()
              setDraft(next)
              if (next === '') onChange(undefined)
              else if (cleanLength(next, kind, presets, ds) !== undefined) onChange(next)
            }}
            className={`h-8 rounded-md border px-2 text-xs text-deep-navy ${
              invalid ? 'border-accent-pink' : 'border-deep-navy/20'
            }`}
          />
          {invalid ? (
            <span role="alert" className="text-[11px] text-deep-navy">
              {t.invalidValue}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function SelectControl({
  label,
  value,
  options,
  onChange,
  inherited = false,
}: {
  label: string
  value: string | undefined
  options: readonly string[]
  onChange: (value: string | undefined) => void
  inherited?: boolean
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <InheritedBadge show={inherited} />
      </div>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
      >
        <option value="">{t.fields.defaultValue}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {presetLabel(o)}
          </option>
        ))}
      </select>
    </div>
  )
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
