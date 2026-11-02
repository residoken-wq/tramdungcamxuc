'use client'

import React, { useId, useState } from 'react'
import { isOpen, isValidHex } from '@/lib/design/design-system'
import { vi } from '@/lib/i18n/vi'
import { cleanLength, type Device, type LengthKind } from '@/puck/style/style-schema'
import { useStylePanel } from './style-context'

export const t4 = vi.eb04
export const t5 = vi.eb05

export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1440, tablet: 768, mobile: 375 }

export function deviceForWidth(width: number | undefined): Device {
  if (!width || width >= 1024) return 'desktop'
  return width >= 768 ? 'tablet' : 'mobile'
}

export const presetLabel = (value: string) => (t4.presets as Record<string, string>)[value] ?? value

export function Group({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <fieldset className={`mb-4 rounded-xl border border-deep-navy/10 p-3 ${className}`}>
      <legend className="px-1 font-ui text-xs font-bold uppercase tracking-wide text-deep-navy">
        {title}
      </legend>
      <div className="flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-ui text-xs font-semibold text-deep-navy">
      {children}
    </label>
  )
}

export function InheritedBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      title={t4.devices.inheritedHint}
      className="ml-2 rounded bg-lavender-mist px-1.5 py-0.5 text-[10px] font-semibold text-deep-navy"
    >
      {t4.devices.inherited}
    </span>
  )
}

/** Palette swatches (+ a free picker when colours are open). */
export function ColorControl({
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
          className={`h-7 rounded-md border px-2 text-[11px] font-semibold transition-colors ${
            !value
              ? 'border-bright-magenta text-deep-navy'
              : 'border-deep-navy/20 text-deep-navy/80 hover:border-deep-navy/40'
          }`}
        >
          {t4.fields.none}
        </button>
        {ds.colors.map((color) => (
          <button
            key={color.token}
            type="button"
            title={`${color.token} – ${color.label}`}
            aria-label={`${color.token} – ${color.label}`}
            aria-pressed={value === color.token}
            onClick={() => onChange(color.token)}
            className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-105 ${
              value === color.token ? 'border-bright-magenta shadow-sm' : 'border-deep-navy/15'
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
            aria-label={`${label} – ${t4.fields.customColor}`}
            value={value && isValidHex(value) ? value.toLowerCase() : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
          />
          <span className="text-[11px] text-deep-navy/70">{t4.fields.customColor}</span>
        </div>
      ) : null}
    </div>
  )
}

/** Preset select, plus a free value input when sizes are open. */
export function LengthControl({
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
        <option value="">{t4.fields.defaultValue}</option>
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
            aria-label={`${label} – ${t4.fields.freeValue}`}
            placeholder={t4.fields.freeValue}
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
              {t4.invalidValue}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function SelectControl({
  label,
  value,
  options,
  onChange,
  inherited = false,
  defaultLabel,
}: {
  label: string
  value: string | undefined
  options: readonly { label: string; value: string }[] | readonly string[]
  onChange: (value: string | undefined) => void
  inherited?: boolean
  defaultLabel?: string
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
        <option value="">{defaultLabel ?? t4.fields.defaultValue}</option>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lbl = typeof opt === 'string' ? presetLabel(opt) : opt.label
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          )
        })}
      </select>
    </div>
  )
}
