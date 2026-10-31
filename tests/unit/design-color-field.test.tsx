import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi as vitest } from 'vitest'

// Minimal stand-in for Payload's form state: useField keeps the value in React state,
// starting from `initialValue` (set by each test before rendering).
let initialValue = ''
vitest.mock('@payloadcms/ui', async () => {
  const { useState } = await import('react')
  return {
    useField: () => {
      const [value, setValue] = useState(initialValue)
      return {
        value,
        setValue: (v: unknown) => setValue(String(v)),
        showError: false,
        errorMessage: undefined,
      }
    },
    FieldLabel: ({ label, htmlFor }: { label: string; htmlFor: string }) => (
      <label htmlFor={htmlFor}>{label}</label>
    ),
    FieldError: () => null,
  }
})

import { ColorField } from '@/components/admin/design/ColorField'

function renderField(initial: string) {
  initialValue = initial
  return render(
    <ColorField path="colors.0.hex" field={{ name: 'hex', label: 'Màu (HEX)', required: true }} />,
  )
}

describe('EB-01: ColorField', () => {
  afterEach(cleanup)

  it('keeps the HEX input and the colour picker in sync', () => {
    renderField('#280A60')
    const hexInput = screen.getByLabelText('Màu (HEX)') as HTMLInputElement
    const picker = screen.getByLabelText('Chọn màu') as HTMLInputElement
    expect(picker.value).toBe('#280a60')

    fireEvent.change(picker, { target: { value: '#ef3b83' } })
    expect(hexInput.value).toBe('#EF3B83')

    fireEvent.change(hexInput, { target: { value: '#112233' } })
    expect(picker.value).toBe('#112233')
  })

  it('shows contrast hints for a valid colour', () => {
    renderField('#280A60')
    expect(screen.getByText(/Tương phản với nền trắng: \d+\.\d{2}:1/)).toBeTruthy()
  })

  it('does not break on an invalid HEX', () => {
    renderField('#12')
    expect(screen.getByTestId('color-swatch').getAttribute('aria-label')).toContain('–')
    expect(screen.queryByText(/Tương phản/)).toBeNull()
  })
})
