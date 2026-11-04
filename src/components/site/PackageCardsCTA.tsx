'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'
import { getBookingPath, BOOKING_PATH } from '@/lib/products'
import { textTarget } from '@/puck/style/text-target'

export interface PackageCardsCTAProps {
  id?: string
  buttonText?: string
  targetHref?: string
  bookingProductId?: number | null
  isEditing?: boolean
}

export function PackageCardsCTA({
  id,
  buttonText,
  targetHref = '',
  bookingProductId,
  isEditing = false,
}: PackageCardsCTAProps) {
  if (!buttonText) return null

  const isBookingLink =
    targetHref.trim() === BOOKING_PATH || targetHref.trim() === '/dat-phien-trai-nghiem'

  let finalButtonHref: string | null = null
  let isBookingUnavailable = false

  if (isBookingLink) {
    if (bookingProductId != null) {
      finalButtonHref = safeHref(getBookingPath(bookingProductId))
    } else {
      isBookingUnavailable = true
      finalButtonHref = null
    }
  } else {
    finalButtonHref = safeHref(targetHref)
  }

  if (finalButtonHref) {
    return (
      <div className="mt-10 sm:mt-12 w-full self-stretch text-center">
        <div className="inline-block">
          <Button href={finalButtonHref} variant="primary" size="md">
            <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
          </Button>
        </div>
      </div>
    )
  }

  if (isEditing && isBookingUnavailable) {
    return (
      <div className="mt-10 sm:mt-12 w-full self-stretch text-center">
        <div className="inline-block">
          <Button href="#" variant="primary" size="md" className="opacity-60 pointer-events-none">
            <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
          </Button>
          <p className="text-xs text-bright-magenta mt-2 font-ui">{vi.sm04.noBookingProduct}</p>
        </div>
      </div>
    )
  }

  return null
}
