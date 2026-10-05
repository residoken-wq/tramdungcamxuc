import type { CollectionSlug, Payload, Where } from 'payload'
import * as data from './data'

// The seed writes many collections through one generic helper; Payload's per-collection
// generics cannot express that, so writes go through this deliberately loose view.
type LooseWriter = {
  create(args: Record<string, unknown>): Promise<{ id: number }>
  update(args: Record<string, unknown>): Promise<unknown>
}

export type SeedReport = Record<string, { created: number; updated: number; skippedReal: number }>

/**
 * Idempotent sample seed. Only creates or updates documents with isSample = true;
 * a real document (isSample = false) with the same key is never modified.
 */
export async function seed(payload: Payload): Promise<SeedReport> {
  const writer = payload as unknown as LooseWriter
  const report: SeedReport = {}
  const tally = (collection: string) =>
    (report[collection] ??= { created: 0, updated: 0, skippedReal: 0 })

  async function upsert(
    collection: CollectionSlug,
    key: string,
    value: string,
    doc: Record<string, unknown>,
    options: { publish?: boolean } = {},
  ): Promise<number | null> {
    const publish = options.publish ?? true
    const where: Where = { [key]: { equals: value } }
    const existing = await payload.find({ collection, where, limit: 1, depth: 0, draft: true })
    const found = existing.docs[0] as { id: number; isSample?: boolean } | undefined
    const payloadData = {
      ...doc,
      [key]: value,
      isSample: true,
      ...(publish ? { _status: 'published' } : {}),
    }
    if (found && !found.isSample) {
      tally(collection).skippedReal++
      return found.id
    }
    if (found) {
      await writer.update({ collection, id: found.id, data: payloadData, draft: !publish })
      tally(collection).updated++
      return found.id
    }
    const created = await writer.create({ collection, data: payloadData, draft: !publish })
    tally(collection).created++
    return created.id
  }

  const productIds = new Map<string, number>()
  for (const { components: _none, slug, ...product } of data.products.filter(
    (p) => !p.components,
  )) {
    productIds.set(slug, (await upsert('products', 'slug', slug, product))!)
  }
  for (const { components, slug, ...product } of data.products.filter((p) => p.components)) {
    const resolved = components!.map(({ grants, ...component }) => ({
      ...component,
      ...(grants ? { grantsProduct: productIds.get(grants) } : {}),
    }))
    productIds.set(
      slug,
      (await upsert('products', 'slug', slug, { ...product, components: resolved }))!,
    )
  }

  for (const { slug, ...service } of data.services) await upsert('services', 'slug', slug, service)
  for (const { slug, ...program } of data.programs) await upsert('programs', 'slug', slug, program)
  for (const { slug, ...post } of data.posts) await upsert('posts', 'slug', slug, post)

  const growthMirror = productIds.get('growth-mirror-phien-trai-nghiem')
  // Testimonials without consent cannot be published: keep them as drafts.
  for (const { name, ...testimonial } of data.testimonials)
    await upsert(
      'testimonials',
      'name',
      name,
      {
        ...testimonial,
        relatedOffer: growthMirror ? { relationTo: 'products', value: growthMirror } : undefined,
      },
      { publish: false },
    )

  const eqBuddy = productIds.get('eq-buddy-so')
  for (const { code, ...card } of data.eqCards)
    await upsert('eqCards', 'code', code, { ...card, relatedProduct: eqBuddy })

  for (const { statement, ...question } of data.diagnosticQuestions)
    await upsert('diagnosticQuestions', 'statement', statement, question)
  for (const { name, ...technique } of data.techniques)
    await upsert('techniques', 'name', name, technique)

  let lessonOrder = 0
  for (const { title, lessons, ...module } of data.courseModules) {
    const moduleId = await upsert('courseModules', 'title', title, module)
    for (let i = 1; i <= lessons; i++) {
      lessonOrder++
      await upsert('lessons', 'title', `${data.S} Bài ${lessonOrder}`, {
        module: moduleId,
        summary: `${data.S} Tóm tắt bài ${lessonOrder}.`,
        stage: 'none',
        order: lessonOrder,
        isFreePreview: lessonOrder === 1,
      })
    }
  }

  for (const { slug, ...page } of data.legalPages) await upsert('legalPages', 'slug', slug, page)

  const pageIds = new Map<string, number>()
  for (const { slug, title, blocks } of data.pages) {
    const puckData = { content: blocks, root: { props: { title } }, zones: {} }
    pageIds.set(slug, (await upsert('pages', 'slug', slug, { title, puckData }))!)
  }

  // Globals: only fill when empty so real settings entered by Hana are never overwritten.
  const navigation = (await payload.findGlobal({ slug: 'navigation', depth: 0 })) as {
    mainMenu?: unknown[]
    footerMenu?: unknown[]
  }
  const toMenu = (items: data.NavItemSeed[]) =>
    items.map(({ page, ...item }) => ({ ...item, ...(page ? { page: pageIds.get(page) } : {}) }))
  const navUpdate: Record<string, unknown> = {}
  if (!navigation.mainMenu?.length) navUpdate.mainMenu = toMenu(data.mainMenu)
  if (!navigation.footerMenu?.length) navUpdate.footerMenu = toMenu(data.footerMenu)
  if (Object.keys(navUpdate).length) {
    await payload.updateGlobal({ slug: 'navigation', data: navUpdate })
    tally('navigation').updated++
  }

  const settings = (await payload.findGlobal({ slug: 'siteSettings', depth: 0 })) as {
    shopeeStoreUrl?: string | null
  }
  if (!settings.shopeeStoreUrl) {
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: { shopeeStoreUrl: 'https://shopee.vn/' },
    })
    tally('siteSettings').updated++
  }

  return report
}
