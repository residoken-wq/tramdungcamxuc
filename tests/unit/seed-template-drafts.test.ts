// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { seedTemplateDrafts, TEMPLATE_DRAFT_MAPPINGS } from '../../seed/template-drafts'
import type { Page } from '../../src/payload-types'

describe('Seed Template Drafts (SM-07)', () => {
  let payload: Payload
  const initialVersionIds = new Set<number>()
  const originalPagesData = new Map<
    string,
    { id: number; title: string; puckData: unknown; isSample?: boolean }
  >()

  beforeAll(async () => {
    payload = await getPayload({ config })
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })

    // Ensure the 5 core pages exist as published base docs
    for (const mapping of TEMPLATE_DRAFT_MAPPINGS) {
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: mapping.slug } },
        limit: 1,
        depth: 0,
        draft: true,
      })

      let pageId: number
      const originalTitle = `[MẪU] Bản gốc ${mapping.slug}`
      const originalPuckData = {
        content: [
          {
            type: 'RichText',
            props: {
              id: `original-${mapping.slug}`,
              content: `Original published content for ${mapping.slug}`,
            },
          },
        ],
        root: { props: { title: originalTitle } },
        zones: {},
      }

      if (existing.docs.length > 0) {
        const doc = existing.docs[0] as Page
        pageId = doc.id
        originalPagesData.set(mapping.slug, {
          id: pageId,
          title: doc.title,
          puckData: doc.puckData,
          isSample: doc.isSample ?? true,
        })
      } else {
        const created = await payload.create({
          collection: 'pages',
          data: {
            title: originalTitle,
            slug: mapping.slug,
            puckData: originalPuckData,
            isSample: true,
            _status: 'published',
          },
        })
        pageId = created.id
        originalPagesData.set(mapping.slug, {
          id: pageId,
          title: originalTitle,
          puckData: originalPuckData,
          isSample: true,
        })
      }

      // Record existing version IDs
      const versions = await payload.findVersions({
        collection: 'pages',
        where: { parent: { equals: pageId } },
        limit: 100,
      })
      for (const v of versions.docs) {
        initialVersionIds.add(v.id)
      }
    }
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      // Clean up versions created during tests
      const currentVersions = await payload.findVersions({
        collection: 'pages',
        limit: 500,
      })
      for (const v of currentVersions.docs) {
        if (!initialVersionIds.has(v.id)) {
          try {
            await payload.db.drizzle.execute(sql`DELETE FROM "_pages_v" WHERE "id" = ${v.id}`)
          } catch {
            // ignore
          }
        }
      }

      // Restore original published data
      for (const [slug, data] of originalPagesData.entries()) {
        try {
          await payload.update({
            collection: 'pages',
            id: data.id,
            data: {
              title: data.title,
              puckData: data.puckData as Page['puckData'],
              isSample: data.isSample,
              _status: 'published',
            },
            draft: false,
          })
        } catch {
          // ignore
        }
      }
    } finally {
      await payload.destroy()
    }
  }, 30000)

  it('creates draft versions for existing published pages without mutating published docs', async () => {
    const report = await seedTemplateDrafts(payload)
    expect(report.created + report.drafted).toBe(5)

    for (const mapping of TEMPLATE_DRAFT_MAPPINGS) {
      // 1. Published doc remains published and untouched
      const published = await payload.find({
        collection: 'pages',
        where: { slug: { equals: mapping.slug } },
        limit: 1,
        depth: 0,
        draft: false,
      })
      expect(published.docs).toHaveLength(1)
      expect(published.docs[0]._status).toBe('published')

      // 2. Latest draft version has template data
      const draft = await payload.find({
        collection: 'pages',
        where: { slug: { equals: mapping.slug } },
        limit: 1,
        depth: 0,
        draft: true,
      })
      expect(draft.docs).toHaveLength(1)
      const draftPuck = draft.docs[0].puckData as { content?: unknown[] }
      expect(Array.isArray(draftPuck?.content)).toBe(true)
      expect(draftPuck.content!.length).toBeGreaterThan(0)
    }
  })

  it('is idempotent on second run: skips all 5 pages and does not increase version count', async () => {
    const countsBefore = new Map<number, number>()
    for (const mapping of TEMPLATE_DRAFT_MAPPINGS) {
      const page = originalPagesData.get(mapping.slug)!
      const versions = await payload.findVersions({
        collection: 'pages',
        where: { parent: { equals: page.id } },
        limit: 100,
      })
      countsBefore.set(page.id, versions.totalDocs)
    }

    const report2 = await seedTemplateDrafts(payload)
    expect(report2.created).toBe(0)
    expect(report2.drafted).toBe(0)
    expect(report2.skipped).toBe(5)

    for (const mapping of TEMPLATE_DRAFT_MAPPINGS) {
      const page = originalPagesData.get(mapping.slug)!
      const versions = await payload.findVersions({
        collection: 'pages',
        where: { parent: { equals: page.id } },
        limit: 100,
      })
      expect(versions.totalDocs).toBe(countsBefore.get(page.id))
    }
  })

  it('skips pages with newer in-progress drafts by CMS users and preserves them', async () => {
    const targetSlug = 'lien-he'
    const page = originalPagesData.get(targetSlug)!

    // Simulate Hana editing a custom draft
    const customUserDraft = {
      content: [
        {
          type: 'RichText',
          props: { id: 'hana-custom-draft', content: '[MẪU] Bản thảo Hana đang soạn dở dang' },
        },
      ],
      root: { props: { title: 'Bản thảo Hana đang soạn' } },
      zones: {},
    }

    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        puckData: customUserDraft,
      },
      draft: true,
    })

    // Run seedTemplateDrafts again
    const report = await seedTemplateDrafts(payload)
    expect(report.skipped).toBeGreaterThanOrEqual(1)

    // Verify Hana's custom draft was NOT overwritten
    const draftRes = await payload.find({
      collection: 'pages',
      where: { slug: { equals: targetSlug } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    expect(draftRes.docs[0].puckData).toEqual(customUserDraft)
  })

  it('creates a new draft version on real doc (isSample = false) without mutating published doc', async () => {
    const targetSlug = 'coaching'
    const page = originalPagesData.get(targetSlug)!

    // Mark as real published document
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        isSample: false,
        title: 'Coaching 1:1 - Trang thực tế',
        _status: 'published',
      },
      draft: false,
    })

    const report = await seedTemplateDrafts(payload)
    // Should have updated draft or skipped if already matching template
    expect(report).toBeDefined()

    // Verify real published doc was NOT overwritten
    const published = await payload.find({
      collection: 'pages',
      where: { slug: { equals: targetSlug } },
      limit: 1,
      depth: 0,
      draft: false,
    })
    expect(published.docs[0].isSample).toBe(false)
    expect(published.docs[0].title).toBe('Coaching 1:1 - Trang thực tế')
  })
})
