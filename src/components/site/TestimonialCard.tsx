import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { HeartLine } from '@/components/brand/HeartLine'

export interface TestimonialPhoto {
  src: string
  alt: string
}

export interface TestimonialCardProps {
  quote: string
  name: string
  role?: string
  photo?: TestimonialPhoto
  consent: boolean
  className?: string
}

export function TestimonialCard({
  quote,
  name,
  role,
  photo,
  consent,
  className = '',
}: TestimonialCardProps) {
  // AGENTS.md §7: Testimonial must only be displayed when consent === true
  if (!consent) {
    return null
  }

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
          {photo ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-deep-navy/15 flex-shrink-0 bg-soft-pink">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-full bg-soft-pink text-deep-navy font-ui font-bold text-base flex items-center justify-center border border-deep-navy/15 flex-shrink-0"
              aria-hidden="true"
            >
              {name.charAt(0)}
            </div>
          )}

          <div className="flex flex-col">
            <cite className="not-italic font-ui font-bold text-base text-deep-navy">{name}</cite>
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
