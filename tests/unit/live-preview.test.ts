import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDetailPreviewUrl, detailLivePreview } from '@/lib/live-preview'

const { auth, find } = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/payload.config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('payload', () => ({ getPayload: async () => ({ auth, find }) }))
import { getDetailPreview } from '@/lib/live-preview.server'

beforeEach(() => {
  vi.clearAllMocks()
  find.mockResolvedValue({ docs: [{ id: 42, name: 'Draft' }] })
})

describe('detail preview URLs', () => {
  it.each([
    ['services', 'coaching'],
    ['programs', 'doanh-nghiep'],
    ['posts', 'blog'],
  ] as const)('builds a same-origin URL for %s', (collection, route) => {
    expect(buildDetailPreviewUrl(collection, { slug: 'test', id: 42 })).toBe(
      `/${route}/test?preview=1&previewId=42`,
    )
    expect(detailLivePreview(collection)?.breakpoints?.map(({ width }) => width)).toEqual([
      375, 768, 1440,
    ])
  })
  it('does not allow slugs to inject queries or change origin', () => {
    expect(buildDetailPreviewUrl('posts', { slug: '//host/path?preview=0' })).toBe(
      '/blog/%2F%2Fhost%2Fpath%3Fpreview%3D0?preview=1',
    )
    expect(buildDetailPreviewUrl('posts', {})).toBeNull()
  })
})

describe('draft authorization', () => {
  it.each(['services', 'programs', 'posts'] as const)(
    'never queries %s drafts for guests',
    async (collection) => {
      auth.mockResolvedValue({ user: null })
      expect(
        await getDetailPreview(collection, 'test', { preview: '1', previewId: '42' }),
      ).toBeNull()
      expect(find).not.toHaveBeenCalled()
    },
  )
  it('rejects authenticated customers', async () => {
    auth.mockResolvedValue({ user: { id: 1, collection: 'customers' } })
    expect(await getDetailPreview('services', 'test', { preview: '1' })).toBeNull()
    expect(find).not.toHaveBeenCalled()
  })
  it('does not authenticate or read drafts on public requests', async () => {
    expect(await getDetailPreview('services', 'test', {})).toBeNull()
    expect(auth).not.toHaveBeenCalled()
    expect(find).not.toHaveBeenCalled()
  })
  it.each(['owner', 'editor'])('allows an authenticated %s with access checks', async (role) => {
    const user = { id: 1, collection: 'users', role }
    auth.mockResolvedValue({ user })
    expect(
      await getDetailPreview('services', 'changed-slug', { preview: '1', previewId: '42' }),
    ).toEqual({ id: 42, name: 'Draft' })
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: true,
        overrideAccess: false,
        user,
        where: { id: { equals: '42' } },
      }),
    )
  })
})
