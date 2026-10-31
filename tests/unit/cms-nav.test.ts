import { describe, expect, it } from 'vitest'
import configPromise from '../../src/payload.config'
import { vi } from '../../src/lib/i18n/vi'
import { isHiddenFromEditor } from '../../src/lib/auth/access'
import type { ClientUser } from 'payload'

describe('CMS Admin Navigation & Access (CM-01)', () => {
  const validGroups = [
    vi.cms.nav.website,
    vi.cms.nav.commerce,
    vi.cms.nav.habit,
    vi.cms.nav.eq,
    vi.cms.nav.customers,
    vi.cms.nav.system,
  ]

  // Filter out Payload internal collections (payload-kv, payload-locked-documents, payload-preferences, payload-migrations)
  const isProjectCollection = (slug: string) => !slug.startsWith('payload-')

  describe('1. Nhóm và thứ tự menu admin', () => {
    it('mọi collection đều có admin.group thuộc danh sách 6 nhóm hợp lệ', async () => {
      const config = await configPromise
      const projectCollections = config.collections.filter((col) => isProjectCollection(col.slug))
      // 35 + faqs, teamMembers (SM-01) + habitReflections (HB-12)
      expect(projectCollections.length).toBe(38)

      for (const col of projectCollections) {
        expect(
          col.admin?.group,
          `Collection "${col.slug}" phải có admin.group thuộc danh sách 6 nhóm hợp lệ`,
        ).toBeDefined()
        expect(validGroups).toContain(col.admin?.group)
      }
    })

    it('mọi global đều có admin.group thuộc danh sách 6 nhóm hợp lệ', async () => {
      const config = await configPromise
      expect(config.globals).toBeDefined()
      expect(config.globals!.length).toBe(4)

      for (const gl of config.globals!) {
        expect(
          gl.admin?.group,
          `Global "${gl.slug}" phải có admin.group thuộc danh sách 6 nhóm hợp lệ`,
        ).toBeDefined()
        expect(validGroups).toContain(gl.admin?.group)
      }

      expect(config.globals?.find((g) => g.slug === 'navigation')?.admin?.group).toBe(
        vi.cms.nav.website,
      )
      expect(config.globals?.find((g) => g.slug === 'siteSettings')?.admin?.group).toBe(
        vi.cms.nav.website,
      )
      expect(config.globals?.find((g) => g.slug === 'designSystem')?.admin?.group).toBe(
        vi.cms.nav.website,
      )
      expect(config.globals?.find((g) => g.slug === 'habitJourneyContent')?.admin?.group).toBe(
        vi.cms.nav.habit,
      )
    })

    it('mảng collections trong config được sắp xếp theo đúng thứ tự 6 nhóm nghiệp vụ', async () => {
      const config = await configPromise
      const projectCollections = config.collections.filter((col) => isProjectCollection(col.slug))
      const groupOrder: string[] = validGroups

      let currentGroupIndex = 0
      for (const col of projectCollections) {
        const colGroup = col.admin?.group as string
        const colGroupIndex = groupOrder.indexOf(colGroup)
        expect(colGroupIndex).toBeGreaterThanOrEqual(currentGroupIndex)
        if (colGroupIndex > currentGroupIndex) {
          currentGroupIndex = colGroupIndex
        }
      }
    })
  })

  describe('2. Hàm ẩn isHiddenFromEditor và phân quyền theo vai trò', () => {
    it('trả về false cho tài khoản owner', () => {
      const ownerUser = {
        id: 1,
        email: 'owner@example.test',
        role: 'owner',
      } as unknown as ClientUser
      expect(isHiddenFromEditor({ user: ownerUser })).toBe(false)
    })

    it('trả về true cho tài khoản editor', () => {
      const editorUser = {
        id: 2,
        email: 'editor@example.test',
        role: 'editor',
      } as unknown as ClientUser
      expect(isHiddenFromEditor({ user: editorUser })).toBe(true)
    })

    it('trả về true cho user vắng mặt hoặc role khác', () => {
      expect(isHiddenFromEditor({ user: null })).toBe(true)
      expect(isHiddenFromEditor({ user: undefined })).toBe(true)
      expect(
        isHiddenFromEditor({ user: { id: 3, role: 'customer' } as unknown as ClientUser }),
      ).toBe(true)
    })

    it('tất cả 15 collections thuộc nhóm Hệ thống có admin.hidden là hàm ẩn với editor', async () => {
      const config = await configPromise
      const systemCollections = config.collections.filter(
        (col) => isProjectCollection(col.slug) && col.admin?.group === vi.cms.nav.system,
      )

      expect(systemCollections.length).toBe(15)

      const editorUser = {
        id: 2,
        email: 'editor@example.test',
        role: 'editor',
      } as unknown as ClientUser
      const ownerUser = {
        id: 1,
        email: 'owner@example.test',
        role: 'owner',
      } as unknown as ClientUser

      for (const col of systemCollections) {
        expect(
          typeof col.admin?.hidden,
          `Collection "${col.slug}" thuộc Hệ thống phải có admin.hidden là hàm`,
        ).toBe('function')

        const hideFn = col.admin!.hidden as (args: { user: ClientUser }) => boolean
        expect(hideFn({ user: editorUser })).toBe(true)
        expect(hideFn({ user: ownerUser })).toBe(false)
      }
    })

    it('Media và Tài liệu riêng tư hiện với editor (cần để tải ảnh, file ebook)', async () => {
      const config = await configPromise
      for (const slug of ['media', 'privateFiles']) {
        const col = config.collections.find((c) => c.slug === slug)!
        expect(col.admin?.group).not.toBe(vi.cms.nav.system)
        expect(col.admin?.hidden).toBeFalsy()
      }
    })

    it('các collection không thuộc nhóm Hệ thống KHÔNG bị ẩn với editor', async () => {
      const config = await configPromise
      const nonSystemCollections = config.collections.filter(
        (col) => isProjectCollection(col.slug) && col.admin?.group !== vi.cms.nav.system,
      )

      // 21 + faqs, teamMembers (SM-01)
      expect(nonSystemCollections.length).toBe(23)

      const editorUser = {
        id: 2,
        email: 'editor@example.test',
        role: 'editor',
      } as unknown as ClientUser

      for (const col of nonSystemCollections) {
        if (typeof col.admin?.hidden === 'function') {
          const hideFn = col.admin.hidden as (args: { user: ClientUser }) => boolean
          expect(
            hideFn({ user: editorUser }),
            `Collection "${col.slug}" không thuộc Hệ thống nhưng lại bị ẩn với editor`,
          ).toBe(false)
        } else {
          expect(col.admin?.hidden).toBeFalsy()
        }
      }
    })
  })

  describe('3. Mô tả, tiêu đề và cột mặc định cho collections', () => {
    it('mọi collection đều có admin.description tiếng Việt rõ nghĩa', async () => {
      const config = await configPromise
      const projectCollections = config.collections.filter((col) => isProjectCollection(col.slug))

      for (const col of projectCollections) {
        expect(
          col.admin?.description,
          `Collection "${col.slug}" thiếu admin.description`,
        ).toBeDefined()
        expect(typeof col.admin?.description).toBe('string')
        expect((col.admin?.description as string).length).toBeGreaterThan(10)
      }
    })

    it('mọi collection có useAsTitle hợp lý (không để trống)', async () => {
      const config = await configPromise
      const projectCollections = config.collections.filter((col) => isProjectCollection(col.slug))

      for (const col of projectCollections) {
        expect(
          col.admin?.useAsTitle,
          `Collection "${col.slug}" thiếu admin.useAsTitle`,
        ).toBeDefined()
      }
    })

    it('các collection nghiệp vụ chính có defaultColumns từ 3 cột trở lên', async () => {
      const config = await configPromise
      const businessSlugs = [
        'products',
        'orders',
        'customers',
        'leads',
        'pages',
        'posts',
        'eqCards',
      ]

      for (const slug of businessSlugs) {
        const col = config.collections.find((c) => c.slug === slug)
        expect(col, `Collection "${slug}" phải tồn tại`).toBeDefined()
        expect(
          col?.admin?.defaultColumns?.length,
          `Collection "${slug}" phải có defaultColumns từ 3 cột trở lên`,
        ).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('4. Brand Logo, Icon và Title Suffix', () => {
    it('admin.meta.titleSuffix có hậu tố thương hiệu Trạm Dừng Cảm Xúc', async () => {
      const config = await configPromise
      expect(config.admin?.meta?.titleSuffix).toBe(' – Trạm Dừng Cảm Xúc')
    })

    it('admin.components.graphics có cấu hình Logo và Icon thương hiệu', async () => {
      const config = await configPromise
      const graphics = config.admin?.components?.graphics
      expect(graphics).toBeDefined()
      expect(graphics?.Logo).toBe('@/components/admin/brand/Logo#AdminLogo')
      expect(graphics?.Icon).toBe('@/components/admin/brand/Icon#AdminIcon')
    })
  })
})
