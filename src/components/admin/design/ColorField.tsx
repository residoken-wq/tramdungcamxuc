'use client'

import React, { useId } from 'react'
import type { TextFieldClientComponent } from 'payload'
import { FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { contrastRatio, isValidHex } from '@/lib/design/design-system'
import { BRAND_COLORS_HEX } from '@/lib/brand/tokens'
import { vi } from '@/lib/i18n/vi'

const t = vi.eb01.colors

const formatRatio = (ratio: number | null): string => (ratio === null ? '–' : ratio.toFixed(2))

/** EB-01: HEX text input kept in sync with the browser colour picker, plus contrast hints. */
export const ColorField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const inputId = useId()
  const pickerId = useId()
  const hex = typeof value === 'string' ? value : ''
  const valid = isValidHex(hex)
  const label = typeof field.label === 'string' ? field.label : t.hex

  return (
    <div className="field-type text" style={{ flex: '1 1 auto' }}>
      <FieldLabel htmlFor={inputId} label={label} required={field.required} path={path} />
      <FieldError path={path} showError={showError} message={errorMessage} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          id={pickerId}
          type="color"
          aria-label={t.picker}
          value={valid ? hex.toLowerCase() : '#000000'}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
          style={{ width: 44, height: 40, padding: 0, border: 'none', background: 'none' }}
        />
        <input
          id={inputId}
          type="text"
          value={hex}
          placeholder="#280A60"
          maxLength={7}
          onChange={(event) => setValue(event.target.value.trim())}
          style={{ flex: 1, minWidth: 0 }}
        />
        <span
          role="img"
          aria-label={`${t.swatch}: ${valid ? hex : '–'}`}
          data-testid="color-swatch"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid var(--theme-elevation-150)',
            background: valid ? hex : 'transparent',
          }}
        />
      </div>
      {valid ? (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
          {t.contrastWhite(formatRatio(contrastRatio(hex, '#FFFFFF')))} ·{' '}
          {t.contrastIvory(formatRatio(contrastRatio(hex, BRAND_COLORS_HEX['warm-ivory'])))}.{' '}
          {t.contrastHint}
        </p>
      ) : null}
    </div>
  )
}
