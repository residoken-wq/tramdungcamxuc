// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import { GET as exportLeads } from '../../src/app/(payload)/api/leads/export/route'
import { BRAND_ICONS } from '../../src/lib/brand/icons'
import type { Navigation, SiteSetting } from '../../src/payload-types'

// SM-01: CMS schema for sitemap v2 (submenu, FAQs, team, contact settings, lead interests).
describe('sitemap v2 schema (SM-01)', () => {
  let payload: Payload
  let ownerToken = ''
  let navigationBefore: Navigation | undefined
  let settingsBefore: SiteSetting | undefined
  const created: { collection: CollectionSlug; id: number }[] = []
  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
    navigationBefore = await payload.findGlobal({ slug: 'navigation', depth: 0 })
    settingsBefore = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })

    const email = `owner-sm01-${randomUUID()}@example.test`
    const password = randomUUID()
    track(
      'users',
      await payload.create({ collection: 'users', data: { email, password, role: 'owner' } }),
    )
    ownerToken =
      (await payload.login({ collection: 'users', data: { email, password } })).token ?? ''
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      if (navigationBefore) {
        await payload.updateGlobal({
          slug: 'navigation',
          data: {
            mainMenu: navigationBefore.mainMenu ?? [],
            footerMenu: navigationBefore.footerMenu ?? [],
          },
        })
      }
      if (settingsBefore) {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: { hotline: settingsBefore.hotline ?? null },
        })
      }
      for (const entry of created.reverse()) {
        await payload.delete({ ...entry, overrideAccess: true })
      }
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('navigation submenu', () => {
    const saveMenu = (mainMenu: unknown[]) =>
      payload.updateGlobal({
        slug: 'navigation',
        data: { mainMenu: mainMenu as Navigation['mainMenu'] },
      })

    it('keeps menu items without a submenu working as before', async () => {
      const saved = await saveMenu([{ label: '[TEST] Về Trạm', linkType: 'url', url: '/ve-tram' }])
      expect(saved.mainMenu?.[0]).toMatchObject({ label: '[TEST] Về Trạm', linkType: 'url' })
      expect(saved.mainMenu?.[0]?.children ?? []).toEqual([])
    })

    it('saves grouped submenu items with short descriptions', async () => {
      const saved = await saveMenu([
        {
          label: '[TEST] Sản phẩm',
          linkType: 'none',
          children: [
            {
              groupLabel: '[TEST] Dành cho Cá nhân',
              items: [
                {
                  label: '[TEST] EQ Buddy',
                  description: 'Công cụ hỗ trợ cảm xúc',
                  linkType: 'url',
                  url: '/eq-buddy',
                },
              ],
            },
          ],
        },
      ])
      const parent = saved.mainMenu?.[0]
      expect(parent?.linkType).toBe('none')
      expect(parent?.children?.[0]).toMatchObject({ groupLabel: '[TEST] Dành cho Cá nhân' })
      expect(parent?.children?.[0]?.items?.[0]).toMatchObject({
        label: '[TEST] EQ Buddy',
        url: '/eq-buddy',
      })
    })

    it('rejects a "submenu only" parent without any submenu item', async () => {
      await expect(saveMenu([{ label: '[TEST] Sản phẩm', linkType: 'none' }])).rejects.toThrow()
    })

    it('rejects more than 4 submenu groups', async () => {
      const group = { items: [{ label: '[TEST] Mục', linkType: 'url', url: '/' }] }
      await expect(
        saveMenu([{ label: '[TEST] Sản phẩm', linkType: 'none', children: Array(5).fill(group) }]),
      ).rejects.toThrow()
    })

    it('rejects a submenu item without a destination', async () => {
      await expect(
        saveMenu([
          {
            label: '[TEST] Sản phẩm',
            linkType: 'none',
            children: [{ items: [{ label: '[TEST] Thiếu link', linkType: 'url' }] }],
          },
        ]),
      ).rejects.toThrow()
    })

    it('rejects descriptions longer than 60 characters', async () => {
      await expect(
        saveMenu([
          {
            label: '[TEST] Sản phẩm',
            linkType: 'none',
            children: [
              {
                items: [
                  { label: '[TEST] Dài', description: 'x'.repeat(61), linkType: 'url', url: '/' },
                ],
              },
            ],
          },
        ]),
      ).rejects.toThrow()
    })
  })

  describe('faqs', () => {
    it('shows only published questions to the public', async () => {
      const published = track(
        'faqs',
        await payload.create({
          collection: 'faqs',
          data: {
            question: `[TEST] Đã xuất bản ${randomUUID()}`,
            answer: '[TEST] Trả lời',
            group: 'payment',
            _status: 'published',
          },
        }),
      )
      const draft = track(
        'faqs',
        await payload.create({
          collection: 'faqs',
          data: {
            question: `[TEST] Nháp ${randomUUID()}`,
            answer: '[TEST] Trả lời',
            group: 'payment',
          },
          draft: true,
        }),
      )
      const publicIds = (
        await payload.find({
          collection: 'faqs',
          overrideAccess: false,
          limit: 0,
          pagination: false,
        })
      ).docs.map((doc) => doc.id)
      expect(publicIds).toContain(published.id)
      expect(publicIds).not.toContain(draft.id)
    })

    it('requires an answer', async () => {
      // Deliberately missing the required answer, so the typed signature is bypassed.
      const create = payload.create.bind(payload) as (args: unknown) => Promise<unknown>
      await expect(
        create({
          collection: 'faqs',
          data: { question: '[TEST] Không có trả lời', group: 'general', _status: 'published' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('teamMembers', () => {
    it('cannot be published without consent', async () => {
      const error = await payload
        .create({
          collection: 'teamMembers',
          data: { name: '[TEST] Thành viên', consent: false, _status: 'published' },
        })
        .catch((err: unknown) => err)
      expect(error).toBeInstanceOf(ValidationError)
      expect(JSON.stringify((error as ValidationError).data)).toContain(
        'Cần có sự đồng ý của người này',
      )
    })

    it('shows only published members with consent to the public', async () => {
      const shown = track(
        'teamMembers',
        await payload.create({
          collection: 'teamMembers',
          data: { name: '[TEST] Có đồng ý', consent: true, _status: 'published' },
        }),
      )
      const hidden = track(
        'teamMembers',
        await payload.create({
          collection: 'teamMembers',
          data: { name: '[TEST] Chưa đồng ý', consent: false },
          draft: true,
        }),
      )
      const publicIds = (
        await payload.find({
          collection: 'teamMembers',
          overrideAccess: false,
          limit: 0,
          pagination: false,
        })
      ).docs.map((doc) => doc.id)
      expect(publicIds).toContain(shown.id)
      expect(publicIds).not.toContain(hidden.id)
    })
  })

  describe('products, testimonials, posts, settings', () => {
    it('stores tagline, brand icon, topic and audience segment on products', async () => {
      const product = track(
        'products',
        await payload.create({
          collection: 'products',
          data: {
            name: '[TEST] Gói SM-01',
            slug: `sm01-${randomUUID()}`,
            web: 'site',
            type: 'package',
            saleStatus: 'consult',
            tagline: 'Tỏ tường từ bên trong',
            icon: BRAND_ICONS[0].value,
            topic: 'career',
            audienceSegment: 'individual',
            isSample: true,
          },
          draft: true,
        }),
      )
      expect(product).toMatchObject({
        tagline: 'Tỏ tường từ bên trong',
        icon: 'target',
        topic: 'career',
        audienceSegment: 'individual',
      })
    })

    it('stores the before / insight / after story on testimonials', async () => {
      const testimonial = track(
        'testimonials',
        await payload.create({
          collection: 'testimonials',
          data: {
            name: '[TEST] Học viên Test 01',
            age: 28,
            consent: true,
            story: { before: '[TEST] Trước', insight: '[TEST] Nhận thức', after: '[TEST] Sau' },
            _status: 'published',
          },
        }),
      )
      expect(testimonial.story).toMatchObject({ before: '[TEST] Trước', after: '[TEST] Sau' })
      expect(testimonial.age).toBe(28)
    })

    it('rejects hotlines with letters', async () => {
      await expect(
        payload.updateGlobal({ slug: 'siteSettings', data: { hotline: '0930-abc' } }),
      ).rejects.toThrow()
      const saved = await payload.updateGlobal({
        slug: 'siteSettings',
        data: { hotline: '+84 930 000 000' },
      })
      expect(saved.hotline).toBe('+84 930 000 000')
    })
  })

  describe('leads', () => {
    it('only accepts packages as the package of interest', async () => {
      const notPackage = track(
        'products',
        await payload.create({
          collection: 'products',
          data: {
            name: '[TEST] Không phải gói',
            slug: `sm01-tool-${randomUUID()}`,
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'coming_soon',
            isSample: true,
          },
          draft: true,
        }),
      )
      await expect(
        payload.create({
          collection: 'leads',
          data: { email: `sm01-${randomUUID()}@example.test`, interestedPackage: notPackage.id },
        }),
      ).rejects.toThrow()
    })

    it('exports the new interest columns, neutralising formulas', async () => {
      const pkg = track(
        'products',
        await payload.create({
          collection: 'products',
          data: {
            name: '[TEST] Gói BUILD',
            slug: `sm01-pkg-${randomUUID()}`,
            web: 'site',
            type: 'package',
            saleStatus: 'consult',
            isSample: true,
          },
          draft: true,
        }),
      )
      const email = `sm01-csv-${randomUUID()}@example.test`
      track(
        'leads',
        await payload.create({
          collection: 'leads',
          data: {
            email,
            need: 'business',
            interestedPackage: pkg.id,
            currentStatus: '=HYPERLINK("x")',
            brief: { company: '[TEST] Công ty', contactRole: 'HRD' },
          },
        }),
      )
      const response = await exportLeads(
        new Request('http://localhost:3000/api/leads/export', {
          headers: { Authorization: `JWT ${ownerToken}` },
        }),
      )
      expect(response.status).toBe(200)
      const csv = await response.text()
      const [header] = csv.replace(/^﻿/, '').split('\r\n')
      expect(header).toContain('Gói quan tâm')
      expect(header).toContain('Chương trình quan tâm')
      expect(header).toContain('Tình trạng hiện tại')
      expect(header).toContain('Vai trò người liên hệ')
      const row = csv.split('\r\n').find((line) => line.includes(email))
      expect(row).toContain('[TEST] Gói BUILD')
      expect(row).toContain('HRD')
      expect(row).toContain(`"'=HYPERLINK(""x"")"`)
    })
  })
})
