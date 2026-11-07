import React from 'react'
import Image from 'next/image'
import {
  heroMinHeightClass,
  heroOverlayClass,
  heroImageBlurStyle,
  type HeroOverlayTone,
  type HeroOverlayStrength,
  type HeroImageBlur,
  type HeroImagePosition,
  type HeroContentAlign,
  type HeroMinHeight,
} from '@/lib/brand/hero-backdrop'

export interface HeroBackdropProps {
  id?: string
  imageUrl?: string
  imageAlt?: string
  overlayTone?: HeroOverlayTone
  overlayStrength?: HeroOverlayStrength
  imageBlur?: HeroImageBlur
  imagePosition?: HeroImagePosition
  contentAlign?: HeroContentAlign
  minHeight?: HeroMinHeight
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  priority?: boolean
  className?: string
  children: React.ReactNode
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-6 sm:px-8',
  md: 'py-14 px-6 sm:px-8 lg:px-12',
  lg: 'py-20 px-6 sm:px-12',
} as const

/**
 * EB-14a §1.3: Shared hero backdrop wrapper component for HeroTwoEntries and HeroImage.
 * - Image covers full section with next/image (priority, 100vw, object-cover, blur/scale).
 * - Overlay has dark (deep-navy) or light (warm-ivory) tone at 60%, 75% or 85% opacity.
 * - Content is layered above with z-10 and contentAlign.
 * - If no valid image/alt, gracefully falls back to bgColor with no overlay.
 */
export function HeroBackdrop({
  id,
  imageUrl,
  imageAlt,
  overlayTone = 'dark',
  overlayStrength = 'lg',
  imageBlur = 'none',
  imagePosition = 'center',
  contentAlign = 'center',
  minHeight = 'lg',
  bgColor = 'warm-ivory',
  padding = 'md',
  priority = true,
  className = '',
  children,
}: HeroBackdropProps) {
  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)
  const minHClass = heroMinHeightClass(minHeight)
  const overlayClass = heroOverlayClass(overlayTone, overlayStrength)
  const blurStyle = heroImageBlurStyle(imageBlur)

  const sectionBgClass = hasValidImage ? 'bg-deep-navy' : BG_COLORS[bgColor]
  const dataBg = hasValidImage ? (overlayTone === 'dark' ? 'deep-navy' : 'warm-ivory') : bgColor

  const alignContainerClass =
    contentAlign === 'left'
      ? 'flex flex-col items-start text-left'
      : 'flex flex-col items-center text-center'

  return (
    <section
      id={id}
      data-eb-section=""
      className={`group/hero relative w-full overflow-hidden isolate flex flex-col justify-center ${minHClass} ${sectionBgClass} ${PADDINGS[padding]} transition-colors ${className}`}
      data-bg={dataBg}
    >
      {hasValidImage ? (
        <>
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <Image
              src={imageUrl!}
              alt={imageAlt!.trim()}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover pointer-events-none"
              style={{
                objectPosition: imagePosition,
                ...blurStyle,
              }}
            />
          </div>
          <div
            className={`absolute inset-0 -z-10 pointer-events-none ${overlayClass}`}
            aria-hidden="true"
          />
        </>
      ) : null}

      <div className={`relative z-10 mx-auto w-full max-w-5xl ${alignContainerClass}`}>
        {children}
      </div>
    </section>
  )
}
