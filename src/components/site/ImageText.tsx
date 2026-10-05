import React from 'react'
import { Button } from '@/components/ui/Button'

export interface ImageTextProps {
  layout?: 'image-left' | 'image-right'
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  content: string
  mediaId?: string
  imageUrl?: string
  imageAlt?: string
  buttonText?: string
  buttonLink?: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
    | 'bright-magenta'
    | 'accent-pink'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
  'bright-magenta': 'bg-bright-magenta text-white',
  'accent-pink': 'bg-accent-pink text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function ImageText({
  layout = 'image-left',
  seriesLabel,
  titleLine1,
  titleLine2,
  content,
  imageUrl,
  imageAlt,
  buttonText,
  buttonLink,
  bgColor = 'warm-ivory',
  padding = 'md',
}: ImageTextProps) {
  const isDarkBg = bgColor === 'deep-navy' || bgColor === 'bright-magenta' || bgColor === 'accent-pink'
  const textColorClass = isDarkBg ? 'text-white' : 'text-deep-navy'
  const descColorClass = isDarkBg ? 'text-white/85' : 'text-deep-navy/80'

  const paragraphs = (content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const isImageLeft = layout === 'image-left'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image Column */}
          <div className={`${isImageLeft ? 'md:order-1' : 'md:order-2'} w-full`}>
            {imageUrl ? (
              <div className="overflow-hidden rounded-card border border-deep-navy/10 shadow-soft bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={imageAlt || 'Hình ảnh minh họa'}
                  className="w-full h-auto object-cover max-h-[460px]"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[280px] p-8 rounded-card border-2 border-dashed border-deep-navy/20 bg-soft-pink/40 text-center">
                <svg
                  className="w-12 h-12 text-bright-magenta/60 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="font-ui text-sm font-semibold text-deep-navy">
                  [MẪU] Chưa chọn ảnh minh họa
                </p>
                <p className="font-ui text-xs text-deep-navy/60 mt-1 max-w-xs">
                  Nhập mã Media ID trong bảng cài đặt bên phải (ảnh cần có mô tả alt).
                </p>
              </div>
            )}
          </div>

          {/* Text Column */}
          <div className={`${isImageLeft ? 'md:order-2' : 'md:order-1'} flex flex-col justify-center`}>
            {seriesLabel && (
              <span className="mb-3 font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta">
                {seriesLabel}
              </span>
            )}

            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight leading-tight mb-4">
              <span className={textColorClass}>{titleLine1}</span>{' '}
              {titleLine2 && <span className="text-bright-magenta">{titleLine2}</span>}
            </h2>

            <div className="space-y-3 mb-6">
              {paragraphs.map((p, idx) => (
                <p key={idx} className={`font-ui text-base leading-relaxed ${descColorClass}`}>
                  {p}
                </p>
              ))}
            </div>

            {buttonText && buttonLink && (
              <div className="pt-2">
                <Button href={buttonLink} variant={isDarkBg ? 'secondary' : 'primary'} size="md">
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
