'use client'

import React from 'react'
import { TestimonialCard } from './TestimonialCard'
import type { PublicTestimonial } from '@/lib/testimonials'
import { useClientTestimonials } from '@/puck/client-preview'

export interface TestimonialGridProps {
  version?: number
  mode?: 'manual' | 'recent'
  manualTestimonials?: Array<{ testimonialId?: string | number }>
  testimonialIds?: Array<string | number>
  limit?: 3 | 6
  columns?: 2 | 3
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
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
  mode = 'manual',
  manualTestimonials,
  testimonialIds,
  limit = 6,
  columns = 3,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: TestimonialGridProps) {
  const isEditing = puck?.isEditing ?? false

  const resolvedIds = (manualTestimonials?.map((m) => m?.testimonialId).filter(Boolean) ??
    testimonialIds ??
    []) as Array<string | number>

  const { testimonials, loading } = useClientTestimonials({
    testimonialIds: resolvedIds,
    mode,
    limit,
    initialTestimonials: _resolved?.testimonials,
  })

  // On public page, if no testimonials are resolved, do not render empty section
  if (!isEditing && (!testimonials || testimonials.length === 0)) {
    return null
  }

  const colClass = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {loading && testimonials.length === 0 ? (
          <div className="py-12 text-center text-sm font-ui text-deep-navy/60">
            Đang tải lời chia sẻ...
          </div>
        ) : testimonials.length === 0 ? (
          isEditing ? (
            <div className="py-12 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
              Chưa có lời chia sẻ nào được chọn hoặc hiển thị. Vui lòng chọn lời chia sẻ trong thanh
              cấu hình bên phải.
            </div>
          ) : null
        ) : (
          <div className={`grid grid-cols-1 ${colClass} gap-6 sm:gap-8 items-stretch`}>
            {testimonials.map((t) => (
              <TestimonialCard
                key={String(t.id)}
                name={t.name}
                quote={t.quote}
                role={t.role}
                photo={t.photo ? { src: t.photo.url, alt: t.photo.alt } : undefined}
                consent={true}
                className="h-full"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
