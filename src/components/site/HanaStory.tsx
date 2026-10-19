import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { HeartLine } from '@/components/brand/HeartLine'
import { safeHref } from '@/lib/safe-href'

export interface HanaStoryChipItem {
  text?: string
}

export interface HanaStoryProps {
  version?: number
  tone?: 'light' | 'dark'
  jobTitle?: string
  chips?: HanaStoryChipItem[]
  layout?: 'story' | 'letter'
  imagePosition?: 'left' | 'right'
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  storyContent?: string
  quoteLine?: string
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  founderSignatureUrl?: string | null
  founderSignatureAlt?: string | null
  buttonText?: string
  buttonLink?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    founderSignatureUrl?: string | null
    founderSignatureAlt?: string | null
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

export function HanaStory({
  tone = 'light',
  jobTitle,
  chips = [],
  layout = 'story',
  imagePosition = 'left',
  seriesLabel,
  titleLine1,
  titleLine2,
  storyContent,
  quoteLine,
  imageUrl,
  imageAlt,
  founderSignatureUrl: directSigUrl,
  founderSignatureAlt: directSigAlt,
  buttonText,
  buttonLink,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
}: HanaStoryProps) {
  const isDarkTone = tone === 'dark'
  const isDarkOrNavy = isDarkTone || bgColor === 'deep-navy'
  const safeButtonHref = buttonLink ? safeHref(buttonLink) : null

  const resolvedSignatureUrl = _resolved?.founderSignatureUrl ?? directSigUrl
  const resolvedSignatureAlt = _resolved?.founderSignatureAlt ?? directSigAlt

  // Split multi-paragraph text
  const paragraphs = storyContent ? storyContent.split('\n\n').filter(Boolean) : []

  const chipList = Array.isArray(chips)
    ? chips
        .map((c) => (typeof c === 'string' ? c : c?.text || ''))
        .filter((t) => t.trim().length > 0)
        .slice(0, 6)
    : []

  const isImageRight = imagePosition === 'right'

  const sectionBgClass = isDarkTone ? 'bg-deep-navy text-white' : BG_COLORS[bgColor]
  const quoteBgClass = isDarkOrNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white/70 border-deep-navy/10 text-deep-navy'
  const quoteTextClass = isDarkOrNavy ? 'text-white' : 'text-deep-navy'
  const descColorClass = isDarkOrNavy ? 'text-white/85' : 'text-deep-navy/85'
  const chipBgClass = isDarkOrNavy
    ? 'bg-white/10 text-soft-pink border-soft-pink/30'
    : 'bg-soft-pink text-deep-navy border-bright-magenta/20'

  return (
    <section className={`w-full ${sectionBgClass} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Portrait Photo Column (5 cols) */}
          <div
            className={`lg:col-span-5 flex flex-col items-center ${
              isImageRight ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            {imageUrl ? (
              <div
                className={`relative w-full max-w-sm aspect-[4/5] rounded-card overflow-hidden shadow-sm border ${
                  isDarkOrNavy ? 'border-white/20 bg-white/10' : 'border-deep-navy/10 bg-soft-pink'
                }`}
              >
                <Image
                  src={imageUrl}
                  alt={imageAlt || 'Chân dung Hana Lương'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`w-full max-w-sm aspect-[4/5] rounded-card border-2 border-dashed flex flex-col items-center justify-center p-6 text-center ${
                  isDarkOrNavy
                    ? 'border-white/30 bg-white/5 text-white/70'
                    : 'border-deep-navy/20 bg-white/40 text-deep-navy/60'
                }`}
              >
                <span className="font-ui text-sm">{imageAlt || 'Chưa chọn ảnh chân dung'}</span>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              {/* a11y-contrast-ok: SVG trang trí HeartLine trong HanaStory */}
              <HeartLine
                className={`w-20 h-4 ${isDarkOrNavy ? 'text-soft-pink/60' : 'text-accent-pink/50'}`}
              />
            </div>
          </div>

          {/* Story Narrative & Quotes Column (7 cols) */}
          <div
            className={`lg:col-span-7 flex flex-col ${isImageRight ? 'lg:order-1' : 'lg:order-2'}`}
          >
            {(seriesLabel || titleLine1 || titleLine2) && (
              <header className="mb-6 flex flex-col text-left items-start">
                {seriesLabel && (
                  <span
                    className={`mb-4 font-ui text-xs font-bold uppercase tracking-widest ${
                      isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {seriesLabel}
                  </span>
                )}
                <h2 className="font-display uppercase tracking-tight leading-[1.15] text-3xl sm:text-4xl lg:text-5xl">
                  {titleLine1 && (
                    <span
                      className={`block ${isDarkOrNavy ? 'text-white' : 'text-deep-navy'}`}
                    >
                      {titleLine1}
                    </span>
                  )}
                  {titleLine2 && (
                    <span
                      className={`block ${isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'}`}
                    >
                      {titleLine2}
                    </span>
                  )}
                </h2>
              </header>
            )}

            {/* Job Title under heading in standard story layout */}
            {layout === 'story' && jobTitle && (
              <p
                className={`font-ui text-xs sm:text-sm font-semibold uppercase tracking-wider -mt-3 mb-5 ${
                  isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                }`}
              >
                {jobTitle}
              </p>
            )}

            {/* Story Paragraphs */}
            {paragraphs.length > 0 && (
              <div
                className={`space-y-4 font-sans text-base sm:text-lg leading-relaxed ${descColorClass}`}
              >
                {paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}

            {/* Emotional Quote Block */}
            {quoteLine && (
              <div className={`mt-6 p-5 sm:p-6 rounded-card border shadow-sm ${quoteBgClass}`}>
                <p
                  className={`font-quote italic text-lg sm:text-xl leading-relaxed ${quoteTextClass}`}
                >
                  &ldquo;{quoteLine}&rdquo;
                </p>
              </div>
            )}

            {/* Value Chips (0-6 pills) */}
            {chipList.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {chipList.map((chip, idx) => (
                  <span
                    key={idx}
                    className={`font-ui text-xs font-semibold px-3 py-1 rounded-full border ${chipBgClass}`}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {/* Letter Layout Signature Block */}
            {layout === 'letter' && (
              <div
                className={`mt-8 pt-6 border-t flex flex-col items-start ${
                  isDarkOrNavy ? 'border-white/15' : 'border-deep-navy/10'
                }`}
              >
                {resolvedSignatureUrl ? (
                  <div className="relative h-14 sm:h-16 w-48 mb-2">
                    <Image
                      src={resolvedSignatureUrl}
                      alt={resolvedSignatureAlt || 'Chữ ký nhà sáng lập Hana Lương'}
                      fill
                      sizes="200px"
                      className="object-contain object-left"
                    />
                  </div>
                ) : (
                  <p
                    className={`font-quote italic text-2xl sm:text-3xl mb-1 ${
                      isDarkOrNavy ? 'text-white' : 'text-deep-navy'
                    }`}
                  >
                    Hana Lương
                  </p>
                )}

                {jobTitle && (
                  <p
                    className={`font-ui text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                      isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {jobTitle}
                  </p>
                )}
              </div>
            )}

            {/* Optional CTA Button */}
            {buttonText && safeButtonHref && (
              <div className="mt-8">
                <Button
                  href={safeButtonHref}
                  variant={isDarkOrNavy ? 'secondary' : 'primary'}
                  size="lg"
                >
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
