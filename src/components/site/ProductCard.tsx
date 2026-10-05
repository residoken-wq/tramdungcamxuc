import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { PriceTag } from '@/components/ui/PriceTag'
import { StatusBadge, type SaleStatus } from '@/components/ui/StatusBadge'
import { vi } from '@/lib/i18n/vi'

export interface ProductCoverImage {
  src: string
  alt: string
}

export interface ProductCardProps {
  name: string
  shortDescription?: string
  coverImage: ProductCoverImage
  price?: number | null
  salePrice?: number | null
  saleStatus: SaleStatus
  trialDays?: number
  journeyStep?: 'pause' | 'feel' | 'name' | 'choose' | 'practice' | string
  cta?: React.ReactNode
  className?: string
}

export function ProductCard({
  name,
  shortDescription,
  coverImage,
  price,
  salePrice,
  saleStatus,
  trialDays,
  journeyStep,
  cta,
  className = '',
}: ProductCardProps) {
  // If saleStatus is hidden, do not render anything
  if (saleStatus === 'hidden') {
    return null
  }

  const journeyLabel =
    journeyStep && vi.product.journeySteps[journeyStep]
      ? vi.product.journeySteps[journeyStep]
      : journeyStep

  return (
    <Card
      as="article"
      variant="white"
      className={`flex flex-col h-full overflow-hidden p-0 transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Cover Image Container */}
      <div className="relative w-full aspect-[16/10] bg-lavender-mist/30 overflow-hidden border-b border-deep-navy/10">
        <Image
          src={coverImage.src}
          alt={coverImage.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />

        {/* Status Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <StatusBadge status={saleStatus} />
          {trialDays && trialDays > 0 ? (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-semibold bg-white/95 text-deep-navy border border-deep-navy/15 shadow-xs backdrop-blur-xs">
              {trialDays} {vi.product.trialBadge}
            </span>
          ) : null}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-grow p-5 sm:p-6">
        {/* Journey Step indicator */}
        {journeyLabel && (
          <span className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-2 font-ui">
            {journeyLabel}
          </span>
        )}

        {/* Product Title */}
        <h3 className="font-ui font-bold text-xl text-deep-navy mb-2.5 leading-snug line-clamp-2">
          {name}
        </h3>

        {/* Short Description */}
        {shortDescription && (
          <p className="font-sans text-sm text-deep-navy/80 leading-relaxed mb-4 line-clamp-3 flex-grow">
            {shortDescription}
          </p>
        )}

        {/* Pricing */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-deep-navy/10">
          <PriceTag originalPrice={price} salePrice={salePrice} size="md" />
        </div>

        {/* CTA Slot */}
        {cta && <div className="mt-4 pt-1">{cta}</div>}
      </div>
    </Card>
  )
}
