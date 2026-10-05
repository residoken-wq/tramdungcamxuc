// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { normalizePageSlug } from '../../src/collections/Pages'

describe('page slug normalization', () => {
  it.each([
    ['ve-hana', 've-hana'],
    ['/ve-hana', 've-hana'],
    ['ve-hana/', 've-hana'],
    [' /ve-hana/ ', 've-hana'],
    ['/', '/'],
    [' / ', '/'],
    ['/coaching/growth-mirror/', 'coaching/growth-mirror'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizePageSlug(input)).toBe(expected)
  })

  it('rejects a//b with a Vietnamese slug error', () => {
    expect(() => normalizePageSlug('a//b')).toThrow(
      expect.objectContaining({
        data: {
          errors: [{ path: 'slug', message: 'Đường dẫn không được chứa hai dấu / liên tiếp.' }],
        },
      }),
    )
  })
})
