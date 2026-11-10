'use client'

import React from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { getEffectivePrice, getBookingPath, type PublicProduct } from '@/lib/products'
import { formatVnd } from '@/lib/format'
import { track } from '@/lib/analytics/track'

export interface ExperienceBookingButtonProps {
  product?: PublicProduct | null
  productId?: string | number | null
  productSlug?: string | null
  buttonText?: string
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: 'normal' | 'pill'
  showPrice?: boolean
  className?: string
  pageSlug?: string
  onClick?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function formatBookingButtonLabel(
  label: string,
  price: number | null | undefined,
  showPrice: boolean = true,
): string {
  if (!showPrice || price == null) return label
  const formatted = formatVnd(price)
  if (label.includes('{price}')) {
    return label.replace('{price}', formatted)
  }
  if (!label.includes(formatted)) {
    return `${label} (${formatted})`
  }
  return label
}

export function ExperienceBookingButton({
  product,
  productId,
  productSlug,
  buttonText = 'Đặt phiên trải nghiệm',
  variant = 'primary',
  size = 'lg',
  shape = 'normal',
  showPrice = true,
  className = '',
  pageSlug,
  onClick,
  disabled = false,
  children,
}: ExperienceBookingButtonProps) {
  const effectiveId = product?.id ?? productId ?? null
  const effectiveSlug = product?.slug ?? productSlug ?? undefined
  const href = getBookingPath(effectiveId)

  const pricing = getEffectivePrice(product || {}, new Date())
  const hasSale = pricing.salePrice != null
  const currentPrice = hasSale ? pricing.salePrice : pricing.price

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    track('booking_clicked', {
      productId: effectiveId ? Number(effectiveId) : undefined,
      slug: effectiveSlug,
      pageSlug,
    })
    if (onClick) onClick()
  }

  const shapeClass = shape === 'pill' ? '!rounded-full' : ''

  let content: React.ReactNode = children
  if (content === undefined) {
    content = formatBookingButtonLabel(buttonText, currentPrice, showPrice)
  }

  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      className={`${shapeClass} ${className}`.trim()}
    >
      {content}
    </Button>
  )
}
