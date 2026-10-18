import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildPreviewUrl,
  buildDetailPreviewUrl,
  collectionLivePreview,
  globalLivePreview,
  LIVE_PREVIEW_BREAKPOINTS,
} from '@/lib/live-preview'

const { auth, find, findByID, notFoundMock } = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn(),
  notFoundMock: vi.fn(() => {
    const error = new Error('NEXT_NOT_FOUND')
    ;(error as unknown as { digest: string }).digest = 'NEXT_NOT_FOUND'
    throw error
  }),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/payload.config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/navigation', () => ({ notFound: notFoundMock }))
vi.mock('payload', () => ({ getPayload: async () => ({ auth, find, findByID }) }))

import { getAdminPreviewUser } from '@/lib/live-preview.server'
import PreviewPage, { generateMetadata } from '@/app/(site)/(shell)/xem-truoc/[loai]/[id]/page'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildPreviewUrl mapping for all collections and globals', () => {
  it('returns default 3 breakpoints (375, 768, 1440)', () => {
    expect(LIVE_PREVIEW_BREAKPOINTS.map((b) => b.width)).toEqual([375, 768, 1440])
    expect(collectionLivePreview('products')?.breakpoints?.map((b) => b.width)).toEqual([
      375, 768, 1440,
    ])
    expect(globalLivePreview('siteSettings')?.breakpoints?.map((b) => b.width)).toEqual([
      375, 768, 1440,
    ])
  })

  describe('products collection mapping', () => {
    it('maps digital_tool on habit web to /habit/1-percent-better', () => {
      expect(buildPreviewUrl('products', { id: 101, type: 'digital_tool', web: 'habit' })).toBe(
        '/habit/1-percent-better?preview=1&previewId=101',
      )
    })

    it('maps ebook to /tai-nguyen/[slug]', () => {
      expect(buildPreviewUrl('products', { id: 102, type: 'ebook', slug: 'so-tay-cam-xuc' })).toBe(
        '/tai-nguyen/so-tay-cam-xuc?preview=1&previewId=102',
      )
    })

    it('maps toolkit to /tai-nguyen/[slug]', () => {
      expect(buildPreviewUrl('products', { id: 103, type: 'toolkit', slug: 'bo-cong-cu-eq' })).toBe(
        '/tai-nguyen/bo-cong-cu-eq?preview=1&previewId=103',
      )
    })

    it('maps package to /lo-trinh-chuyen-minh', () => {
      expect(
        buildPreviewUrl('products', { id: 104, type: 'package', slug: 'growth-mirror-clear' }),
      ).toBe('/lo-trinh-chuyen-minh?preview=1&previewId=104')
    })

    it.each(['physical_external', 'workshop', 'coaching_trial', 'b2b'])(
      'maps %s to dedicated /xem-truoc/san-pham/[id]',
      (type) => {
        expect(buildPreviewUrl('products', { id: 105, type })).toBe(
          '/xem-truoc/san-pham/105?preview=1',
        )
      },
    )

    it('returns null when product ebook/toolkit is missing slug', () => {
      expect(buildPreviewUrl('products', { id: 106, type: 'ebook' })).toBeNull()
      expect(buildPreviewUrl('products', { id: 107, type: 'toolkit', slug: '   ' })).toBeNull()
    })

    it('returns null when product has no id for dedicated preview', () => {
      expect(buildPreviewUrl('products', { type: 'physical_external' })).toBeNull()
      expect(buildPreviewUrl('products', { id: '   ', type: 'workshop' })).toBeNull()
    })
  })

  describe('lessons collection mapping', () => {
    it('maps lesson to /habit/hoc/[id]', () => {
      expect(buildPreviewUrl('lessons', { id: 'lesson-123' })).toBe(
        '/habit/hoc/lesson-123?preview=1',
      )
      expect(buildPreviewUrl('lessons', { id: 456 })).toBe('/habit/hoc/456?preview=1')
    })

    it('returns null when lesson has missing or empty id', () => {
      expect(buildPreviewUrl('lessons', {})).toBeNull()
      expect(buildPreviewUrl('lessons', { id: '' })).toBeNull()
    })
  })

  describe('eqCards collection mapping', () => {
    it('maps eqCard to /eq-buddy/the/[qrSlug]', () => {
      expect(buildPreviewUrl('eqCards', { id: 201, qrSlug: 'b-01-binh-an' })).toBe(
        '/eq-buddy/the/b-01-binh-an?preview=1&previewId=201',
      )
    })

    it('returns null when eqCard is missing qrSlug', () => {
      expect(buildPreviewUrl('eqCards', { id: 201 })).toBeNull()
      expect(buildPreviewUrl('eqCards', { id: 201, qrSlug: '   ' })).toBeNull()
    })
  })

  describe('testimonials collection mapping', () => {
    it('maps testimonial to /xem-truoc/loi-chia-se/[id]', () => {
      expect(buildPreviewUrl('testimonials', { id: 301 })).toBe(
        '/xem-truoc/loi-chia-se/301?preview=1',
      )
    })

    it('returns null when testimonial is missing id', () => {
      expect(buildPreviewUrl('testimonials', {})).toBeNull()
    })
  })

  describe('legalPages collection mapping', () => {
    it('maps legalPage to /[slug]', () => {
      expect(buildPreviewUrl('legalPages', { id: 401, slug: 'dieu-khoan-su-dung' })).toBe(
        '/dieu-khoan-su-dung?preview=1&previewId=401',
      )
    })

    it('returns null when legalPage is missing slug', () => {
      expect(buildPreviewUrl('legalPages', { id: 401 })).toBeNull()
      expect(buildPreviewUrl('legalPages', { slug: '' })).toBeNull()
    })
  })

  describe('workshops collection mapping', () => {
    it('maps workshop to /xem-truoc/workshop/[id]', () => {
      expect(buildPreviewUrl('workshops', { id: 501 })).toBe('/xem-truoc/workshop/501?preview=1')
    })

    it('returns null when workshop is missing id', () => {
      expect(buildPreviewUrl('workshops', {})).toBeNull()
    })
  })

  describe('globals mapping', () => {
    it('maps siteSettings and navigation globals to home page /?preview=1', () => {
      expect(buildPreviewUrl('siteSettings')).toBe('/?preview=1')
      expect(buildPreviewUrl('navigation')).toBe('/?preview=1')
    })
  })

  describe('slug and parameter encoding and safety', () => {
    it('encodes special characters, slashes, spaces and query symbols in slugs', () => {
      expect(
        buildPreviewUrl('products', {
          id: 601,
          type: 'ebook',
          slug: 'sách & tài liệu/hè 2026?v=1#anchor',
        }),
      ).toBe(
        '/tai-nguyen/s%C3%A1ch%20%26%20t%C3%A0i%20li%E1%BB%87u%2Fh%C3%A8%202026%3Fv%3D1%23anchor?preview=1&previewId=601',
      )

      expect(
        buildPreviewUrl('legalPages', {
          id: 602,
          slug: 'chính-sách/bảo-mật?admin=1',
        }),
      ).toBe('/ch%C3%ADnh-s%C3%A1ch%2Fb%E1%BA%A3o-m%E1%BA%ADt%3Fadmin%3D1?preview=1&previewId=602')
    })

    it('returns null for null, undefined, or non-object data', () => {
      expect(buildPreviewUrl('products', null)).toBeNull()
      expect(buildPreviewUrl('products', undefined)).toBeNull()
      expect(buildDetailPreviewUrl('products', null)).toBeNull()
    })
  })
})

describe('getAdminPreviewUser authentication verification', () => {
  it('returns null when preview query parameter is missing', async () => {
    const user = await getAdminPreviewUser({})
    expect(user).toBeNull()
    expect(auth).not.toHaveBeenCalled()
  })

  it('returns null when preview=1 but user is a guest (null)', async () => {
    auth.mockResolvedValue({ user: null })
    const user = await getAdminPreviewUser({ preview: '1' })
    expect(user).toBeNull()
    expect(auth).toHaveBeenCalled()
  })

  it('returns null when preview=1 but user is a customer', async () => {
    auth.mockResolvedValue({ user: { id: 99, collection: 'customers', email: 'cust@test.com' } })
    const user = await getAdminPreviewUser({ preview: '1' })
    expect(user).toBeNull()
  })

  it.each(['owner', 'editor', 'admin'])(
    'returns the admin user object when user has role %s in users collection',
    async (role) => {
      const adminUser = { id: 1, collection: 'users', role, email: 'admin@test.com' }
      auth.mockResolvedValue({ user: adminUser })
      const result = await getAdminPreviewUser({ preview: '1' })
      expect(result).toEqual(adminUser)
    },
  )
})

describe('Dedicated preview route /xem-truoc/[loai]/[id]', () => {
  it('has robots noindex, nofollow metadata', async () => {
    const meta = await generateMetadata()
    expect(meta.robots).toEqual({ index: false, follow: false })
  })

  it('throws 404 for unsupported preview type', async () => {
    await expect(
      PreviewPage({ params: Promise.resolve({ loai: 'invalid-type', id: '1' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
  })

  it('throws 404 for unauthenticated guest', async () => {
    auth.mockResolvedValue({ user: null })
    await expect(
      PreviewPage({ params: Promise.resolve({ loai: 'san-pham', id: '123' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
    expect(findByID).not.toHaveBeenCalled()
  })

  it('throws 404 for logged-in customer', async () => {
    auth.mockResolvedValue({ user: { id: 10, collection: 'customers' } })
    await expect(
      PreviewPage({ params: Promise.resolve({ loai: 'san-pham', id: '123' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
    expect(findByID).not.toHaveBeenCalled()
  })

  it('queries draft with overrideAccess: false for admin user and renders component', async () => {
    const adminUser = { id: 1, collection: 'users', role: 'editor' }
    auth.mockResolvedValue({ user: adminUser })
    findByID.mockResolvedValue({
      id: 123,
      name: 'Khóa học Thử nghiệm',
      type: 'physical_external',
      _status: 'draft',
    })

    const element = await PreviewPage({
      params: Promise.resolve({ loai: 'san-pham', id: '123' }),
    })
    expect(element).toBeDefined()
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        id: 123,
        draft: true,
        overrideAccess: false,
        user: adminUser,
        depth: 1,
      }),
    )
  })

  it('throws 404 if item is not found or findByID rejects', async () => {
    const adminUser = { id: 1, collection: 'users', role: 'owner' }
    auth.mockResolvedValue({ user: adminUser })
    findByID.mockResolvedValue(null)

    await expect(
      PreviewPage({ params: Promise.resolve({ loai: 'loi-chia-se', id: '999' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
  })
})
