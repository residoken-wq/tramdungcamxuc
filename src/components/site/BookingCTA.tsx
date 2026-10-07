'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatVnd } from '@/lib/format'
import { getEffectivePrice, BOOKING_PATH, type PublicProduct } from '@/lib/products'
import { track } from '@/lib/analytics/track'

export interface BookingCTAProps {
  version?: number
  title: string
  description?: string
  buttonLabel?: string
  bgColor?: string
  padding?: 'sm' | 'md' | 'lg'
  product?: PublicProduct | null
  puck?: { isEditing?: boolean }
}

export function BookingCTA({
  title,
  description,
  buttonLabel = 'Đặt phiên trải nghiệm',
  bgColor = 'warm-ivory',
  padding = 'md',
  product,
}: BookingCTAProps) {
  const paddingClasses = {
    sm: 'py-6 px-4',
    md: 'py-12 px-4 sm:px-6',
    lg: 'py-16 px-4 sm:px-8',
  }[padding]

  const pricing = getEffectivePrice(product || {}, new Date())
  const hasSale = pricing.salePrice != null
  const currentPrice = hasSale ? pricing.salePrice : pricing.price
  const originalPrice = hasSale && pricing.price != null ? pricing.price : null

  const handleBookingClick = () => {
    track('booking_clicked', {
      productId: product?.id,
      slug: product?.slug,
    })
  }

  return (
    <section className={`w-full bg-${bgColor} ${paddingClasses}`}>
      <div className="max-w-4xl mx-auto">
        <Card
          variant="soft-pink"
          className="p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-6 shadow-sm"
        >
          <div className="max-w-2xl space-y-3">
            <h3 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="font-sans text-base text-deep-navy/80 leading-relaxed">{description}</p>
            )}
          </div>

          {currentPrice != null && (
            <div className="flex items-baseline justify-center gap-3">
              <span className="font-ui font-bold text-3xl sm:text-4xl text-bright-magenta">
                {formatVnd(currentPrice)}
              </span>
              {originalPrice != null && (
                <span className="font-sans text-lg text-deep-navy/50 line-through">
                  {formatVnd(originalPrice)}
                </span>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button
              href={BOOKING_PATH}
              variant="primary"
              size="lg"
              onClick={handleBookingClick}
              className="px-8 py-3.5 text-base shadow-md hover:shadow-lg transition-all"
            >
              {buttonLabel}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
