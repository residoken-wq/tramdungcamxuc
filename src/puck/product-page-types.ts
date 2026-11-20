import type { HabitProductData } from '@/lib/habit.server'

/** BX-08: block types of the "Trang sản phẩm" builder group (data resolved from a product id). */
export const PRODUCT_PAGE_BLOCK_TYPES = [
  'ProductOfferHero',
  'ProductOfferStats',
  'ProductOfferCurriculum',
  'ProductOfferFeatures',
  'ProductOfferFaq',
  'ProductOfferBottom',
] as const

/** BX-08: free-resource request form block (resolved separately: slug, name, has files). */
export const PRODUCT_RESOURCE_FORM_TYPE = 'ProductResourceForm'

export type ProductPageBlockType = (typeof PRODUCT_PAGE_BLOCK_TYPES)[number]

/** Server-resolved data attached to a product-page block (never stored in `puckData`). */
export interface ProductPageResolved {
  offer: HabitProductData | null
  journeyDays: number
}

export function isProductPageBlockType(type: unknown): type is ProductPageBlockType {
  return typeof type === 'string' && (PRODUCT_PAGE_BLOCK_TYPES as readonly string[]).includes(type)
}
