import 'server-only'
import type { Data } from '@puckeditor/core'
import type { Payload } from 'payload'
import { getOfferProductById } from '@/lib/habit.server'
import { walkPuckItems } from './walk'
import {
  isProductPageBlockType,
  PRODUCT_RESOURCE_FORM_TYPE,
  type ProductPageResolved,
} from './product-page-types'

/** siteSettings.habitJourneyDays (default 28), as on the coded offer page (HB-15c). */
export async function getJourneyDays(payload: Payload): Promise<number> {
  try {
    const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })
    const days = (settings as { habitJourneyDays?: unknown })?.habitJourneyDays
    return typeof days === 'number' && days > 0 ? days : 28
  } catch {
    return 28
  }
}

/**
 * BX-08: attaches `_resolved = { offer, journeyDays }` to every "Trang sản phẩm" block (also inside
 * slots). Only the product id is stored in the page; texts, prices, lists come from the product at
 * render time, so editing the product updates every page.
 */
export async function resolveProductPageBlocks(data: Data, payload: Payload): Promise<void> {
  const ids = new Set<string>()
  await walkPuckItems(data, (item) => {
    if (isProductPageBlockType(item.type) && item.props.productId) {
      ids.add(String(item.props.productId))
    }
  })
  let journeyDays = 28
  const offers = new Map<string, ProductPageResolved['offer']>()
  if (ids.size > 0) {
    journeyDays = await getJourneyDays(payload)
    await Promise.all(
      [...ids].map(async (id) => {
        offers.set(id, await getOfferProductById(id, payload))
      }),
    )
  }
  await walkPuckItems(data, (item) => {
    if (!isProductPageBlockType(item.type)) return
    const id = item.props.productId ? String(item.props.productId) : ''
    const resolved: ProductPageResolved = { offer: id ? (offers.get(id) ?? null) : null, journeyDays }
    item.props._resolved = resolved
  })

  // Free-resource form: slug + name + whether files exist (the files themselves stay admin-only).
  const resourceIds = new Set<string>()
  await walkPuckItems(data, (item) => {
    if (item.type === PRODUCT_RESOURCE_FORM_TYPE && item.props.productId) {
      resourceIds.add(String(item.props.productId))
    }
  })
  const resources = new Map<string, { slug: string; name: string; hasFiles: boolean } | null>()
  await Promise.all(
    [...resourceIds].map(async (id) => {
      try {
        const res = await payload.find({
          collection: 'products',
          where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
          limit: 1,
          depth: 0,
          draft: false,
        })
        const doc = res.docs[0] as
          | { slug?: string; name?: string; files?: unknown[] | null; saleStatus?: string }
          | undefined
        resources.set(
          id,
          doc && doc.slug && doc.saleStatus !== 'hidden'
            ? {
                slug: doc.slug,
                name: doc.name || '',
                hasFiles: Array.isArray(doc.files) && doc.files.length > 0,
              }
            : null,
        )
      } catch {
        resources.set(id, null)
      }
    }),
  )
  await walkPuckItems(data, (item) => {
    if (item.type !== PRODUCT_RESOURCE_FORM_TYPE) return
    const id = item.props.productId ? String(item.props.productId) : ''
    item.props._resolved = id ? (resources.get(id) ?? null) : null
  })
}
