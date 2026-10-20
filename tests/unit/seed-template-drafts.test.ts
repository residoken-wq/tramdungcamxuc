// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import {
  arePuckDataEquivalent,
  seedTemplateDrafts,
  TEMPLATE_DRAFT_MAPPINGS,
  type TemplateDraftMapping,
} from '../../seed/template-drafts'
import { getTemplateData } from '../../src/puck/templates'

// Runs against throwaway pages with unique slugs only, so a dev DB's real `/`, `coaching`…
// pages are never touched. Every page created here is deleted afterwards.
describe('Seed template drafts (SM-07)', () => {
  let payload: Payload
  const marker = randomUUID().slice(0, 8)
  const slug = (name: string) => `test-sm07-${name}-${marker}`
  const createdIds: number[] = []

  const originalData = (title: string) => ({
    root: { props: { title } },
    zones: {},
    content: [
      { type: 'RichText', props: { id: `orig-${marker}`, version: 1, content: '[MẪU] Bản gốc' } },
    ],
  })

  async function createPublished(name: string, isSample = true): Promise<number> {
    const title = `[MẪU] Trang thử ${name} ${marker}`
    const doc = await payload.create({
      collection: 'pages',
      data: {
        title,
        slug: slug(name),
        puckData: originalData(title),
        isSample,
        _status: 'published',
      },
      overrideAccess: true,
    })
    createdIds.push(doc.id)
    return doc.id
  }

  const findPage = async (name: string, draft: boolean) =>
    (
      await payload.find({
        collection: 'pages',
        // Same filter as the public page route: a never-published page is not "published".
        where: draft
          ? { slug: { equals: slug(name) } }
          : { and: [{ slug: { equals: slug(name) } }, { _status: { equals: 'published' } }] },
        limit: 1,
        depth: 0,
        draft,
        overrideAccess: true,
      })
    ).docs[0]

  const versionCount = async (id: number) =>
    (
      await payload.findVersions({
        collection: 'pages',
        where: { parent: { equals: id } },
        limit: 0,
        overrideAccess: true,
      })
    ).totalDocs

  const mapping = (name: string, template: TemplateDraftMapping['template']) => ({
    slug: slug(name),
    template,
    defaultTitle: `[MẪU] Mặc định ${name}`,
  })

  beforeAll(async () => {
    payload = await getPayload({ config })
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    const leftover = await payload.find({
      collection: 'pages',
      where: { slug: { like: `test-sm07-%-${marker}` } },
      limit: 100,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })
    const ids = new Set([...createdIds, ...leftover.docs.map((d) => d.id)])
    for (const id of ids) {
      await payload.delete({ collection: 'pages', id, overrideAccess: true }).catch(() => {})
    }
    await payload.destroy()
  }, 30000)

  it('maps the 7 sitemap v2 slugs to their templates', () => {
    expect(TEMPLATE_DRAFT_MAPPINGS.map((m) => [m.slug, m.template])).toEqual([
      ['/', 'home-v2'],
      ['lo-trinh-chuyen-minh', 'journey'],
      ['ve-tram', 'about'],
      ['coaching', 'coach'],
      ['lien-he', 'contact'],
      ['cong-dong', 'community'],
      ['doanh-nghiep', 'business'],
    ])
  })

  it('creates draft from community and business templates on published pages', async () => {
    await createPublished('community-page')
    await createPublished('business-page')

    const report = await seedTemplateDrafts(payload, [
      mapping('community-page', 'community'),
      mapping('business-page', 'business'),
    ])
    expect(report).toEqual({ created: 0, drafted: 2, skipped: 0 })

    const commDraft = await findPage('community-page', true)
    expect(commDraft?.template).toBe('community')
    const bizDraft = await findPage('business-page', true)
    expect(bizDraft?.template).toBe('business')
  })

  it('creates a missing page as an unpublished draft', async () => {
    const report = await seedTemplateDrafts(payload, [mapping('missing', 'contact')])
    expect(report).toEqual({ created: 1, drafted: 0, skipped: 0 })

    expect(await findPage('missing', false)).toBeUndefined()
    const draft = await findPage('missing', true)
    expect(draft?._status).toBe('draft')
    expect(draft?.template).toBe('contact')
    expect(draft?.isSample).toBe(true)
    createdIds.push(draft!.id)
  })

  it('adds a template draft to a published page without changing the published copy', async () => {
    const id = await createPublished('published')
    const before = await findPage('published', false)

    const report = await seedTemplateDrafts(payload, [mapping('published', 'about')])
    expect(report).toEqual({ created: 0, drafted: 1, skipped: 0 })

    const published = await findPage('published', false)
    expect(published?.puckData).toEqual(before?.puckData)
    expect(published?.title).toBe(before?.title)

    const draft = await findPage('published', true)
    expect(
      arePuckDataEquivalent(draft?.puckData, getTemplateData('about', before?.title as string)),
    ).toBe(true)

    // Second run: nothing new, no extra version.
    const count = await versionCount(id)
    const again = await seedTemplateDrafts(payload, [mapping('published', 'about')])
    expect(again).toEqual({ created: 0, drafted: 0, skipped: 1 })
    expect(await versionCount(id)).toBe(count)
  })

  it('keeps a newer in-progress draft untouched', async () => {
    const id = await createPublished('editing')
    const inProgress = {
      root: { props: { title: '[MẪU] Bản đang sửa' } },
      zones: {},
      content: [
        { type: 'RichText', props: { id: `wip-${marker}`, version: 1, content: '[MẪU] Đang sửa' } },
      ],
    }
    await payload.update({
      collection: 'pages',
      id,
      data: { puckData: inProgress },
      draft: true,
      overrideAccess: true,
    })

    const report = await seedTemplateDrafts(payload, [mapping('editing', 'coach')])
    expect(report).toEqual({ created: 0, drafted: 0, skipped: 1 })
    expect((await findPage('editing', true))?.puckData).toEqual(inProgress)
  })

  it('only drafts on a real page (isSample = false); published copy stays as is', async () => {
    await createPublished('real', false)
    const before = await findPage('real', false)

    const report = await seedTemplateDrafts(payload, [mapping('real', 'journey')])
    expect(report.drafted).toBe(1)

    const published = await findPage('real', false)
    expect(published?.isSample).toBe(false)
    expect(published?.puckData).toEqual(before?.puckData)
  })
})
