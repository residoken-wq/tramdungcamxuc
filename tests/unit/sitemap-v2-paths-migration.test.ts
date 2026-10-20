// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import config from '../../src/payload.config'
import { up, down } from '../../src/migrations/20261018_020000_sitemap_v2_paths'
import type { Navigation } from '../../src/payload-types'

// SM-02 data migration: page slugs + legacy links in puckData and menus.
describe('sitemap v2 paths migration (SM-02)', () => {
  let payload: Payload
  let navigationBefore: Navigation | undefined
  const createdPages: number[] = []
  const slugs = ['ve-hana', 've-tram', 'coaching/growth-mirror', 'lo-trinh-chuyen-minh']
  const args = () => ({ db: payload.db.drizzle, payload, req: {} }) as unknown as MigrateUpArgs

  const pageBySlug = async (slug: string) =>
    (
      await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        draft: true,
        depth: 0,
        limit: 1,
      })
    ).docs[0]

  const createPage = async (slug: string, link: string) => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: `[TEST] ${slug}`,
        slug,
        isSample: true,
        _status: 'published',
        puckData: {
          root: { props: {} },
          content: [
            {
              type: 'CTAButton',
              props: { id: `cta-${slug}`, label: 'Xem', href: link, note: `Ghé ${link} nhé` },
            },
          ],
        },
      },
    })
    createdPages.push(page.id)
    return page
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
    for (const slug of slugs) {
      if (await pageBySlug(slug)) throw new Error(`Test DB already has a page "${slug}"`)
    }
    navigationBefore = await payload.findGlobal({ slug: 'navigation', depth: 0 })
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
      for (const id of createdPages) {
        await payload.delete({ collection: 'pages', id, overrideAccess: true }).catch(() => null)
      }
    } finally {
      await payload.destroy()
    }
  }, 30000)

  it('renames free slugs, skips taken ones, rewrites whole links and rolls back', async () => {
    const gm = await createPage('coaching/growth-mirror', '/thu-vien?tab=khoa-hoc')
    const hana = await createPage('ve-hana', '/coaching/growth-mirror#dat-phien')
    await createPage('ve-tram', '/ve-hana') // target slug already taken → ve-hana must stay
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        mainMenu: [
          { label: '[TEST] Thư viện', linkType: 'url', url: '/thu-vien' },
          {
            label: '[TEST] Sản phẩm',
            linkType: 'none',
            children: [{ items: [{ label: '[TEST] Về', linkType: 'url', url: '/ve-hana' }] }],
          },
        ],
        footerMenu: [{ label: '[TEST] Khác', linkType: 'url', url: '/eq-buddy' }],
      },
    })

    await up(args())
    await up(args()) // idempotent

    const movedGm = await payload.findByID({ collection: 'pages', id: gm.id, draft: true })
    expect(movedGm.slug).toBe('lo-trinh-chuyen-minh')
    const gmProps = (movedGm.puckData as { content: { props: Record<string, string> }[] })
      .content[0]!.props
    expect(gmProps.href).toBe('/tai-nguyen?tab=khoa-hoc')
    expect(gmProps.note).toBe('Ghé /thu-vien?tab=khoa-hoc nhé')

    const keptHana = await payload.findByID({ collection: 'pages', id: hana.id, draft: true })
    expect(keptHana.slug).toBe('ve-hana')
    expect(
      (keptHana.puckData as { content: { props: Record<string, string> }[] }).content[0]!.props
        .href,
    ).toBe('/lo-trinh-chuyen-minh#dat-phien')

    const nav = await payload.findGlobal({ slug: 'navigation', depth: 0 })
    expect(nav.mainMenu?.[0]?.url).toBe('/tai-nguyen')
    expect(nav.mainMenu?.[1]?.children?.[0]?.items?.[0]?.url).toBe('/ve-tram')
    expect(nav.footerMenu?.[0]?.url).toBe('/eq-buddy')

    await down(args() as unknown as MigrateDownArgs)

    const backGm = await payload.findByID({ collection: 'pages', id: gm.id, draft: true })
    expect(backGm.slug).toBe('coaching/growth-mirror')
    expect(
      (backGm.puckData as { content: { props: Record<string, string> }[] }).content[0]!.props.href,
    ).toBe('/thu-vien?tab=khoa-hoc')
    const navBack = await payload.findGlobal({ slug: 'navigation', depth: 0 })
    expect(navBack.mainMenu?.[0]?.url).toBe('/thu-vien')
  })
})
