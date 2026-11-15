'use client'

import React from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import {
  getEffectivePrice,
  getBookingPath,
  isBookableExperience,
  type PublicProduct,
} from '@/lib/products'
import { formatVnd } from '@/lib/format'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'

export interface ExperienceBookingButtonProps {
  product?: PublicProduct | null
  productId?: string | number | null
  productSlug?: string | null
  defaultBookingProduct?: PublicProduct | null
  defaultProduct?: PublicProduct | null
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
  isEditing?: boolean
  puck?: { isEditing?: boolean }
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
  defaultBookingProduct,
  defaultProduct,
  buttonText = vi.au04.defaultBookingButtonText,
  variant = 'primary',
  size = 'lg',
  shape = 'normal',
  showPrice = true,
  className = '',
  pageSlug,
  onClick,
  disabled = false,
  children,
  isEditing,
  puck,
}: ExperienceBookingButtonProps) {
  const isEditingEffective = Boolean(isEditing || puck?.isEditing)

  // REVIEW-REQUIRED: Xác định sản phẩm khả dụng cho phiên trải nghiệm (BX-06, mục 2)
  // Ưu tiên sản phẩm truyền vào nếu đặt được; nếu không thì dùng sản phẩm mặc định
  const fallbackProduct = defaultBookingProduct ?? defaultProduct ?? null
  const effectiveProduct: PublicProduct | null =
    product && isBookableExperience(product)
      ? product
      : fallbackProduct && isBookableExperience(fallbackProduct)
        ? fallbackProduct
        : null

  const shapeClass = shape === 'pill' ? '!rounded-full' : ''

  if (!effectiveProduct) {
    if (isEditingEffective) {
      let fallbackContent: React.ReactNode = children
      if (fallbackContent === undefined) {
        fallbackContent = formatBookingButtonLabel(buttonText, null, false)
      }
      return (
        <div className="inline-flex flex-col items-start gap-1 p-3 rounded-lg border border-bright-magenta/40 bg-soft-pink/60 text-left max-w-md">
          <Button
            href="#"
            variant={variant}
            size={size}
            disabled={true}
            className={`opacity-50 pointer-events-none ${shapeClass} ${className}`.trim()}
          >
            {fallbackContent}
          </Button>
          <p className="text-xs text-bright-magenta font-ui">
            {vi.bx06.bookingUnavailableBuilderNotice}
          </p>
        </div>
      )
    }
    // Trang công khai: không render nút khi không có sản phẩm đặt được (BX-06 mục 2)
    return null
  }

  const effectiveId = effectiveProduct.id
  const effectiveSlug = effectiveProduct.slug ?? productSlug ?? undefined
  const href = getBookingPath(effectiveId)

  const pricing = getEffectivePrice(effectiveProduct, new Date())
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
