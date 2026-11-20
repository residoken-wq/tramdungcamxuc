import type { EqIntroContent } from '@/lib/eq/intro-view'

/** BX-08b: block types of the "EQ Buddy" builder group (data from the "Nội dung EQ Buddy" global). */
export const EQ_PAGE_BLOCK_TYPES = [
  'EqBuddyFrame',
  'EqBuddyWhatIs',
  'EqBuddyDrawButton',
  'EqBuddyGuide',
  'EqBuddyShopee',
] as const

export type EqPageBlockType = (typeof EQ_PAGE_BLOCK_TYPES)[number]

/** Server-resolved data attached to an EQ Buddy block (never stored in `puckData`). */
export interface EqPageResolved {
  /**
   * Not named `content`: Puck walks nested props with the block's field map, and the frame block
   * has a slot field called `content`.
   */
  eqContent: EqIntroContent
}

export function isEqPageBlockType(type: unknown): type is EqPageBlockType {
  return typeof type === 'string' && (EQ_PAGE_BLOCK_TYPES as readonly string[]).includes(type)
}
