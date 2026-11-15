import React from 'react'
import { describe, expect, it } from 'vitest'
import { pickCopy, pickCopyList, hasCopy } from '@/lib/copy'

describe('BX-05: pickCopy & helper logic', () => {
  it('returns value when string is non-empty', () => {
    expect(pickCopy('Tiêu đề thực tế', 'Tiêu đề mặc định', false)).toBe('Tiêu đề thực tế')
    expect(pickCopy('Tiêu đề thực tế', 'Tiêu đề mặc định', true)).toBe('Tiêu đề thực tế')
    expect(pickCopy('  Có khoảng trắng  ', 'Tiêu đề mặc định', false)).toBe('  Có khoảng trắng  ')
  })

  it('returns null when value is empty/whitespace and useDefault is false/undefined', () => {
    expect(pickCopy('', 'Mặc định', false)).toBeNull()
    expect(pickCopy('   ', 'Mặc định', false)).toBeNull()
    expect(pickCopy(null, 'Mặc định', false)).toBeNull()
    expect(pickCopy(undefined, 'Mặc định', false)).toBeNull()
    expect(pickCopy('', 'Mặc định')).toBeNull()
    expect(pickCopy('   ', 'Mặc định')).toBeNull()
    expect(pickCopy(null, 'Mặc định')).toBeNull()
    expect(pickCopy(undefined, 'Mặc định')).toBeNull()
  })

  it('returns fallback when value is empty/whitespace and useDefault is true', () => {
    expect(pickCopy('', 'Mặc định', true)).toBe('Mặc định')
    expect(pickCopy('   ', 'Mặc định', true)).toBe('Mặc định')
    expect(pickCopy(null, 'Mặc định', true)).toBe('Mặc định')
    expect(pickCopy(undefined, 'Mặc định', true)).toBe('Mặc định')
  })

  it('preserves React element regardless of useDefault', () => {
    const el = <span>Sửa trực tiếp</span>
    expect(pickCopy(el, 'Mặc định', false)).toBe(el)
    expect(pickCopy(el, 'Mặc định', true)).toBe(el)
  })

  it('pickCopyList returns list when non-empty, fallback when empty + useDefault, empty list when empty + false', () => {
    const list = [{ id: 1, title: 'Item 1' }]
    const fallback = [{ id: 2, title: 'Fallback' }]

    expect(pickCopyList(list, fallback, false)).toEqual(list)
    expect(pickCopyList(list, fallback, true)).toEqual(list)

    expect(pickCopyList([], fallback, false)).toEqual([])
    expect(pickCopyList(null, fallback, false)).toEqual([])
    expect(pickCopyList(undefined, fallback, false)).toEqual([])

    expect(pickCopyList([], fallback, true)).toEqual(fallback)
    expect(pickCopyList(null, fallback, true)).toEqual(fallback)
    expect(pickCopyList(undefined, fallback, true)).toEqual(fallback)
  })

  it('hasCopy correctly checks if any copy exists in section', () => {
    expect(hasCopy('', null, undefined, '   ')).toBe(false)
    expect(hasCopy([], '', null)).toBe(false)
    expect(hasCopy('', 'Có chữ', null)).toBe(true)
    expect(hasCopy(['item'])).toBe(true)
    expect(hasCopy(<span>El</span>)).toBe(true)
  })
})
