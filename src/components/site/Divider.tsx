import React from 'react'
import { HeartLine } from '@/components/brand/HeartLine'
import { ThinLine } from '@/components/brand/ThinLine'

export type DividerVariant = 'thin-line' | 'heart-line'

export interface DividerProps {
  version?: number
  variant?: DividerVariant
  spacing?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right'
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const SPACING_CLASSES = {
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8',
} as const

const ALIGN_CLASSES = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

export function Divider({
  variant = 'thin-line',
  spacing = 'md',
  align = 'center',
  bgColor,
}: DividerProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const containerBgClass = bgColor ? BG_COLORS[bgColor] : ''

  const thinLineColor = isDeepNavy ? 'text-white/25' : 'text-deep-navy/15'
  const heartLineColor = isDeepNavy ? 'text-soft-pink' : 'text-accent-pink'

  return (
    <div className={`w-full ${containerBgClass} ${SPACING_CLASSES[spacing]} flex ${ALIGN_CLASSES[align]}`}>
      {variant === 'heart-line' ? (
        <HeartLine className={heartLineColor} width={160} height={24} />
      ) : (
        <ThinLine className={thinLineColor} width={160} height={2} />
      )}
    </div>
  )
}
