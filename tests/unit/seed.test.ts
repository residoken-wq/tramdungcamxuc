// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type CollectionSlug, type Payload, type Where } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { seed } from '../../seed/seed'
import { canSeed } from '../../seed/guard'
import * as seedData from '../../seed/data'
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
  'faqs',
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

  // Other test files run in parallel and also create isSample products/pages; count only the
  // seed's own slugs so their records cannot change the totals between the two reads.
  const seedSlugs: Partial<Record<CollectionSlug, string[]>> = {
    products: seedData.products.map((p) => p.slug),
    pages: seedData.pages.map((p) => p.slug),
    services: seedData.services.map((s) => s.slug),
    programs: seedData.programs.map((p) => p.slug),
    posts: seedData.posts.map((p) => p.slug),
    legalPages: seedData.legalPages.map((p) => p.slug),
  }

  afterAll(async () => {
    if (!payload) return
    try {
      if (realProductId) {
        try {
          await payload.delete({ collection: 'products', id: realProductId })
        } catch {
          // ignore
        }
      }
      // Delete in reverse dependency order: documents created by this test only.
      for (const collection of [...seeded].reverse()) {
        const keep = preExisting.get(collection) ?? new Set<number>()
        const slugs = seedSlugs[collection]
        const docs = await payload.find({
          collection,
          limit: 0,
          depth: 0,
          draft: true,
          pagination: false,
        })
        for (const doc of docs.docs) {
          if (!keep.has(doc.id as number)) {
            if (slugs && !slugs.includes((doc as { slug?: string }).slug as string)) continue
            try {
              await payload.delete({ collection, id: doc.id })
            } catch {
              // ignore
            }
          }
        }
      }
      if (navigationBefore) {
        try {
          await payload.updateGlobal({
            slug: 'navigation',
            data: {
              mainMenu: navigationBefore.mainMenu ?? [],
              footerMenu: navigationBefore.footerMenu ?? [],
            },
          })
        } catch {
          // pre-existing navigation may refer to deleted pages; safe to ignore
        }
      }
      if (settingsBefore)
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            shopeeStoreUrl: settingsBefore.shopeeStoreUrl ?? null,
            leadStatusOptions: settingsBefore.leadStatusOptions ?? [],
          },
        })
    } finally {
      await payload.destroy()
    }
  }, 30000)
  const sampleWhere = (collection: CollectionSlug): Where => {
    const slugs = seedSlugs[collection]
    return slugs
      ? { and: [{ isSample: { equals: true } }, { slug: { in: slugs } }] }
      : { isSample: { equals: true } }
  }

  const counts = async () =>
    Object.fromEntries(
      await Promise.all(
        counted.map(async (collection) => [
          collection,
          (await payload.count({ collection, where: sampleWhere(collection) })).totalDocs,
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
      pages: 7, // 5 trang T1-16 + lien-he, cong-dong (SM-02)
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

  it('skips EQ sample cards once a real card exists and never edits the real card', async () => {
    const realCode = `TEST-REAL-${randomUUID().slice(0, 8)}`
    const realCard = await payload.create({
      collection: 'eqCards',
      data: {
        code: realCode,
        keywordEn: '[TEST] Real',
        qrSlug: realCode.toLowerCase(),
        message: '[TEST] real card',
        promptRecall: '[TEST] a',
        promptPack: '[TEST] b',
        promptAcknowledge: '[TEST] c',
        isSample: false,
        _status: 'published',
      },
    })
    const samplesBefore = await payload.count({
      collection: 'eqCards',
      where: { isSample: { equals: true } },
    })
    await seed(payload)
    const samplesAfter = await payload.count({
      collection: 'eqCards',
      where: { isSample: { equals: true } },
    })
    expect(samplesAfter.totalDocs).toBe(samplesBefore.totalDocs)
    const reloaded = await payload.findByID({ collection: 'eqCards', id: realCard.id })
    expect(reloaded.message).toBe('[TEST] real card')
    expect(reloaded.isSample).toBe(false)
    await payload.delete({ collection: 'eqCards', id: realCard.id })
  }, 120000)

  it('refuses production without an explicit opt-in', () => {
    expect(canSeed({ NODE_ENV: 'production' }, ['seed'])).toBe(false)
    expect(canSeed({ NODE_ENV: 'production', SEED_ALLOW_PROD: '1' }, ['seed'])).toBe(false)
    expect(canSeed({ NODE_ENV: 'production', SEED_ALLOW_PROD: 'true' }, ['seed'])).toBe(true)
    expect(canSeed({ NODE_ENV: 'production' }, ['seed', '--allow-prod'])).toBe(true)
    expect(canSeed({ NODE_ENV: 'development' }, ['seed'])).toBe(true)
  })
})
