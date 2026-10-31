import type { CollectionSlug, Payload, Where } from 'payload'
import * as data from './data'
import { LEGACY_PAGE_SLUGS, rewriteLink } from '../src/lib/paths'
import { EQ_BUDDY_PRODUCT_SLUG } from '../src/lib/eq/config'
import { arePuckDataEquivalent, seedTemplateDrafts } from './template-drafts'

// The seed writes many collections through one generic helper; Payload's per-collection
// generics cannot express that, so writes go through this deliberately loose view.
type LooseWriter = {
  create(args: Record<string, unknown>): Promise<{ id: number }>
  update(args: Record<string, unknown>): Promise<unknown>
}

export type CollectionSeedStats = {
  created: number
  updated: number
  skippedReal: number
}

export type TemplateDraftStats = {
  created: number
  drafted: number
  skipped: number
}

export type SeedReport = Record<string, CollectionSeedStats> & {
  templateDrafts?: TemplateDraftStats
}

/**
 * Idempotent sample seed. Only creates or updates documents with isSample = true;
 * a real document (isSample = false) with the same key is never modified.
 */
export async function seed(payload: Payload): Promise<SeedReport> {
  const writer = payload as unknown as LooseWriter
  const report: SeedReport = {}
  const tally = (collection: string): CollectionSeedStats =>
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
    const existing = await payload.find({
      collection,
      where,
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })
    let found = existing.docs[0] as { id: number; isSample?: boolean } | undefined
    if (!found) {
      const existingPublished = await payload.find({
        collection,
        where,
        limit: 1,
        depth: 0,
        draft: false,
        overrideAccess: true,
      })
      found = existingPublished.docs[0] as { id: number; isSample?: boolean } | undefined
    }
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
      // Re-publishing an unchanged sample page would drop its template draft (SM-07) and add
      // a version on every run, so skip pages whose published copy already matches the seed.
      if (collection === 'pages') {
        const published = await payload.find({
          collection,
          where: { and: [where, { _status: { equals: 'published' } }] },
          limit: 1,
          depth: 0,
          draft: false,
          overrideAccess: true,
        })
        const current = published.docs[0] as { title?: unknown; puckData?: unknown } | undefined
        if (
          current &&
          current.title === doc.title &&
          arePuckDataEquivalent(current.puckData, doc.puckData)
        ) {
          return found.id
        }
      }
      await writer.update({
        collection,
        id: found.id,
        data: payloadData,
        draft: !publish,
        overrideAccess: true,
      })
      tally(collection).updated++
      return found.id
    }
    const created = await writer.create({
      collection,
      data: payloadData,
      draft: !publish,
      overrideAccess: true,
    })
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

  const hasReal = async (collection: CollectionSlug) =>
    (
      await payload.count({
        collection,
        where: { isSample: { not_equals: true } },
      })
    ).totalDocs > 0

  const eqHasReal = await hasReal('eqCards')
  const eqBuddy = productIds.get(EQ_BUDDY_PRODUCT_SLUG)
  for (const { code, ...card } of eqHasReal ? [] : data.eqCards)
    await upsert('eqCards', 'code', code, { ...card, relatedProduct: eqBuddy })

  // Once Hana's real Habit Hack content is imported (pnpm import:habit), samples would
  // mix into the quiz and the course, so these collections are left alone.
  const habitHasReal = (
    await Promise.all(
      (['diagnosticQuestions', 'techniques', 'courseModules', 'lessons'] as const).map(hasReal),
    )
  ).some(Boolean)

  for (const { statement, ...question } of habitHasReal ? [] : data.diagnosticQuestions)
    await upsert('diagnosticQuestions', 'statement', statement, question)
  for (const { name, ...technique } of habitHasReal ? [] : data.techniques)
    await upsert('techniques', 'name', name, technique)

  let lessonOrder = 0
  for (const { title, lessons, ...module } of habitHasReal ? [] : data.courseModules) {
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
  for (const { question, ...faq } of data.faqs) await upsert('faqs', 'question', question, faq)

  function resolveBlockProductIds(blockItem: Record<string, unknown>): Record<string, unknown> {
    const item = JSON.parse(JSON.stringify(blockItem))
    const props = item.props as Record<string, unknown> | undefined
    if (!props) return item

    if (item.type === 'PackageComparison' && Array.isArray(props.packages)) {
      props.packages = props.packages.map((pkg: Record<string, unknown>) => {
        const rawSlug = (pkg.packageSlug || pkg.packageId) as string | number | undefined
        if (typeof rawSlug === 'string' && productIds.has(rawSlug)) {
          const mappedId = productIds.get(rawSlug)
          const { packageSlug: _slug, ...rest } = pkg
          return {
            ...rest,
            packageId: mappedId,
          }
        }
        return pkg
      })
    }

    if (typeof props.productId === 'string' && productIds.has(props.productId)) {
      props.productId = productIds.get(props.productId)
    }
    if (typeof props.productSlug === 'string' && productIds.has(props.productSlug)) {
      props.productId = productIds.get(props.productSlug)
      delete props.productSlug
    }

    if (typeof props.resourceProductId === 'string' && productIds.has(props.resourceProductId)) {
      props.resourceProductId = productIds.get(props.resourceProductId)
    }
    if (
      typeof props.resourceProductSlug === 'string' &&
      productIds.has(props.resourceProductSlug)
    ) {
      props.resourceProductId = productIds.get(props.resourceProductSlug)
      delete props.resourceProductSlug
    }

    if (Array.isArray(props.manualProducts)) {
      props.manualProducts = props.manualProducts.map((mp: Record<string, unknown>) => {
        const rawSlug = (mp.productSlug || mp.productId) as string | number | undefined
        if (typeof rawSlug === 'string' && productIds.has(rawSlug)) {
          return {
            ...mp,
            productId: productIds.get(rawSlug),
          }
        }
        return mp
      })
    }

    for (const [key, val] of Object.entries(props)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0]?.type) {
        props[key] = val.map((child) => resolveBlockProductIds(child as Record<string, unknown>))
      }
    }

    return item
  }

  const pageIds = new Map<string, number>()
  for (const { slug, title, blocks } of data.pages) {
    const resolvedBlocks = blocks.map((b) =>
      resolveBlockProductIds(b as unknown as Record<string, unknown>),
    )
    const puckData = { content: resolvedBlocks, root: { props: { title } }, zones: {} }
    pageIds.set(slug, (await upsert('pages', 'slug', slug, { title, puckData }))!)
  }

  report.templateDrafts = await seedTemplateDrafts(payload)

  // Globals: only fill when empty (or, for the main menu, still the old seed menu) so real
  // settings entered by Hana are never overwritten.
  const navigation = (await payload.findGlobal({ slug: 'navigation', depth: 0 })) as {
    mainMenu?: StoredMenuItem[]
    footerMenu?: unknown[]
  }
  const withPage = <T extends { page?: string }>({ page, ...item }: T) => ({
    ...item,
    ...(page ? { page: pageIds.get(page) } : {}),
  })
  const toMenu = (items: data.NavItemSeed[]) =>
    items.map(({ children, ...item }) => ({
      ...withPage(item),
      ...(children
        ? {
            children: children.map((group) => ({
              ...group,
              items: group.items.map(withPage),
            })),
          }
        : {}),
    }))
  const navUpdate: Record<string, unknown> = {}
  if (!navigation.mainMenu?.length || isLegacySeedMenu(navigation.mainMenu, pageIds)) {
    navUpdate.mainMenu = toMenu(data.mainMenu)
  }
  if (!navigation.footerMenu?.length) navUpdate.footerMenu = toMenu(data.footerMenu)
  if (Object.keys(navUpdate).length) {
    await payload.updateGlobal({ slug: 'navigation', data: navUpdate })
    tally('navigation').updated++
  }

  const settings = (await payload.findGlobal({ slug: 'siteSettings', depth: 0 })) as {
    shopeeStoreUrl?: string | null
    leadStatusOptions?: unknown[] | null
  }
  const settingsUpdate: Record<string, unknown> = {}
  if (!settings.shopeeStoreUrl) settingsUpdate.shopeeStoreUrl = 'https://shopee.vn/'
  if (!settings.leadStatusOptions?.length) settingsUpdate.leadStatusOptions = data.leadStatusOptions
  if (Object.keys(settingsUpdate).length) {
    await payload.updateGlobal({ slug: 'siteSettings', data: settingsUpdate })
    tally('siteSettings').updated++
  }

  const journeyContent = (await payload.findGlobal({
    slug: 'habitJourneyContent',
    depth: 0,
  })) as {
    stations?: unknown[] | null
    diagnose?: {
      title?: string | null
      questions?: unknown[] | null
    } | null
  } | null

  const journeyUpdate: Record<string, unknown> = {}
  if (!journeyContent?.stations?.length) {
    journeyUpdate.stations = [
      { name: '[MẪU] Trạm 1' },
      { name: '[MẪU] Trạm 2' },
      { name: '[MẪU] Trạm 3' },
      { name: '[MẪU] Trạm 4' },
    ]
  }
  if (!journeyContent?.diagnose?.questions?.length && !journeyContent?.diagnose?.title) {
    journeyUpdate.diagnose = data.habitJourneyDiagnose
  }

  if (Object.keys(journeyUpdate).length > 0) {
    await payload.updateGlobal({
      slug: 'habitJourneyContent',
      data: journeyUpdate,
    })
    tally('habitJourneyContent').updated++
  }

  return report
}

type StoredMenuItem = {
  label?: string | null
  linkType?: string | null
  page?: unknown
  url?: string | null
  highlight?: boolean | null
  children?: unknown[] | null
}

/**
 * True while the stored main menu is still the pre-sitemap-v2 seed menu – before or after the
 * SM-02 migration rewrote its links / page slugs. Any edit by Hana makes it false.
 */
export function isLegacySeedMenu(
  menu: readonly StoredMenuItem[],
  pageIds: ReadonlyMap<string, number>,
): boolean {
  if (menu.length !== data.legacyMainMenu.length) return false
  const newSlug = (slug: string) => LEGACY_PAGE_SLUGS.find((m) => m.from === slug)?.to ?? slug
  const pageId = (page: unknown) =>
    typeof page === 'object' && page !== null ? (page as { id?: unknown }).id : page
  return data.legacyMainMenu.every((seed, index) => {
    const item = menu[index]!
    if (item.label !== seed.label || item.linkType !== seed.linkType) return false
    if (Boolean(item.highlight) !== Boolean(seed.highlight)) return false
    if (item.children?.length) return false
    if (seed.linkType === 'url') return item.url === seed.url || item.url === rewriteLink(seed.url!)
    const expected = pageIds.get(newSlug(seed.page!)) ?? pageIds.get(seed.page!)
    return expected !== undefined && pageId(item.page) === expected
  })
}
