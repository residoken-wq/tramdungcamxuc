/**
 * PK-13 element size presets (Nhỏ / Vừa / Lớn / Rất lớn). Literal class strings so Tailwind
 * sees them; `md` matches the size the same element has in the fixed blocks.
 */
export type ElementSize = 'sm' | 'md' | 'lg' | 'xl'

export const ELEMENT_SIZE_OPTIONS = [
  { label: 'Nhỏ', value: 'sm' },
  { label: 'Vừa', value: 'md' },
  { label: 'Lớn', value: 'lg' },
  { label: 'Rất lớn', value: 'xl' },
] as const

export const HEADING_SIZES: Record<ElementSize, string> = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
  xl: 'text-5xl sm:text-6xl',
}

export const PARAGRAPH_SIZES: Record<ElementSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base sm:text-lg',
  xl: 'text-lg sm:text-xl',
}

export const EMOTION_SIZES: Record<ElementSize, string> = {
  sm: 'text-base',
  md: 'text-lg sm:text-xl',
  lg: 'text-xl sm:text-2xl',
  xl: 'text-2xl sm:text-3xl',
}

export const LABEL_SIZES: Record<ElementSize, string> = {
  sm: 'text-xs',
  md: 'text-xs sm:text-sm',
  lg: 'text-sm sm:text-base',
  xl: 'text-base sm:text-lg',
}

export function pick(scale: Record<ElementSize, string>, size?: ElementSize): string {
  return scale[size ?? 'md'] ?? scale.md
}
