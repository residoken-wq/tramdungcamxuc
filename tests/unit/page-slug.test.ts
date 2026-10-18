import { describe, expect, it, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { normalizePageSlug, revalidatePage } from '../../src/collections/Pages'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

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

describe('revalidatePage hook (S)', () => {
  it('revalidates both current path and previous path when slug changes on published page', () => {
    vi.clearAllMocks()
    type HookArgs = Parameters<typeof revalidatePage>[0]
    revalidatePage({
      doc: { slug: 'gioi-thieu', _status: 'published' } as unknown as HookArgs['doc'],
      previousDoc: { slug: 've-hana', _status: 'published' } as unknown as HookArgs['previousDoc'],
    } as HookArgs)

    expect(revalidatePath).toHaveBeenCalledWith('/gioi-thieu')
    expect(revalidatePath).toHaveBeenCalledWith('/ve-hana')
  })

  it('revalidates root path correctly when slug is /', () => {
    vi.clearAllMocks()
    type HookArgs = Parameters<typeof revalidatePage>[0]
    revalidatePage({
      doc: { slug: '/', _status: 'published' } as unknown as HookArgs['doc'],
      previousDoc: {
        slug: 'trang-chu',
        _status: 'published',
      } as unknown as HookArgs['previousDoc'],
    } as HookArgs)

    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/trang-chu')
  })
})
