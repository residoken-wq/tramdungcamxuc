import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { HeartLine } from '@/components/brand/HeartLine'
import { vi } from '@/lib/i18n/vi'

export interface TestimonialPhoto {
  src: string
  alt: string
}

export interface TestimonialStory {
  before?: string
  insight?: string
  after?: string
}

export interface TestimonialCardProps {
  quote?: string
  name: string
  role?: string | null
  age?: number | string | null
  story?: TestimonialStory | null
  relatedOffer?: string | null
  photo?: TestimonialPhoto | null
  consent: boolean
  variant?: 'quote' | 'story' | 'stages'
  className?: string
}

export function TestimonialCard({
  quote,
  name,
  role,
  age,
  story,
  relatedOffer,
  photo,
  consent,
  variant = 'quote',
  className = '',
}: TestimonialCardProps) {
  // AGENTS.md §7: Testimonial must only be displayed when consent === true
  if (!consent) {
    return null
  }

  // Filter missing variant data
  if (variant === 'story' && !story?.before && !story?.after) {
    return null
  }
  if (variant === 'stages' && !story?.before && !story?.insight && !story?.after) {
    return null
  }

  const displayNameWithAge = age ? `${name}, ${age} ${vi.sm03?.ageSuffix || 'tuổi'}` : name

  const avatar = photo?.src ? (
    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-deep-navy/15 flex-shrink-0 bg-soft-pink">
      <Image
        src={photo.src}
        alt={photo.alt || name}
        width={48}
        height={48}
        className="object-cover w-full h-full text-[0px]"
      />
    </div>
  ) : (
    <div
      className="w-12 h-12 rounded-full bg-soft-pink text-deep-navy font-ui font-bold text-base flex items-center justify-center border border-deep-navy/15 flex-shrink-0"
      aria-hidden="true"
    >
      {name.charAt(0)}
    </div>
  )

  const relatedOfferBadge = relatedOffer ? (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-ui font-semibold bg-lavender-mist/70 text-deep-navy self-start mt-1">
      {vi.sm03.relatedOfferLabel} {relatedOffer}
    </span>
  ) : null

  // Variant: Story (tr. 19: Trước / Sau)
  if (variant === 'story') {
    return (
      <Card
        as="article"
        variant="white"
        className={`relative flex flex-col justify-between p-6 sm:p-8 ${className}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-deep-navy/10">
            {avatar}
            <div className="flex flex-col">
              <cite className="not-italic font-ui font-bold text-base text-deep-navy">
                {displayNameWithAge}
              </cite>
              {role && (
                <span className="text-xs sm:text-sm font-sans text-deep-navy/70 leading-tight">
                  {role}
                </span>
              )}
              {relatedOfferBadge}
            </div>
          </div>

          {/* Story comparison */}
          <div className="mt-5 space-y-3">
            {story?.before && (
              <div className="rounded-xl border border-deep-navy/10 bg-warm-ivory/80 p-3.5">
                <span className="block font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-1">
                  {vi.sm03.before}
                </span>
                <p className="font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed">
                  {story.before}
                </p>
              </div>
            )}
            {story?.after && (
              <div className="rounded-xl border border-deep-navy/10 bg-mint-haze/50 p-3.5">
                <span className="block font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-1">
                  {vi.sm03.after}
                </span>
                <p className="font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed">
                  {story.after}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <blockquote className="mt-5 pt-4 border-t border-deep-navy/10">
            <p className="font-quote italic text-sm sm:text-base text-deep-navy/90 leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>
        )}
      </Card>
    )
  }

  // Variant: Stages (tr. 44: Vấn đề ban đầu / Quá trình nhận thức / Kết quả chuyển hóa)
  if (variant === 'stages') {
    return (
      <Card
        as="article"
        variant="white"
        className={`relative flex flex-col justify-between p-6 sm:p-8 ${className}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-deep-navy/10">
            {avatar}
            <div className="flex flex-col">
              <cite className="not-italic font-ui font-bold text-base text-deep-navy">
                {displayNameWithAge}
              </cite>
              {role && (
                <span className="text-xs sm:text-sm font-sans text-deep-navy/70 leading-tight">
                  {role}
                </span>
              )}
              {relatedOfferBadge}
            </div>
          </div>

          {/* 3 Stages */}
          <div className="mt-5 space-y-3">
            {story?.before && (
              <div className="rounded-xl border border-deep-navy/10 bg-warm-ivory/80 p-3.5">
                <span className="block font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
                  01. {vi.sm03.stages.problem}
                </span>
                <p className="font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed">
                  {story.before}
                </p>
              </div>
            )}
            {story?.insight && (
              <div className="rounded-xl border border-deep-navy/10 bg-lavender-mist/40 p-3.5">
                <span className="block font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
                  02. {vi.sm03.stages.insight}
                </span>
                <p className="font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed">
                  {story.insight}
                </p>
              </div>
            )}
            {story?.after && (
              <div className="rounded-xl border border-deep-navy/10 bg-mint-haze/50 p-3.5">
                <span className="block font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
                  03. {vi.sm03.stages.result}
                </span>
                <p className="font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed">
                  {story.after}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <blockquote className="mt-5 pt-4 border-t border-deep-navy/10">
            <p className="font-quote italic text-sm sm:text-base text-deep-navy/90 leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>
        )}
      </Card>
    )
  }

  // Variant: Quote (Mặc định)
  return (
    <Card
      as="article"
      variant="white"
      className={`relative flex flex-col justify-between p-6 sm:p-8 ${className}`}
    >
      {/* Decorative Brand Accent */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl sm:text-4xl text-bright-magenta font-quote leading-none select-none">
          &ldquo;
        </span>
        {/* a11y-contrast-ok: SVG trang trí HeartLine trên TestimonialCard */}
        <HeartLine className="w-16 h-4 text-accent-pink/40" />
      </div>

      {/* Semantic Figure wrapping quote and attribution */}
      <figure className="flex flex-col flex-grow justify-between m-0">
        <blockquote className="mb-6 flex-grow">
          <p className="font-quote italic text-lg sm:text-xl text-deep-navy leading-relaxed">
            {quote}
          </p>
        </blockquote>

        {/* Author Info */}
        <figcaption className="flex items-center gap-3.5 pt-4 border-t border-deep-navy/10">
          {avatar}

          <div className="flex flex-col">
            <cite className="not-italic font-ui font-bold text-base text-deep-navy">
              {name}
            </cite>
            {role && (
              <span className="text-sm font-sans text-deep-navy/70 leading-tight mt-0.5">
                {role}
              </span>
            )}
          </div>
        </figcaption>
      </figure>
    </Card>
  )
}
