'use client'

import React, { useLayoutEffect, useRef } from 'react'
import { formatVndDigits, parseVndInput } from '@/lib/format'
import { vi } from '@/lib/i18n/vi'

export interface VndInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number | null | undefined
  onValueChange: (value: number | null) => void
  /** Class for the wrapper; the input itself takes `className`. */
  wrapperClassName?: string
}

/**
 * Money input in Vietnamese format: shows `1.750.000` while typing, with an `đ` suffix, and
 * hands back a plain number of đồng. The caret stays after the same digit when dots are
 * re-inserted, so typing in the middle of a number does not jump to the end.
 */
export function VndInput({
  value,
  onValueChange,
  wrapperClassName,
  className,
  style,
  readOnly,
  ...rest
}: VndInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const caretDigits = useRef<number | null>(null)
  const display = formatVndDigits(value)

  useLayoutEffect(() => {
    const el = ref.current
    const digitsBefore = caretDigits.current
    if (!el || digitsBefore === null || document.activeElement !== el) return
    caretDigits.current = null
    let pos = 0
    let seen = 0
    while (pos < display.length && seen < digitsBefore) {
      if (/\d/.test(display[pos])) seen++
      pos++
    }
    el.setSelectionRange(pos, pos)
  }, [display])

  return (
    <div
      className={wrapperClassName}
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
    >
      <input
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        readOnly={readOnly}
        value={display}
        onChange={(event) => {
          const { value: raw, selectionStart } = event.target
          caretDigits.current = raw.slice(0, selectionStart ?? raw.length).replace(/\D/g, '').length
          onValueChange(parseVndInput(raw))
        }}
        className={className}
        style={{ paddingRight: 32, width: '100%', ...style }}
      />
      <span
        aria-hidden="true"
        style={{ position: 'absolute', right: 12, pointerEvents: 'none', opacity: 0.6 }}
      >
        {vi.cms.money.suffix}
      </span>
    </div>
  )
}
