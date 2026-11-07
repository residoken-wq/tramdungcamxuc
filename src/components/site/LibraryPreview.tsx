'use client'

import React from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/site/ProductCard'
import { PostCard } from '@/components/site/PostCard'
import { resolveProductCta, type PublicProduct } from '@/lib/products'
import type { LibraryTab } from '@/lib/library'
import { PATHS } from '@/lib/paths'

export interface LibraryPreviewItemPost {
  id: string | number
  title: string
  slug: string
  format?: 'article' | 'video' | string | null
  series?: string | null
  topic?: string | null
  readingMinutes?: number | null
  readingTimeMinutes?: number | null
  excerpt?: string | null
  featured?: boolean
  thumbnail?: {
    src?: string | null
    alt?: string | null
  } | null
}

export type LibraryPreviewItem =
  (PublicProduct & { isPost?: false }) | (LibraryPreviewItemPost & { isPost: true })

export interface LibraryPreviewProps {
  version?: number
  layout?: 'grid' | 'featured'
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  tab?: LibraryTab
  limit?: number
  bgColor?: string
  padding?: 'sm' | 'md' | 'lg'
  items?: LibraryPreviewItem[] | null
  puck?: { isEditing?: boolean }
}

export function LibraryPreview({
  version = 1,
  layout = 'grid',
  seriesLabel = '[MẪU] Khám phá tri thức',
  titleLine1 = '[MẪU] THƯ VIỆN',
  titleLine2 = '[MẪU] CẢM XÚC & BÀI HỌC',
  emotionLine = '[MẪU] Những tài nguyên, bài học và công cụ được đúc kết từ thực tiễn.',
  tab = 'khoa-hoc',
  bgColor = 'warm-ivory',
  padding = 'md',
  items,
  puck,
}: LibraryPreviewProps) {
  const isEditing = puck?.isEditing ?? false
  const paddingClasses = {
    sm: 'py-8 px-4',
    md: 'py-14 px-4 sm:px-6',
    lg: 'py-20 px-4 sm:px-8',
  }[padding]

  const displayItems = Array.isArray(items) ? items : []
  const allUrl = `${PATHS.resources}?tab=${tab}`

  function renderPreviewItem(item: LibraryPreviewItem, isLarge = false) {
    if ('isPost' in item && item.isPost) {
      return (
        <div key={`post-${item.id}`} data-eb-card="" className="h-full">
          <PostCard
            title={item.title}
            slug={item.slug}
            format={item.format}
            series={item.series}
            topic={item.topic}
            thumbnail={item.thumbnail}
            readingMinutes={item.readingMinutes ?? item.readingTimeMinutes}
            excerpt={item.excerpt}
            featured={isLarge}
          />
        </div>
      )
    }

    const prod = item as PublicProduct
    const ctaInfo = resolveProductCta(prod)

    return (
      <div key={`prod-${prod.id}`} data-eb-card="" className="h-full">
        <ProductCard
          name={prod.name}
          shortDescription={prod.shortDescription || undefined}
          coverImage={{
            src: prod.coverImage?.url || '/brand/sample-cover.svg',
            alt: prod.coverImage?.alt || prod.name,
          }}
          price={prod.price}
          salePrice={prod.salePrice}
          saleStatus={prod.saleStatus}
          trialDays={prod.trialDays}
          journeyStep={prod.journeyStep || undefined}
          ctaInfo={ctaInfo}
        />
      </div>
    )
  }

  // Determine items when featured layout is chosen
  let featuredItem: LibraryPreviewItem | undefined
  let secondaryItems: LibraryPreviewItem[] = []
  if (layout === 'featured' && displayItems.length > 0) {
    const featuredIndex = displayItems.findIndex(
      (item) => 'isPost' in item && item.isPost && item.featured
    )
    const actualFeaturedIndex = featuredIndex >= 0 ? featuredIndex : 0
    featuredItem = displayItems[actualFeaturedIndex]
    secondaryItems = displayItems.filter((_, idx) => idx !== actualFeaturedIndex).slice(0, 3)
  }

  return (
    <section className={`w-full bg-${bgColor} ${paddingClasses}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        <SectionHeader
          seriesLabel={seriesLabel}
          titleLine1={titleLine1}
          titleLine2={titleLine2}
          emotionLine={emotionLine}
          align="center"
        />

        {displayItems.length === 0 ? (
          <div className="text-center py-10 bg-white/60 rounded-2xl border border-deep-navy/10 p-6">
            <p className="font-sans text-sm text-deep-navy/70">
              {isEditing
                ? 'Chưa có nội dung thư viện để hiển thị (hệ thống sẽ tự nạp các mục mới nhất theo tab đã chọn).'
                : 'Thư viện đang được cập nhật nội dung.'}
            </p>
          </div>
        ) : layout === 'featured' ? (
          <div className="space-y-6 sm:space-y-8" data-testid="library-preview-featured">
            {featuredItem && (
              <div className="w-full">
                {renderPreviewItem(featuredItem, true)}
              </div>
            )}
            {secondaryItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                {secondaryItems.map((item) => renderPreviewItem(item, false))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {displayItems.map((item) => renderPreviewItem(item, false))}
          </div>
        )}

        <div className="pt-2 text-center">
          <Button
            href={allUrl}
            variant="secondary"
            size="md"
            className="px-8 shadow-sm hover:shadow transition-all"
          >
            Xem tất cả
          </Button>
        </div>
      </div>
    </section>
  )
}
