// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { seed } from '../../seed/seed'
import { canSeed } from '../../seed/guard'
import type { Navigation, SiteSetting } from '../../src/payload-types'

const counted: CollectionSlug[] = [
  'products',
  'pages',
  'lessons',
  'diagnosticQuestions',
  'techniques',
  'legalPages',
]
// Every collection the seed writes. afterAll removes what this test created so later
// suites (CI runs e2e on the same database) still see an unseeded site.
const seeded: CollectionSlug[] = [
  'products',
  'services',
  'programs',
  'posts',
  'testimonials',
  'eqCards',
  'diagnosticQuestions',
  'techniques',
  'lessons',
  'courseModules',
  'legalPages',
  'pages',
]

describe('sample seed', () => {
  let payload: Payload
  let realProductId: number | undefined
  const preExisting = new Map<CollectionSlug, Set<number>>()
  let navigationBefore: Navigation | undefined
  let settingsBefore: SiteSetting | undefined

  beforeAll(async () => {
    payload = await getPayload({ config })
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
    for (const collection of seeded) {
      const docs = await payload.find({
        collection,
        limit: 0,
        depth: 0,
        draft: true,
        pagination: false,
      })
      preExisting.set(collection, new Set(docs.docs.map((d) => d.id as number)))
    }
    navigationBefore = await payload.findGlobal({ slug: 'navigation', depth: 0 })
    settingsBefore = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      if (realProductId) await payload.delete({ collection: 'products', id: realProductId })
      // Delete in reverse dependency order: documents created by this test only.
      for (const collection of [...seeded].reverse()) {
        const keep = preExisting.get(collection) ?? new Set<number>()
        const docs = await payload.find({
          collection,
          limit: 0,
          depth: 0,
          draft: true,
          pagination: false,
        })
        for (const doc of docs.docs)
          if (!keep.has(doc.id as number)) await payload.delete({ collection, id: doc.id })
      }
      if (navigationBefore)
        await payload.updateGlobal({
          slug: 'navigation',
          data: {
            mainMenu: navigationBefore.mainMenu ?? [],
            footerMenu: navigationBefore.footerMenu ?? [],
          },
        })
      if (settingsBefore)
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: { shopeeStoreUrl: settingsBefore.shopeeStoreUrl ?? null },
        })
    } finally {
      await payload.destroy()
    }
  }, 30000)

  const counts = async () =>
    Object.fromEntries(
      await Promise.all(
        counted.map(async (collection) => [
          collection,
          (await payload.count({ collection, where: { isSample: { equals: true } } })).totalDocs,
        ]),
      ),
    )

  it('is idempotent, computes package values and never touches real records', async () => {
    const real = await payload.create({
      collection: 'products',
      data: {
        name: 'Real product',
        slug: `real-${randomUUID()}`,
        web: 'site',
        type: 'ebook',
        saleStatus: 'free',
      },
    })
    realProductId = real.id

    await seed(payload)
    const first = await counts()
    await seed(payload)
    expect(await counts()).toEqual(first)
    expect(first).toMatchObject({
      pages: 5,
      lessons: 20,
      diagnosticQuestions: 16,
      techniques: 11,
      legalPages: 6,
    })

    const untouched = await payload.findByID({ collection: 'products', id: real.id, depth: 0 })
    expect(untouched).toMatchObject({ name: 'Real product', isSample: false })

    const packages = await payload.find({
      collection: 'products',
      where: { and: [{ type: { equals: 'package' } }, { isSample: { equals: true } }] },
      sort: 'price',
      depth: 0,
    })
    expect(packages.docs.map((d) => [d.totalValue, d.discountPercent])).toEqual([
      [2500000, 30],
      [5800000, 50],
      [10800000, 60],
    ])
  }, 120000)

  it('keeps a sample record that Hana turned into a real one', async () => {
    const [legal] = (
      await payload.find({
        collection: 'legalPages',
        where: { slug: { equals: 'gia-thanh-toan' } },
        depth: 0,
      })
    ).docs
    await payload.update({
      collection: 'legalPages',
      id: legal.id,
      data: { isSample: false, title: 'Giá – bản Hana sửa' },
    })
    try {
      const report = await seed(payload)
      expect(report.legalPages.skippedReal).toBe(1)
      const after = await payload.findByID({ collection: 'legalPages', id: legal.id, depth: 0 })
      expect(after.title).toBe('Giá – bản Hana sửa')
    } finally {
      await payload.update({ collection: 'legalPages', id: legal.id, data: { isSample: true } })
    }
  }, 120000)

  it('refuses production without an explicit opt-in', () => {
    expect(canSeed({ NODE_ENV: 'production' }, ['seed'])).toBe(false)
    expect(canSeed({ NODE_ENV: 'production', SEED_ALLOW_PROD: '1' }, ['seed'])).toBe(false)
    expect(canSeed({ NODE_ENV: 'production', SEED_ALLOW_PROD: 'true' }, ['seed'])).toBe(true)
    expect(canSeed({ NODE_ENV: 'production' }, ['seed', '--allow-prod'])).toBe(true)
    expect(canSeed({ NODE_ENV: 'development' }, ['seed'])).toBe(true)
  })
})
