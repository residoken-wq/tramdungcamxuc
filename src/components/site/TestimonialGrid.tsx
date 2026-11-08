'use client'

import React from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { TestimonialCard } from './TestimonialCard'
import type { PublicTestimonial } from '@/lib/testimonials'
import { useClientTestimonials } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'

export interface TestimonialGridProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  variant?: 'quote' | 'story' | 'stages' | 'featured'
  mode?: 'manual' | 'recent'
  manualTestimonials?: Array<{ testimonialId?: string | number }>
  testimonialIds?: Array<string | number>
  limit?: 3 | 6
  columns?: 2 | 3
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    testimonials?: PublicTestimonial[]
  }
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

export function TestimonialGrid({
  id,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  variant = 'quote',
  mode = 'manual',
  manualTestimonials,
  testimonialIds,
  limit = 6,
  columns = 3,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: TestimonialGridProps & { id?: string }) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'
  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)

  const resolvedIds = (manualTestimonials?.map((m) => m?.testimonialId).filter(Boolean) ??
    testimonialIds ??
    []) as Array<string | number>

  const { testimonials, loading } = useClientTestimonials({
    testimonialIds: resolvedIds,
    mode,
    limit,
    initialTestimonials: _resolved?.testimonials,
  })

  // Filter out testimonials that lack required variant data or do not have consent
  const validTestimonials = (testimonials || []).filter((t) => {
    if ((t as { consent?: boolean })?.consent === false) return false
    if (variant === 'story') {
      return Boolean(t?.story?.before || t?.story?.after)
    }
    if (variant === 'stages') {
      return Boolean(t?.story?.before || t?.story?.insight || t?.story?.after)
    }
    return Boolean(t?.quote && t.quote.trim().length > 0)
  })

  // On public page, if no testimonials are valid, do not render empty section
  if (!isEditing && validTestimonials.length === 0) {
    return null
  }

  const colClass = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <section id={id} className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {hasHeader && (
          <div className="mb-8 sm:mb-12">
            <SectionHeader
              id={id}
              seriesLabel={seriesLabel}
              titleLine1={titleLine1 || ''}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align="center"
              line1Color={isDeepNavy ? 'white' : 'deep-navy'}
              line2Color={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
              eyebrowColor={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
              emotionColor={isDeepNavy ? 'white' : 'deep-navy'}
            />
          </div>
        )}
        {loading && validTestimonials.length === 0 ? (
          <div className="py-12 text-center text-sm font-ui text-deep-navy/60">
            Đang tải lời chia sẻ...
          </div>
        ) : validTestimonials.length === 0 ? (
          isEditing ? (
            <div className="py-12 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
              {vi.builder.noDataSelectInCms}
            </div>
          ) : null
        ) : variant === 'featured' ? (
          /* Biến thể Featured (tr. 51): 1 thẻ lớn bên trái, 2 thẻ nhỏ bên phải */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* Thẻ lớn bên trái */}
            {validTestimonials[0] && (
              <div
                data-eb-card=""
                className="md:col-span-7 rounded-2xl border border-deep-navy/10 bg-white p-6 sm:p-10 shadow-soft flex flex-col justify-between h-full transition-all duration-300 hover:shadow-card"
              >
                <div className="mb-6">
                  <blockquote className="font-quote text-xl sm:text-2xl lg:text-3xl italic leading-relaxed text-deep-navy/90">
                    &ldquo;{validTestimonials[0].quote}&rdquo;
                  </blockquote>
                </div>
                <div>
                  <p className="font-ui text-sm sm:text-base font-bold uppercase tracking-wider text-bright-magenta">
                    — {validTestimonials[0].name}
                  </p>
                  {(validTestimonials[0].role || validTestimonials[0].age) && (
                    <p className="font-ui text-xs text-deep-navy/70 mt-1">
                      {validTestimonials[0].role || ''}
                      {validTestimonials[0].role && validTestimonials[0].age ? ', ' : ''}
                      {validTestimonials[0].age
                        ? `${validTestimonials[0].age} ${vi.sm03?.ageSuffix || 'tuổi'}`
                        : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cột 2 thẻ nhỏ bên phải */}
            <div className="md:col-span-5 flex flex-col gap-6 justify-between h-full">
              {validTestimonials.slice(1, 3).map((sec, idx) => (
                <div
                  key={String(sec.id || idx)}
                  data-eb-card=""
                  className="rounded-2xl border border-deep-navy/10 bg-white p-6 sm:p-7 shadow-soft flex flex-col justify-between flex-1 transition-all duration-300 hover:shadow-card"
                >
                  <div className="mb-4">
                    <blockquote className="font-quote text-base sm:text-lg italic leading-relaxed text-deep-navy/90">
                      &ldquo;{sec.quote}&rdquo;
                    </blockquote>
                  </div>
                  <div>
                    <p className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta">
                      — {sec.name}
                    </p>
                    {(sec.role || sec.age) && (
                      <p className="font-ui text-xs text-deep-navy/70 mt-0.5">
                        {sec.role || ''}
                        {sec.role && sec.age ? ', ' : ''}
                        {sec.age ? `${sec.age} ${vi.sm03?.ageSuffix || 'tuổi'}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${colClass} gap-6 sm:gap-8 items-stretch`}>
            {validTestimonials.map((t) => (
              <TestimonialCard
                key={String(t.id)}
                name={t.name}
                quote={t.quote}
                role={t.role}
                age={t.age}
                story={t.story}
                relatedOffer={t.relatedOffer}
                photo={t.photo ? { src: t.photo.url, alt: t.photo.alt } : undefined}
                consent={true}
                variant={variant}
                className="h-full"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
