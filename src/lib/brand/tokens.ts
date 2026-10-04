/**
 * Brand Design Tokens for Trạm Dừng Cảm Xúc (Brand Book 2026)
 * Source of truth: AGENTS.md §5 & .agents/skills/tdcx-brand/SKILL.md
 */

export const BRAND_COLORS_HEX = {
  'deep-navy': '#280A60',
  'bright-magenta': '#BC039E',
  'accent-pink': '#EF3B83',
  'soft-pink': '#FDE6F6',
  'lavender-mist': '#E9DDF9',
  'mint-haze': '#D9F1EA',
  'butter-cream': '#F6E9B8',
  'warm-ivory': '#FAF7F4',
} as const

export type BrandColorToken = keyof typeof BRAND_COLORS_HEX

export const BRAND_COLORS_RGB: Record<BrandColorToken, string> = {
  'deep-navy': '40 10 96',
  'bright-magenta': '188 3 158',
  'accent-pink': '239 59 131',
  'soft-pink': '253 230 246',
  'lavender-mist': '233 221 249',
  'mint-haze': '217 241 234',
  'butter-cream': '246 233 184',
  'warm-ivory': '250 247 244',
}

export const BRAND_COLOR_DESCRIPTIONS: Record<BrandColorToken, string> = {
  'deep-navy': 'Tiêu đề chính, text đậm, nền tối (#280A60)',
  'bright-magenta': 'Tiêu đề tầng 2, điểm nhấn (#BC039E)',
  'accent-pink': 'Nút CTA chính, trái tim, link (#EF3B83)',
  'soft-pink': 'Nền card, badge (#FDE6F6)',
  'lavender-mist': 'Nền section, card phụ (#E9DDF9)',
  'mint-haze': 'Trạng thái thành công, tracker (#D9F1EA)',
  'butter-cream': 'Highlight, nhắc nhở (#F6E9B8)',
  'warm-ivory': 'Nền trang (#FAF7F4)',
}

export const BRAND_SPACING = {
  'breath-sm': '16px',
  'breath-md': '24px',
  'breath-lg': '32px',
} as const

export const BRAND_RADII = {
  card: '20px',
} as const

export const BRAND_SHADOWS = {
  soft: '0 4px 20px -2px rgba(40, 10, 96, 0.06)',
} as const

export const BRAND_GRADIENT =
  'linear-gradient(135deg, var(--color-lavender-mist) 0%, var(--color-soft-pink) 35%, var(--color-butter-cream) 70%, var(--color-warm-ivory) 100%)'
