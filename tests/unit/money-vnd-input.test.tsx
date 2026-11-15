import React, { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { formatVndDigits, parseVndInput, VND_INPUT_MAX } from '../../src/lib/format'
import { VndInput } from '../../src/components/admin/money/VndInput'
import { money } from '../../src/fields/content'

describe('VND money format in the CMS', () => {
  it('formatVndDigits groups thousands with dots', () => {
    expect(formatVndDigits(0)).toBe('0')
    expect(formatVndDigits(149000)).toBe('149.000')
    expect(formatVndDigits(1750000)).toBe('1.750.000')
    expect(formatVndDigits(null)).toBe('')
    expect(formatVndDigits(undefined)).toBe('')
    expect(formatVndDigits(-5)).toBe('')
    expect(formatVndDigits(Number.NaN)).toBe('')
  })

  it('parseVndInput reads dots, commas, spaces and the đ suffix back to a number', () => {
    expect(parseVndInput('1.750.000')).toBe(1750000)
    expect(parseVndInput('1,750,000 đ')).toBe(1750000)
    expect(parseVndInput('250000')).toBe(250000)
    expect(parseVndInput('007')).toBe(7)
    expect(parseVndInput('0')).toBe(0)
    expect(parseVndInput('')).toBeNull()
    expect(parseVndInput('abc')).toBeNull()
    expect(parseVndInput('9'.repeat(20))).toBe(VND_INPUT_MAX)
  })

  it('VndInput shows dots while typing and hands back a plain number', () => {
    const seen: Array<number | null> = []
    function Harness() {
      const [value, setValue] = useState<number | null>(null)
      return (
        <VndInput
          aria-label="Giá bán"
          value={value}
          onValueChange={(next) => {
            seen.push(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Giá bán' }) as HTMLInputElement
    expect(input.getAttribute('inputmode')).toBe('numeric')

    fireEvent.change(input, { target: { value: '1750000' } })
    expect(input.value).toBe('1.750.000')
    expect(seen.at(-1)).toBe(1750000)

    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    expect(seen.at(-1)).toBeNull()
  })

  it('money() keeps a number column and wires the VND admin components', () => {
    const field = money('price', 'Giá bán')
    expect(field.type).toBe('number')
    expect(field.min).toBe(0)
    expect(field.admin?.components?.Field).toBe('@/components/admin/money/MoneyField#MoneyField')
    expect(field.admin?.components?.Cell).toBe('@/components/admin/money/MoneyCell#MoneyCell')
    const custom = money('salePrice', 'Giá ưu đãi', undefined, {
      admin: { description: 'Mô tả riêng', readOnly: true },
    })
    expect(custom.admin?.description).toBe('Mô tả riêng')
    expect(custom.admin?.readOnly).toBe(true)
  })
})
