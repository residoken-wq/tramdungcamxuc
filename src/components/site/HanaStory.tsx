import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { buttonColorStyle } from '@/lib/brand/button-colors'
import { HeartLine } from '@/components/brand/HeartLine'
import { safeHref } from '@/lib/safe-href'
import { textTarget } from '@/puck/style/text-target'
import { stripWrappingQuotes } from '@/lib/text/quotes'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'

export interface HanaStoryChipItem {
  text?: string
}

export interface HanaStoryHighlightItem {
  title: string
  text?: string
}

export interface HanaStoryProps {
  version?: number
  tone?: 'light' | 'dark'
  jobTitle?: string
  greeting?: string
  signatureName?: string
  chips?: HanaStoryChipItem[]
  highlights?: HanaStoryHighlightItem[]
  quoteStyle?: 'line' | 'box'
  layout?: 'story' | 'letter' | 'spotlight'
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
  /** PK-15: brand colour of the CTA fill / label ('' = automatic). */
  buttonBgColor?: string
  buttonTextColor?: string
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
  id,
  tone = 'light',
  jobTitle,
  greeting,
  signatureName,
  chips = [],
  highlights = [],
  quoteStyle = 'line',
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
  buttonBgColor,
  buttonTextColor,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
}: HanaStoryProps & { id?: string }) {
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
  const isSpotlight = layout === 'spotlight'
  const cleanQuoteLine = stripWrappingQuotes(quoteLine)

  const sectionBgClass = isDarkTone ? 'bg-deep-navy text-white' : BG_COLORS[bgColor]
  const quoteBgClass = isDarkOrNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white/70 border-deep-navy/10 text-deep-navy'
  const quoteTextClass = isDarkOrNavy ? 'text-white' : 'text-deep-navy'
  const descColorClass = isDarkOrNavy ? 'text-white/85' : 'text-deep-navy/85'
  const chipBgClass = isDarkOrNavy
    ? 'bg-white/10 text-soft-pink border-soft-pink/30'
    : 'bg-soft-pink text-deep-navy border-bright-magenta/20'

  if (isSpotlight) {
    const jobTitleColor = isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
    return (
      <section className={`w-full overflow-hidden ${sectionBgClass} transition-colors`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px]">
          {/* Text Column (lg: ~55% -> 7 cols) */}
          <div
            className={`lg:col-span-7 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-16 ${
              isImageRight ? 'order-2 lg:order-1' : 'order-2 lg:order-2'
            }`}
          >
            {(seriesLabel || titleLine1 || titleLine2) && (
              <header className="mb-4 flex flex-col text-left items-start">
                {seriesLabel && (
                  <span
                    {...textTarget(id, 'seriesLabel')}
                    className={`mb-[var(--tdcx-eyebrow-gap,1rem)] font-ui text-xs font-bold uppercase tracking-widest ${
                      isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {seriesLabel}
                  </span>
                )}
                <h2 className="font-display uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)] text-3xl sm:text-4xl lg:text-5xl">
                  {/* QA PK-17c: shared TwoToneTitle (PK-16) keeps the space between the lines. */}
                  <TwoToneTitle
                    id={id}
                    line1={titleLine1}
                    line2={titleLine2}
                    line1ClassName={isDarkOrNavy ? 'text-white' : 'text-deep-navy'}
                    line2ClassName={isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'}
                  />
                </h2>
              </header>
            )}

            {jobTitle && (
              <p
                {...textTarget(id, 'jobTitle')}
                className={`font-ui text-xs sm:text-sm font-bold uppercase tracking-wider mb-5 ${jobTitleColor}`}
              >
                {jobTitle}
              </p>
            )}

            {cleanQuoteLine &&
              (quoteStyle === 'box' ? (
                <div
                  className={`mb-6 p-5 sm:p-6 rounded-card border shadow-sm ${
                    isDarkOrNavy
                      ? 'bg-white/10 border-white/20 text-soft-pink'
                      : 'bg-soft-pink border-accent-pink/20 text-bright-magenta'
                  }`}
                >
                  <p
                    {...textTarget(id, 'quoteLine')}
                    className="font-quote italic text-lg sm:text-xl leading-relaxed whitespace-pre-line"
                  >
                    &ldquo;{cleanQuoteLine}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="mb-6 pl-4 border-l-[3px] border-accent-pink">
                  <p
                    {...textTarget(id, 'quoteLine')}
                    className={`font-quote italic text-lg sm:text-xl leading-relaxed whitespace-pre-line ${quoteTextClass}`}
                  >
                    &ldquo;{cleanQuoteLine}&rdquo;
                  </p>
                </div>
              ))}

            {paragraphs.length > 0 && (
              <div
                {...textTarget(id, 'storyContent')}
                className={`space-y-4 font-sans text-base sm:text-lg leading-relaxed ${descColorClass}`}
              >
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            )}

            {highlights && highlights.length > 0 && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {highlights.slice(0, 4).map((hl, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-card border ${
                      isDarkOrNavy
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
                    }`}
                  >
                    <span
                      className={`block font-display text-2xl sm:text-3xl ${
                        isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h4 className="mt-1 font-ui font-bold text-sm sm:text-base leading-snug">
                      {hl.title}
                    </h4>
                    {hl.text && (
                      <p
                        className={`mt-1 font-ui text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                          isDarkOrNavy ? 'text-white/80' : 'text-deep-navy/75'
                        }`}
                      >
                        {hl.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

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

            {buttonText && safeButtonHref && (
              <div className="mt-8">
                <Button
                  href={safeButtonHref}
                  variant="primary"
                  size="lg"
                  style={buttonColorStyle(
                    buttonBgColor,
                    buttonTextColor,
                    isDarkTone ? 'deep-navy' : bgColor,
                  )}
                >
                  {buttonText}
                </Button>
              </div>
            )}
          </div>

          {/* Spotlight Image Column (lg: ~45% -> 5 cols) */}
          <div
            className={`lg:col-span-5 flex items-center justify-center bg-lavender-mist p-8 sm:p-12 lg:p-16 ${
              isImageRight
                ? 'order-1 lg:order-2 rounded-b-[64px] lg:rounded-b-none lg:rounded-l-[120px]'
                : 'order-1 lg:order-1 rounded-b-[64px] lg:rounded-b-none lg:rounded-r-[120px]'
            }`}
          >
            {imageUrl ? (
              <div className="relative w-full max-w-md aspect-square rounded-card overflow-hidden shadow-soft">
                <Image
                  src={imageUrl}
                  alt={imageAlt || ''}
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full max-w-md aspect-square rounded-card border-2 border-dashed border-deep-navy/20 bg-white/40 flex flex-col items-center justify-center p-6 text-center text-deep-navy/60">
                <span className="font-ui text-sm">{imageAlt || 'Chưa chọn ảnh chân dung'}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

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
                  alt={imageAlt || ''}
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
                    {...textTarget(id, 'seriesLabel')}
                    className={`mb-[var(--tdcx-eyebrow-gap,1rem)] font-ui text-xs font-bold uppercase tracking-widest ${
                      isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {seriesLabel}
                  </span>
                )}
                <h2 className="font-display uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)] text-3xl sm:text-4xl lg:text-5xl">
                  {titleLine1 && (
                    <span
                      {...textTarget(id, 'titleLine1')}
                      className={`block ${isDarkOrNavy ? 'text-white' : 'text-deep-navy'}`}
                    >
                      {titleLine1}
                    </span>
                  )}
                  {titleLine2 && (
                    <span
                      {...textTarget(id, 'titleLine2')}
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
                {...textTarget(id, 'jobTitle')}
                className={`font-ui text-xs sm:text-sm font-semibold uppercase tracking-wider -mt-3 mb-5 ${
                  isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                }`}
              >
                {jobTitle}
              </p>
            )}

            {/* Greeting in letter layout (Playfair Italic) */}
            {layout === 'letter' && greeting && (
              <p
                {...textTarget(id, 'greeting')}
                className={`font-quote italic text-xl sm:text-2xl mb-5 ${
                  isDarkOrNavy ? 'text-white' : 'text-deep-navy'
                }`}
              >
                {greeting}
              </p>
            )}

            {/* Box Quote (when quoteStyle === 'box', placed above paragraphs) */}
            {quoteStyle === 'box' && cleanQuoteLine && (
              <div
                className={`mb-6 p-5 sm:p-6 rounded-card border shadow-sm ${
                  isDarkOrNavy
                    ? 'bg-white/10 border-white/20 text-soft-pink'
                    : 'bg-soft-pink border-accent-pink/20 text-bright-magenta'
                }`}
              >
                <p
                  {...textTarget(id, 'quoteLine')}
                  className="font-quote italic text-lg sm:text-xl leading-relaxed whitespace-pre-line"
                >
                  &ldquo;{cleanQuoteLine}&rdquo;
                </p>
              </div>
            )}

            {/* Story Paragraphs */}
            {paragraphs.length > 0 && (
              <div
                {...textTarget(id, 'storyContent')}
                className={`space-y-4 font-sans text-base sm:text-lg leading-relaxed ${descColorClass}`}
              >
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            )}

            {/* Emotional Quote Block */}
            {quoteStyle !== 'box' && cleanQuoteLine && (
              <div className={`mt-6 p-5 sm:p-6 rounded-card border shadow-sm ${quoteBgClass}`}>
                <p
                  {...textTarget(id, 'quoteLine')}
                  className={`font-quote italic text-lg sm:text-xl leading-relaxed whitespace-pre-line ${quoteTextClass}`}
                >
                  &ldquo;{cleanQuoteLine}&rdquo;
                </p>
              </div>
            )}

            {/* Highlights (3 numbered small cards) */}
            {highlights && highlights.length > 0 && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {highlights.slice(0, 4).map((hl, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-card border ${
                      isDarkOrNavy
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
                    }`}
                  >
                    <span
                      className={`block font-display text-2xl sm:text-3xl ${
                        isDarkOrNavy ? 'text-soft-pink' : 'text-bright-magenta'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h4 className="mt-1 font-ui font-bold text-sm sm:text-base leading-snug">
                      {hl.title}
                    </h4>
                    {hl.text && (
                      <p
                        className={`mt-1 font-ui text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                          isDarkOrNavy ? 'text-white/80' : 'text-deep-navy/75'
                        }`}
                      >
                        {hl.text}
                      </p>
                    )}
                  </div>
                ))}
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
                      alt={resolvedSignatureAlt || signatureName || ''}
                      fill
                      sizes="200px"
                      className="object-contain object-left"
                    />
                  </div>
                ) : signatureName ? (
                  <p
                    {...textTarget(id, 'signatureName')}
                    className={`font-quote italic text-2xl sm:text-3xl mb-1 ${
                      isDarkOrNavy ? 'text-white' : 'text-deep-navy'
                    }`}
                  >
                    {signatureName}
                  </p>
                ) : null}

                {jobTitle && (
                  <p
                    {...textTarget(id, 'jobTitle')}
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
                {/* PK-15: the old dark-tone default was a navy button on a navy section (invisible). */}
                <Button
                  href={safeButtonHref}
                  variant="primary"
                  size="lg"
                  style={buttonColorStyle(
                    buttonBgColor,
                    buttonTextColor,
                    isDarkTone ? 'deep-navy' : bgColor,
                  )}
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
