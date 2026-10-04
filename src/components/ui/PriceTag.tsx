import React from 'react'
import { formatVnd } from '@/lib/format'
import { vi } from '@/lib/i18n/vi'

export interface PriceTagProps {
  originalPrice?: number | null
  salePrice?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriceTag({
  originalPrice,
  salePrice,
  size = 'md',
  className = '',
}: PriceTagProps) {
  const formattedOriginal = formatVnd(originalPrice)
  const formattedSale = formatVnd(salePrice)

  // Nếu cả hai giá trị đều rỗng/không hợp lệ -> không hiển thị gì (theo spec)
  if (!formattedOriginal && !formattedSale) {
    return null
  }

  const sizeClasses = {
    sm: {
      original: 'text-xs',
      sale: 'text-base font-bold',
      gap: 'gap-2',
    },
    md: {
      original: 'text-sm',
      sale: 'text-xl font-bold',
      gap: 'gap-2.5',
    },
    lg: {
      original: 'text-base',
      sale: 'text-2xl font-bold',
      gap: 'gap-3',
    },
  }[size]

  // Trường hợp 1: Có cả giá gốc và giá ưu đãi
  if (formattedOriginal && formattedSale) {
    return (
      <div className={`inline-flex items-baseline font-ui ${sizeClasses.gap} ${className}`}>
        {/* Văn bản hỗ trợ trình đọc màn hình */}
        <span className="sr-only">
          {vi.price.originalLabel}: {formattedOriginal}, {vi.price.saleLabel}: {formattedSale}
        </span>

        {/* Hiển thị trực quan */}
        <span
          aria-hidden="true"
          className={`line-through text-deep-navy/70 ${sizeClasses.original}`}
        >
          {formattedOriginal}
        </span>
        <span
          aria-hidden="true"
          className={`text-deep-navy tracking-tight ${sizeClasses.sale}`}
        >
          {formattedSale}
        </span>
      </div>
    )
  }

  // Trường hợp 2: Chỉ có giá ưu đãi
  if (formattedSale) {
    return (
      <div className={`inline-flex items-baseline font-ui ${className}`}>
        <span className="sr-only">
          {vi.price.saleLabel}: {formattedSale}
        </span>
        <span
          aria-hidden="true"
          className={`text-deep-navy tracking-tight ${sizeClasses.sale}`}
        >
          {formattedSale}
        </span>
      </div>
    )
  }

  // Trường hợp 3: Chỉ có giá gốc
  return (
    <div className={`inline-flex items-baseline font-ui ${className}`}>
      <span className="sr-only">
        {vi.price.originalLabel}: {formattedOriginal}
      </span>
      <span
        aria-hidden="true"
        className={`text-deep-navy tracking-tight ${sizeClasses.sale}`}
      >
        {formattedOriginal}
      </span>
    </div>
  )
}
