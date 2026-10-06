'use client'

import React from 'react'
import type { Product } from '@/payload-types'
import { PriceTag } from '@/components/ui/PriceTag'
import { getEffectivePrice } from '@/lib/products'
import { useClientProduct } from '@/puck/client-preview'

export interface ProductPriceTagProps {
  version?: number
  productId?: string | number
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right'
  _resolved?: {
    product?: Product | null
  }
  puck?: {
    isEditing?: boolean
  }
}

export function ProductPriceTag({
  productId,
  size = 'md',
  align = 'center',
  _resolved,
  puck,
}: ProductPriceTagProps) {
  const isEditing = puck?.isEditing ?? false

  const { product, loading } = useClientProduct(productId, _resolved?.product)

  if (!isEditing && (!product || product.saleStatus === 'hidden')) {
    return null
  }

  const alignClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  }[align]

  if (loading && !product) {
    return (
      <div className={`py-2 px-4 flex ${alignClasses}`}>
        <span className="font-ui text-sm text-deep-navy/50">Đang tải giá...</span>
      </div>
    )
  }

  if (!product) {
    if (isEditing) {
      return (
        <div className={`py-2 px-4 flex ${alignClasses}`}>
          <span className="font-ui text-sm text-deep-navy/50 border border-dashed border-deep-navy/20 px-3 py-1 rounded">
            Chưa chọn sản phẩm hiển thị giá
          </span>
        </div>
      )
    }
    return null
  }

  const now = new Date()
  const effective = getEffectivePrice(product, now)

  return (
    <div className={`py-2 px-4 flex ${alignClasses}`}>
      <PriceTag originalPrice={effective.price} salePrice={effective.salePrice} size={size} />
    </div>
  )
}
