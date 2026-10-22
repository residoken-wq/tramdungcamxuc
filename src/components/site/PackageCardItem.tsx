'use client'

import React from 'react'
import { BrandIcon } from '@/components/brand'
import { useClientProducts } from '@/puck/client-preview'
import type { PublicProduct } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import {
  type FontSizeOption,
  type TextColorOption,
  type AlignOption,
  fontSizeClass,
  textColorClass,
  textAlignClass,
} from '@/lib/brand/format-classes'

export interface PackageCardItemProps {
  version?: number
  packageId?: string | number
  highlight?: boolean
  nameColor?: TextColorOption
  nameSize?: FontSizeOption
  textColor?: TextColorOption
  textSize?: FontSizeOption
  align?: AlignOption
  _resolved?: {
    package?: PublicProduct | null
  }
  puck?: {
    isEditing?: boolean
  }
  isDeepNavy?: boolean
}

export function PackageCardItem({
  packageId,
  highlight = false,
  nameColor,
  nameSize = 'md',
  textColor,
  textSize = 'md',
  align = 'left',
  _resolved,
  puck,
  isDeepNavy = false,
}: PackageCardItemProps) {
  const isEditing = Boolean(puck?.isEditing)

  const productIds = React.useMemo(() => {
    return packageId != null && String(packageId).trim() !== '' ? [packageId] : []
  }, [packageId])

  const resolvedPackage = _resolved?.package
  const initialProducts = React.useMemo(() => {
    return resolvedPackage ? [resolvedPackage] : undefined
  }, [resolvedPackage])

  const { products: loadedProducts } = useClientProducts({
    productIds: isEditing ? productIds : [],
    mode: 'manual',
    initialProducts,
  })

  const activePackage = (
    isEditing
      ? _resolved?.package || (loadedProducts && loadedProducts[0]) || null
      : _resolved?.package || null
  ) as PublicProduct | null

  if (!activePackage) {
    if (isEditing) {
      return (
        <div className="p-8 text-center text-deep-navy/60 bg-warm-ivory rounded-card border border-dashed border-deep-navy/20 min-h-[220px] flex flex-col items-center justify-center font-ui text-sm">
          {packageId ? `Gói ID: ${packageId}` : vi.builder.noDataSelectInCms}
        </div>
      )
    }
    return null
  }

  const cardBg = highlight
    ? isDeepNavy
      ? 'bg-white/15 border-accent-pink shadow-md ring-2 ring-accent-pink'
      : 'bg-white border-accent-pink shadow-md ring-2 ring-accent-pink'
    : isDeepNavy
      ? 'bg-white/10 border-white/20 shadow-soft'
      : 'bg-white border-deep-navy/10 shadow-soft'

  const resolvedNameColor = nameColor
    ? textColorClass(nameColor)
    : isDeepNavy
      ? 'text-white'
      : 'text-deep-navy'

  const resolvedTextColor = textColor
    ? textColorClass(textColor)
    : isDeepNavy
      ? 'text-white/80'
      : 'text-deep-navy/80'

  return (
    <div
      className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-card border transition-all ${cardBg} ${textAlignClass(align)}`}
    >
      <div>
        {/* Style: Icon or Numbered (CSS counter controlled via parent [counter-reset:card-counter] and data-style) */}
        <div className="hidden group-data-[style=numbered]/grid:block font-display text-3xl sm:text-4xl text-bright-magenta mb-4 [counter-increment:card-counter] before:content-[counter(card-counter,decimal-leading-zero)]" />

        <div className="w-12 h-12 rounded-xl bg-soft-pink flex items-center justify-center text-deep-navy mb-4 group-data-[style=numbered]/grid:hidden">
          {activePackage.icon ? (
            <BrandIcon name={activePackage.icon} className="w-6 h-6 text-deep-navy" />
          ) : (
            <BrandIcon name="star" className="w-6 h-6 text-deep-navy" />
          )}
        </div>

        {/* Package Name */}
        <h3
          className={`font-display uppercase tracking-tight mb-2 ${fontSizeClass('package-name', nameSize)} ${resolvedNameColor}`}
        >
          {activePackage.name}
        </h3>

        {/* Tagline */}
        {activePackage.tagline && (
          <p
            className={`font-quote text-base italic mb-3 ${
              isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
            }`}
          >
            {activePackage.tagline}
          </p>
        )}

        {/* Short Description */}
        {activePackage.shortDescription && (
          <p
            className={`font-ui leading-relaxed ${fontSizeClass('package-text', textSize)} ${resolvedTextColor}`}
          >
            {activePackage.shortDescription}
          </p>
        )}
      </div>
    </div>
  )
}
