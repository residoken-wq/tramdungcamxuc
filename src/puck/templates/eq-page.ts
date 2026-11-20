import type { Data } from '@puckeditor/core'

/** BX-08b: `pages.slug` of the builder page that replaces the coded /eq-buddy intro. */
export const EQ_BUDDY_PAGE_SLUG = 'eq-buddy'

let counter = 0
const blockId = (type: string) =>
  `${type}-bx08b-${Date.now().toString(36)}-${(counter++).toString(36)}`

/**
 * "Trang EQ Buddy": same order as the coded page – framed header with "Bộ thẻ là gì" and the
 * draw button inside, then the Shopee button. Only layout options are stored, no text.
 */
export function buildEqPageData(title: string): Data {
  const block = (type: string, props: Record<string, unknown> = {}) => ({
    type,
    props: { id: blockId(type), version: 1, ...props },
  })
  return {
    root: { props: { title } },
    content: [
      block('EqBuddyFrame', {
        showSeriesBar: true,
        showGuideButton: true,
        showHeader: true,
        align: 'auto',
        bg: 'warm-ivory',
        content: [
          block('EqBuddyWhatIs', { columns: 2, showIcons: true, inCard: false }),
          block('EqBuddyDrawButton', { size: 'auto', showGuideButton: true, inCard: false }),
        ],
      }),
      block('EqBuddyShopee'),
    ],
    zones: {},
  } as Data
}
