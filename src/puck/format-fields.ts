import { allowedTextColors } from '@/lib/brand/format-classes'
import { ALIGN_OPTIONS, FONT_SIZE_OPTIONS } from './constants'

/** PK-10: shared format fields for text blocks. Sizes / align are presets, never free input. */
export function sizeField(label: string) {
  return { type: 'select' as const, label, options: [...FONT_SIZE_OPTIONS] }
}

export function alignField(label = 'Căn lề') {
  return { type: 'select' as const, label, options: [...ALIGN_OPTIONS] }
}

/** Colour select limited to colours that pass WCAG AA on `bg` (deep-navy = automatic). */
export function colorField(label: string, bg: string, large = false) {
  return { type: 'select' as const, label, options: allowedTextColors(bg, large) }
}
