import type { Data } from '@puckeditor/core'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'

/**
 * BX-08: builder page that replaces a coded product page. Not registered in the `pages.template`
 * select (that would change a DB enum): the product form builds `puckData` directly with the
 * product id already set in every block.
 */

export type ProductPageKind = 'offer' | 'resource'

export interface ProductPageTarget {
  kind: ProductPageKind
  /** `pages.slug` that replaces the coded route (no leading slash). */
  slug: string
}

/** Which coded product page a product has, or null when none can be replaced (yet). */
export function productPageTarget(product: {
  slug?: string | null
  type?: string | null
  saleStatus?: string | null
}): ProductPageTarget | null {
  const slug = product.slug?.trim()
  if (!slug) return null
  if (slug === HABIT_TRACKER_PRODUCT_SLUG) {
    return { kind: 'offer', slug: 'habit/1-percent-better' }
  }
  if ((product.type === 'ebook' || product.type === 'toolkit') && product.saleStatus === 'free') {
    return { kind: 'resource', slug: `tai-nguyen/${slug}` }
  }
  return null
}

let counter = 0
const blockId = (type: string) =>
  `${type}-bx08-${Date.now().toString(36)}-${(counter++).toString(36)}`

/**
 * "Trang giới thiệu công cụ số": same section order as the coded offer page.
 * "Trang tài nguyên": hero (image left, no buy button) + resource request form.
 */
export function buildProductPageData(
  kind: ProductPageKind,
  productId: string | number,
  title: string,
): Data {
  const productIdStr = String(productId)
  const block = (type: string, props: Record<string, unknown> = {}) => ({
    type,
    props: { id: blockId(type), version: 1, productId: productIdStr, ...props },
  })

  const content =
    kind === 'offer'
      ? [
          block('ProductOfferHero', {
            imagePosition: 'none',
            align: 'center',
            showPrice: true,
            showIncludes: true,
            showPrimaryCta: true,
            secondaryButton: 'habitLoop',
            bg: 'warm-ivory',
            titleHighlightStyle: 'color',
            titleHighlightAnimation: 'none',
            extra: [],
          }),
          block('ProductOfferStats', {
            showVideos: true,
            showTechniques: true,
            showDays: true,
            showUnits: true,
            mobileColumns: 2,
            bg: 'white',
          }),
          block('ProductOfferCurriculum', { layout: 'list', numbered: true, bg: 'warm-ivory' }),
          block('ProductOfferFeatures', { layout: 'grid-3', showIcon: true, bg: 'white' }),
          block('ProductOfferFaq', { columns: 1, bg: 'warm-ivory' }),
          block('ProductOfferBottom', { secondaryButton: 'habitLoop', bg: 'gradient', extra: [] }),
        ]
      : [
          block('ProductOfferHero', {
            imagePosition: 'left',
            align: 'left',
            showPrice: false,
            showIncludes: true,
            showPrimaryCta: false,
            secondaryButton: 'none',
            bg: 'warm-ivory',
            titleHighlightStyle: 'color',
            titleHighlightAnimation: 'none',
            extra: [],
          }),
          block('ProductResourceForm'),
        ]

  return { root: { props: { title } }, content, zones: {} } as Data
}
