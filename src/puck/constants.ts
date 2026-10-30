export const SECTION_BG_COLOR_OPTIONS = [
  { label: 'Ngà ấm (Warm Ivory)', value: 'warm-ivory' },
  { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
  { label: 'Tím sương (Lavender Mist)', value: 'lavender-mist' },
  { label: 'Bạc hà (Mint Haze)', value: 'mint-haze' },
  { label: 'Kem bơ (Butter Cream)', value: 'butter-cream' },
  { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
] as const

export const BRAND_COLOR_OPTIONS = SECTION_BG_COLOR_OPTIONS

export const PADDING_OPTIONS = [
  { label: 'Nhỏ (S - 24px)', value: 'sm' },
  { label: 'Vừa (M - 48px)', value: 'md' },
  { label: 'Lớn (L - 72px)', value: 'lg' },
] as const

export const FONT_SIZE_OPTIONS = [
  { label: 'Nhỏ', value: 'sm' },
  { label: 'Vừa', value: 'md' },
  { label: 'Lớn', value: 'lg' },
] as const

export type FontSizeOption = (typeof FONT_SIZE_OPTIONS)[number]['value']

export const TEXT_COLOR_OPTIONS = [
  { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
  { label: 'Hồng sen (Bright Magenta)', value: 'bright-magenta' },
  { label: 'Hồng nhấn (Accent Pink)', value: 'accent-pink' },
  { label: 'Trắng (White)', value: 'white' },
  { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
] as const

export type TextColorOption = (typeof TEXT_COLOR_OPTIONS)[number]['value']

export const ALIGN_OPTIONS = [
  { label: 'Căn trái', value: 'left' },
  { label: 'Căn giữa', value: 'center' },
] as const

export type AlignOption = (typeof ALIGN_OPTIONS)[number]['value']

/**
 * Child blocks that only make sense inside their parent's slot (hidden from the sidebar,
 * `permissions.insert: false`). The page root refuses them so a drag that overshoots the parent
 * cannot leave an orphan card at the top level (PK-07).
 */
export const CHILD_BLOCK_TYPES = [
  'Card',
  'Stat',
  'Step',
  'ServiceCard',
  'PackageCard',
  'FaqItem',
  'EntryCard',
  'PathCard',
  'VisionCard',
]

/** Puck's id for the page-level drop zone (`root:default-zone`). */
export const ROOT_DROP_ZONE = 'root:default-zone'
