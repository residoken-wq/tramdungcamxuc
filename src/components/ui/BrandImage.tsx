import React from 'react'
import Image from 'next/image'
import { WaveClipPath } from '@/components/brand/WaveClipPath'

export type BrandImageShape = 'rounded' | 'arch-left' | 'arch-right' | 'wave'
export type CaptionPosition = 'bottom-left' | 'bottom-right'

export interface BrandImageAvatarItem {
  mediaId?: string | number
  url?: string
}

export interface BrandImageCaption {
  title: string
  subtitle?: string
  avatars?: Array<string | BrandImageAvatarItem>
}

export interface BrandImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
  imageClassName?: string
  loading?: 'lazy' | 'eager'
  unoptimized?: boolean
  shape?: BrandImageShape
  badge?: string
  caption?: BrandImageCaption
  captionPosition?: CaptionPosition
  style?: React.CSSProperties
  children?: React.ReactNode
}

function getShapeClasses(shape?: BrandImageShape, hasCustomRounded?: boolean): string {
  switch (shape) {
    case 'arch-left':
      return 'rounded-l-[64px] sm:rounded-l-[120px] rounded-r-card'
    case 'arch-right':
      return 'rounded-r-[64px] sm:rounded-r-[120px] rounded-l-card'
    case 'wave':
      return ''
    case 'rounded':
    default:
      return hasCustomRounded ? '' : 'rounded-card'
  }
}

export function BrandImage({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  sizes,
  className = '',
  imageClassName = '',
  loading,
  unoptimized,
  shape = 'rounded',
  badge,
  caption,
  captionPosition = 'bottom-left',
  style,
  children,
}: BrandImageProps) {
  const hasCustomRounded = className.includes('rounded-')
  const shapeClass = getShapeClasses(shape, hasCustomRounded)
  const isWave = shape === 'wave'
  // PK-20c: `fill` stretches to the parent only when the caller gives no size of its own
  // (IconCard passes h-12 w-12; h-full would win in the generated CSS and blow the icon up).
  const fillSize = fill && !/(^|\s)[hw]-/.test(className) ? 'w-full h-full' : ''

  const containerStyle = isWave ? { ...style, clipPath: 'url(#tdcx-brand-image-wave)' } : style

  const validAvatars = Array.isArray(caption?.avatars)
    ? caption.avatars
        .map((av) => (typeof av === 'string' ? av : av?.url))
        .filter((url): url is string => Boolean(url && url.trim().length > 0))
        .slice(0, 4)
    : []

  const hasCaption = Boolean(caption && caption.title && caption.title.trim().length > 0)
  const isCaptionRight = captionPosition === 'bottom-right'
  // PK-20c: keep the badge / caption clear of the large curved side (64px phone, 120px desktop),
  // otherwise the arch clips them.
  const archOnLeft = shape === 'arch-left'
  const archOnRight = shape === 'arch-right'
  const leftInset = archOnLeft ? 'left-8 sm:left-16' : 'left-3 sm:left-4'
  const rightInset = archOnRight ? 'right-8 sm:right-16' : 'right-3 sm:right-4'

  return (
    <div
      className={`relative overflow-hidden ${shapeClass} ${fillSize} ${className}`.trim()}
      style={containerStyle}
    >
      {isWave && <WaveClipPath />}

      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={imageClassName || 'object-cover'}
          loading={loading}
          unoptimized={unoptimized}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className={imageClassName}
          loading={loading}
          unoptimized={unoptimized}
        />
      )}

      {badge && badge.trim().length > 0 && (
        <div
          data-brand-image-badge=""
          className={`absolute top-3 sm:top-4 ${leftInset} z-10 inline-flex items-center rounded-full bg-deep-navy px-3.5 py-1.5 font-ui text-xs font-bold uppercase tracking-wider text-white shadow-soft`}
        >
          {badge.trim()}
        </div>
      )}

      {hasCaption && (
        <div
          data-brand-image-caption=""
          className={`absolute ${
            isCaptionRight
              ? `bottom-3 sm:bottom-4 ${rightInset}`
              : `bottom-3 sm:bottom-4 ${leftInset}`
          } z-10 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-soft border border-deep-navy/5 backdrop-blur-sm ${archOnLeft || archOnRight ? 'max-w-[calc(100%-3rem)]' : 'max-w-[calc(100%-1.5rem)]'} sm:max-w-xs`}
        >
          {validAvatars.length > 0 && (
            <div className="flex -space-x-2 shrink-0">
              {validAvatars.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-7 w-7 rounded-full overflow-hidden border-2 border-white bg-soft-pink shrink-0"
                >
                  <Image src={url} alt="" fill sizes="28px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-ui text-xs sm:text-sm font-bold text-deep-navy leading-tight line-clamp-2">
              {caption!.title.trim()}
            </span>
            {caption!.subtitle && caption!.subtitle.trim().length > 0 && (
              <span className="font-ui text-[11px] sm:text-xs font-semibold text-bright-magenta mt-0.5 leading-tight line-clamp-1">
                {caption!.subtitle.trim()}
              </span>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
