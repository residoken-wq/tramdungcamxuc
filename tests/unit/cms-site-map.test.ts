import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi as vitest } from 'vitest'

vitest.mock('server-only', () => ({}))

import {
  OVERRIDE_PAGE_SLUGS,
  SITE_MAP_SECTIONS,
  guideAnchor,
  guideHref,
} from '../../src/lib/cms/site-map-data'
import { findEditForPath, loadSiteMap, pagePath } from '../../src/lib/cms/site-map.server'
import { CMS_DASHBOARD_GUIDES } from '../../src/lib/cms/dashboard.server'

const guideText = fs.readFileSync(path.join(process.cwd(), 'docs/HUONG_DAN_CMS.md'), 'utf8')
const headings = new Set(
  guideText
    .split('\n')
    .filter((l) => /^#{2,4} /.test(l))
    .map((l) => l.replace(/^#+\s+/, '').trim()),
)
const collectionSlugs = fs
  .readdirSync(path.join(process.cwd(), 'src/collections'))
  .map((f) => fs.readFileSync(path.join(process.cwd(), 'src/collections', f), 'utf8'))
  .join('\n')
const globalSlugs = fs
  .readdirSync(path.join(process.cwd(), 'src/globals'))
  .map((f) => fs.readFileSync(path.join(process.cwd(), 'src/globals', f), 'utf8'))
  .join('\n')

describe('CMS site map (/admin/so-do-website)', () => {
  it('every guide link points to a real heading of HUONG_DAN_CMS.md', () => {
    for (const section of SITE_MAP_SECTIONS) {
      for (const entry of section.entries) {
        for (const g of entry.guides ?? []) expect(headings.has(g), `${entry.id}: ${g}`).toBe(true)
      }
    }
  })

  it('anchors match the ones GitHub builds (same as the dashboard guide links)', () => {
    const products = CMS_DASHBOARD_GUIDES.find((g) => g.id === 'products')!
    expect(guideHref('3. Quản lý Sản phẩm, Giá bán và Tài nguyên')).toBe(products.href)
    expect(guideAnchor('3.1d. Sửa trang Habit Hack (/habit/1-percent-better)')).toBe(
      '31d-sửa-trang-habit-hack-habit1-percent-better',
    )
  })

  it('every edit target is a real collection / global', () => {
    for (const section of SITE_MAP_SECTIONS) {
      for (const entry of section.entries) {
        for (const t of entry.edits) {
          if (t.type === 'collection') {
            expect(collectionSlugs, `${entry.id}: ${t.slug}`).toMatch(
              new RegExp(`(slug: |contentCollection\\(\\s*)'${t.slug}'`),
            )
          }
          if (t.type === 'global') {
            expect(globalSlugs, `${entry.id}: ${t.slug}`).toContain(`slug: '${t.slug}'`)
          }
        }
      }
    }
    expect(OVERRIDE_PAGE_SLUGS).toEqual(['habit/1-percent-better', 'eq-buddy'])
  })

  it('menu addresses resolve to the builder page or the matching form', () => {
    const pages = new Map([
      ['/', { id: 1, title: 'Trang chủ', slug: '/', published: true }],
      ['ve-tram', { id: 2, title: 'Về Trạm', slug: 've-tram', published: true }],
    ])
    const cards = [
      {
        id: 'program-detail',
        title: '',
        path: '/doanh-nghiep/[tên chương trình]',
        openHref: null,
        kind: 'form' as const,
        summary: '',
        links: [
          { label: 'Chương trình', href: '/admin/collections/programs', tone: 'form' as const },
        ],
        tips: [],
        guides: [],
        badges: [],
      },
    ]
    expect(pagePath('/')).toBe('/')
    expect(pagePath('ve-tram/')).toBe('/ve-tram')
    expect(findEditForPath('/', pages, cards)?.href).toBe('/builder/1')
    expect(findEditForPath('/ve-tram', pages, cards)?.href).toBe('/builder/2')
    expect(findEditForPath('/doanh-nghiep/eq', pages, cards)?.href).toBe(
      '/admin/collections/programs',
    )
    expect(findEditForPath('/doanh-nghiep/', pages, cards)).toBeNull()
    expect(findEditForPath('/khong-co', pages, cards)).toBeNull()
  })

  it('loads pages, override status and the menu with the user access', async () => {
    const calls: Record<string, unknown>[] = []
    const payload = {
      find: async (args: Record<string, unknown>) => {
        calls.push(args)
        if (args.collection === 'products') return { docs: [{ id: 9, slug: 'habit-tracker-so' }] }
        const published = args.draft === false
        return {
          docs: [
            { id: 1, title: '[MẪU] Trang chủ', slug: '/' },
            { id: 3, title: '[MẪU] Habit builder', slug: 'habit/1-percent-better' },
            ...(published ? [] : [{ id: 4, title: '[MẪU] Nháp', slug: 'nhap' }]),
          ],
        }
      },
      findGlobal: async () => ({
        mainMenu: [
          { label: 'Trang chủ', linkType: 'page', page: { slug: '/' } },
          { label: 'Habit Hack', linkType: 'url', url: '/habit/1-percent-better' },
          { label: 'Shopee', linkType: 'url', url: 'https://shopee.vn/x' },
        ],
      }),
    }
    const data = await loadSiteMap(payload as never, { id: 1 } as never)
    expect(calls.every((c) => c.overrideAccess === false)).toBe(true)

    const builder = data.groups[0]
    expect(builder.cards.map((c) => c.id)).toEqual(['page-1', 'page-4'])
    expect(builder.cards[1].badges[0].label).toContain('Bản nháp')
    expect(builder.cards[1].openHref).toBeNull()

    const habit = data.groups.flatMap((g) => g.cards).find((c) => c.id === 'habit-offer')!
    expect(habit.badges[0].label).toBe('Đang hiện trang builder')
    expect(habit.links[0].href).toBe('/builder/3')
    expect(habit.links[1].href).toBe('/admin/collections/products/9')

    expect(data.menu[0].edit?.href).toBe('/builder/1')
    expect(data.menu[1].edit?.href).toBe('/builder/3')
    expect(data.menu[2]).toMatchObject({ external: true, edit: null })
  })
})
