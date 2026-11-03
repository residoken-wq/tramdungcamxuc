import type React from 'react'
import { vi } from '@/lib/i18n/vi'
import { CONTAINER_BG_POSITIONS, type ContainerBgPosition } from '@/puck/style/container-schema'

export type HeroLayout = 'split' | 'backdrop'
export type HeroOverlayTone = 'dark' | 'light'
export type HeroOverlayStrength = 'md' | 'lg' | 'xl'
export type HeroImageBlur = 'none' | 'sm' | 'md'
export type HeroImagePosition = ContainerBgPosition
export type HeroContentAlign = 'left' | 'center'
export type HeroMinHeight = 'md' | 'lg' | 'screen'

export interface HeroBackdropColors {
  seriesLabel: string
  titleLine1: string
  titleLine2: string
  emotionLine: string
  description: string
  chip: string
  secondaryButton: string
  overlayBg: string
  bgToken: 'deep-navy' | 'warm-ivory'
}

/**
 * EB-14a §1.2: Pure helper calculating text, chip, button and overlay color classes
 * according to the backdrop overlay tone (dark or light).
 * In dark mode, titleLine2 is soft-pink (never bright-magenta, which fails WCAG AA).
 */
export function heroBackdropColors(tone: HeroOverlayTone = 'dark'): HeroBackdropColors {
  if (tone === 'dark') {
    return {
      seriesLabel: 'text-soft-pink',
      titleLine1: 'text-white',
      titleLine2: 'text-soft-pink',
      emotionLine: 'text-white/90',
      description: 'text-white/90',
      chip: 'bg-white/10 text-white border border-white/20',
      secondaryButton: 'text-white border-white/40 hover:bg-white/10',
      overlayBg: 'bg-deep-navy',
      bgToken: 'deep-navy',
    }
  }

  return {
    seriesLabel: 'text-bright-magenta',
    titleLine1: 'text-deep-navy',
    titleLine2: 'text-bright-magenta',
    emotionLine: 'text-deep-navy/85',
    description: 'text-deep-navy/85',
    chip: 'bg-soft-pink text-deep-navy border border-soft-pink',
    secondaryButton: '',
    overlayBg: 'bg-warm-ivory',
    bgToken: 'warm-ivory',
  }
}

/**
 * Returns Tailwind background + opacity class for the backdrop overlay.
 */
export function heroOverlayClass(
  tone: HeroOverlayTone = 'dark',
  strength: HeroOverlayStrength = 'lg',
): string {
  const opacities: Record<HeroOverlayStrength, string> = {
    md: '60',
    lg: '75',
    xl: '85',
  }
  const op = opacities[strength] ?? '75'
  return tone === 'dark' ? `bg-deep-navy/${op}` : `bg-warm-ivory/${op}`
}

/**
 * Returns Tailwind min-height class according to selection.
 */
export function heroMinHeightClass(minHeight: HeroMinHeight = 'lg'): string {
  switch (minHeight) {
    case 'md':
      return 'min-h-[480px]'
    case 'screen':
      return 'min-h-[100svh]'
    case 'lg':
    default:
      return 'min-h-[640px]'
  }
}

/**
 * Returns inline styles for image blur and subtle zoom (to prevent white fringe).
 */
export function heroImageBlurStyle(blur: HeroImageBlur = 'none'): React.CSSProperties {
  switch (blur) {
    case 'sm':
      return { filter: 'blur(4px)', transform: 'scale(1.05)' }
    case 'md':
      return { filter: 'blur(8px)', transform: 'scale(1.05)' }
    case 'none':
    default:
      return {}
  }
}

export const HERO_LAYOUT_OPTIONS = [
  { label: vi.eb14a.layoutOptions.split, value: 'split' as const },
  { label: vi.eb14a.layoutOptions.backdrop, value: 'backdrop' as const },
]

export const HERO_OVERLAY_TONE_OPTIONS = [
  { label: vi.eb14a.overlayToneOptions.dark, value: 'dark' as const },
  { label: vi.eb14a.overlayToneOptions.light, value: 'light' as const },
]

export const HERO_OVERLAY_STRENGTH_OPTIONS = [
  { label: vi.eb14a.overlayStrengthOptions.md, value: 'md' as const },
  { label: vi.eb14a.overlayStrengthOptions.lg, value: 'lg' as const },
  { label: vi.eb14a.overlayStrengthOptions.xl, value: 'xl' as const },
]

export const HERO_IMAGE_BLUR_OPTIONS = [
  { label: vi.eb14a.imageBlurOptions.none, value: 'none' as const },
  { label: vi.eb14a.imageBlurOptions.sm, value: 'sm' as const },
  { label: vi.eb14a.imageBlurOptions.md, value: 'md' as const },
]

export const HERO_IMAGE_POSITION_OPTIONS = CONTAINER_BG_POSITIONS.map((pos) => ({
  label: vi.eb14a.imagePositions[pos],
  value: pos,
}))

export const HERO_CONTENT_ALIGN_OPTIONS = [
  { label: vi.eb14a.contentAlignOptions.left, value: 'left' as const },
  { label: vi.eb14a.contentAlignOptions.center, value: 'center' as const },
]

export const HERO_MIN_HEIGHT_OPTIONS = [
  { label: vi.eb14a.minHeightOptions.md, value: 'md' as const },
  { label: vi.eb14a.minHeightOptions.lg, value: 'lg' as const },
  { label: vi.eb14a.minHeightOptions.screen, value: 'screen' as const },
]
