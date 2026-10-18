import React from 'react'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'

export interface CalloutProps {
  version?: number
  title: string
  description: string
  showButton?: boolean
  buttonText?: string
  buttonLinkType?: 'url' | 'page'
  buttonPageId?: string | number
  buttonLink?: string
  buttonVariant?: ButtonVariant
  buttonSize?: ButtonSize
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    pageSlug?: string | null
  }
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

export function Callout({
  title,
  description,
  showButton = true,
  buttonText,
  buttonLinkType = 'url',
  buttonLink = '#',
  buttonVariant = 'primary',
  buttonSize = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
}: CalloutProps) {
  let targetHref: string = buttonLink || '#'
  if (buttonLinkType === 'page') {
    const resolvedSlug = _resolved?.pageSlug
    if (typeof resolvedSlug === 'string' && resolvedSlug.trim() !== '') {
      const slug = resolvedSlug.trim()
      targetHref = slug === '/' ? '/' : slug.startsWith('/') ? slug : `/${slug}`
    } else {
      targetHref = '#'
    }
  }

  const safeLink = safeHref(targetHref)

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-card sm:rounded-[24px] bg-deep-navy px-8 py-10 sm:px-12 sm:py-14 text-center text-white shadow-soft">
          {title && (
            <h2 className="font-ui text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-snug">
              {title}
            </h2>
          )}

          {description && (
            <p className="mx-auto mt-4 max-w-2xl font-ui text-base sm:text-lg leading-relaxed text-white/90">
              {description}
            </p>
          )}

          {showButton && buttonText && safeLink && (
            <div className="mt-8 flex justify-center">
              <Button href={safeLink} variant={buttonVariant} size={buttonSize}>
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
