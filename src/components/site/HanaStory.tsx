import React from 'react'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { HeartLine } from '@/components/brand/HeartLine'
import { safeHref } from '@/lib/safe-href'

export interface HanaStoryProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  storyContent?: string
  quoteLine?: string
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  buttonText?: string
  buttonLink?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  puck?: {
    isEditing?: boolean
  }
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
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function HanaStory({
  seriesLabel,
  titleLine1,
  titleLine2,
  storyContent,
  quoteLine,
  imageUrl,
  imageAlt,
  buttonText,
  buttonLink,
  bgColor = 'warm-ivory',
  padding = 'md',
}: HanaStoryProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const safeButtonHref = buttonLink ? safeHref(buttonLink) : null

  // Split multi-paragraph text
  const paragraphs = storyContent ? storyContent.split('\n\n').filter(Boolean) : []

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Portrait Photo Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {imageUrl ? (
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-card overflow-hidden shadow-sm border border-deep-navy/10 bg-soft-pink">
                <Image
                  src={imageUrl}
                  alt={imageAlt || 'Chân dung Hana Lương'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full max-w-sm aspect-[4/5] rounded-card border-2 border-dashed border-deep-navy/20 flex flex-col items-center justify-center p-6 text-center bg-white/40">
                <span className="font-ui text-sm text-deep-navy/60">
                  {imageAlt || 'Chưa chọn ảnh chân dung'}
                </span>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <HeartLine className="w-20 h-4 text-accent-pink/50" />
            </div>
          </div>

          {/* Story Narrative & Quotes Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            {(seriesLabel || titleLine1 || titleLine2) && (
              <div className="mb-6">
                <SectionHeader
                  seriesLabel={seriesLabel}
                  titleLine1={titleLine1 || ''}
                  titleLine2={titleLine2}
                  align="left"
                  as="h2"
                />
              </div>
            )}

            {/* Story Paragraphs */}
            {paragraphs.length > 0 && (
              <div
                className={`space-y-4 font-sans text-base sm:text-lg leading-relaxed ${
                  isDeepNavy ? 'text-white/85' : 'text-deep-navy/85'
                }`}
              >
                {paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}

            {/* Emotional Quote Block */}
            {quoteLine && (
              <div className="mt-6 p-5 sm:p-6 rounded-card bg-white/70 border border-deep-navy/10 shadow-sm">
                <p className="font-quote italic text-lg sm:text-xl text-deep-navy leading-relaxed">
                  &ldquo;{quoteLine}&rdquo;
                </p>
              </div>
            )}

            {/* Optional CTA Button */}
            {buttonText && safeButtonHref && (
              <div className="mt-8">
                <Button href={safeButtonHref} variant="primary" size="lg">
                  {buttonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
