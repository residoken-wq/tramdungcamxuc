import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/site/ProductCard'
import { PostCard } from '@/components/site/PostCard'
import { LibraryFilterLink } from '@/components/site/LibraryFilterLink'
import { getEffectivePrice, resolveProductCta } from '@/lib/products'
import {
  parseLibraryParams,
  buildLibraryUrl,
  getLibraryEmptyKind,
  splitAtPostsSlot,
  VALID_TOPICS,
  type LibraryTopic,
} from '@/lib/library'
import { getLibraryData } from '@/lib/library.server'
import { vi } from '@/lib/i18n/vi'
import { PATHS } from '@/lib/paths'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.library.pageTitle,
}

type LibraryPageProps = {
  searchParams: Promise<{
    tab?: string | string[]
    topic?: string | string[]
    q?: string | string[]
  }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const rawParams = await searchParams
  const params = parseLibraryParams(rawParams)
  const { products, posts, introData, hasError } = await getLibraryData(params)
  const { before: puckBefore, after: puckAfter } = splitAtPostsSlot(introData)

  const now = new Date()
  const totalItems = products.length + posts.length

  return (
    <div className="w-full bg-warm-ivory min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Phần mở đầu Puck (trước ResourcePostsSlot) hoặc tiêu đề dự phòng */}
        {puckBefore ? (
          <div className="mb-8 md:mb-12">
            <Render config={puckConfig} data={puckBefore} />
          </div>
        ) : !introData ? (
          <header className="mb-8 sm:mb-12 text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-[1.15] text-deep-navy">
              {vi.library.heading}
            </h1>
          </header>
        ) : null}

        {/* 3. Thanh bộ lọc: Chủ đề và Ô tìm kiếm */}
        <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-deep-navy/10 shadow-sm">
          {/* Bộ lọc chủ đề */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="sr-only">Lọc theo chủ đề</span>
            <LibraryFilterLink
              href={buildLibraryUrl({
                tab: params.tab,
                topic: undefined,
                q: params.q,
              })}
              tab={params.tab}
              topic={undefined}
              isActive={!params.topic}
              className={`min-h-[40px] px-4 py-1.5 rounded-full font-ui text-xs sm:text-sm font-semibold transition-all duration-200 select-none flex items-center justify-center ${
                !params.topic
                  ? 'bg-bright-magenta text-white shadow-sm'
                  : 'bg-warm-ivory text-deep-navy/80 border border-deep-navy/15 hover:bg-soft-pink/40 hover:text-deep-navy'
              }`}
            >
              {vi.library.topics.all}
            </LibraryFilterLink>
            {VALID_TOPICS.map((topicKey: LibraryTopic) => {
              const isSelected = params.topic === topicKey
              return (
                <LibraryFilterLink
                  key={topicKey}
                  href={buildLibraryUrl({
                    tab: params.tab,
                    topic: topicKey,
                    q: params.q,
                  })}
                  tab={params.tab}
                  topic={topicKey}
                  isActive={isSelected}
                  className={`min-h-[40px] px-4 py-1.5 rounded-full font-ui text-xs sm:text-sm font-semibold transition-all duration-200 select-none flex items-center justify-center ${
                    isSelected
                      ? 'bg-bright-magenta text-white shadow-sm'
                      : 'bg-warm-ivory text-deep-navy/80 border border-deep-navy/15 hover:bg-soft-pink/40 hover:text-deep-navy'
                  }`}
                >
                  {vi.library.topics[topicKey]}
                </LibraryFilterLink>
              )
            })}
          </div>

          {/* Ô tìm kiếm bằng FORM GET */}
          <form
            method="get"
            action={PATHS.resources}
            className="relative flex items-center w-full md:w-72"
          >
            <input type="hidden" name="tab" value={params.tab} />
            {params.topic && <input type="hidden" name="topic" value={params.topic} />}
            <div className="relative w-full">
              <input
                type="search"
                name="q"
                defaultValue={params.q || ''}
                placeholder={vi.library.search.placeholder}
                aria-label={vi.library.search.label}
                maxLength={100}
                className="w-full min-h-[44px] pl-4 pr-10 py-2 rounded-xl bg-warm-ivory border border-deep-navy/20 font-sans text-sm text-deep-navy placeholder:text-deep-navy/50 focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:border-transparent transition-all"
              />
              <button
                type="submit"
                aria-label={vi.library.search.button}
                className="absolute right-1 top-1 bottom-1 px-2.5 flex items-center justify-center text-deep-navy/60 hover:text-bright-magenta transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
            {params.q && (
              <Link
                href={buildLibraryUrl({ tab: params.tab, topic: params.topic })}
                aria-label={vi.library.search.clear}
                className="ml-2 text-xs font-semibold text-bright-magenta hover:text-deep-navy whitespace-nowrap min-h-[44px] flex items-center"
              >
                {vi.library.search.clear}
              </Link>
            )}
          </form>
        </div>

        {/* 4. Khối kết quả */}
        {hasError ? (
          <Card variant="white" className="p-8 sm:p-12 text-center max-w-lg mx-auto">
            <h2 className="font-ui font-bold text-xl text-deep-navy mb-2">
              {vi.library.error.title}
            </h2>
            <p className="font-sans text-sm text-deep-navy/80 mb-6">
              {vi.library.error.description}
            </p>
            <Button
              href={buildLibraryUrl({ tab: params.tab, topic: params.topic, q: params.q })}
              variant="secondary"
              size="md"
            >
              {vi.library.error.retry}
            </Button>
          </Card>
        ) : totalItems === 0 ? (
          <Card variant="white" className="p-8 sm:p-12 text-center max-w-lg mx-auto">
            {getLibraryEmptyKind(params) === 'updating' ? (
              <p className="font-ui text-base text-deep-navy/80">{vi.library.empty.updating}</p>
            ) : (
              <>
                <h2 className="font-ui font-bold text-xl text-deep-navy mb-2">
                  {vi.library.empty.title}
                </h2>
                <p className="font-sans text-sm text-deep-navy/80 mb-6">
                  {vi.library.empty.description}
                </p>
                <Button href={buildLibraryUrl({ tab: params.tab })} variant="ghost" size="md">
                  {vi.library.empty.resetFilters}
                </Button>
              </>
            )}
          </Card>
        ) : (
          <section
            aria-label={
              params.tab === 'khoa-hoc' ? vi.library.tabs.courses : vi.library.tabs.content
            }
          >
            <h2 className="sr-only">
              {params.tab === 'khoa-hoc' ? vi.library.tabs.courses : vi.library.tabs.content}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sản phẩm */}
              {products.map((product) => {
                const effectivePrice = getEffectivePrice(product, now)
                const ctaInfo = resolveProductCta(product, now)
                const coverSrc =
                  typeof product.coverImage === 'object' &&
                  product.coverImage !== null &&
                  'url' in product.coverImage &&
                  (product.coverImage as { url?: string }).url
                    ? (product.coverImage as { url: string }).url
                    : '/brand/sample-cover.svg'
                const coverAlt =
                  typeof product.coverImage === 'object' &&
                  product.coverImage !== null &&
                  'alt' in product.coverImage &&
                  (product.coverImage as { alt?: string }).alt
                    ? (product.coverImage as { alt: string }).alt
                    : product.name

                return (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    shortDescription={product.shortDescription || undefined}
                    coverImage={{ src: coverSrc, alt: coverAlt }}
                    price={effectivePrice.price}
                    salePrice={effectivePrice.salePrice}
                    saleStatus={product.saleStatus}
                    trialDays={product.trialDays}
                    journeyStep={product.journeyStep || undefined}
                    ctaInfo={ctaInfo}
                  />
                )
              })}

              {/* Bài viết / Video */}
              {posts.map((post) => {
                const thumbnailSrc =
                  typeof post.thumbnail === 'object' &&
                  post.thumbnail !== null &&
                  'url' in post.thumbnail &&
                  (post.thumbnail as { url?: string }).url
                    ? (post.thumbnail as { url: string }).url
                    : null
                const thumbnailAlt =
                  typeof post.thumbnail === 'object' &&
                  post.thumbnail !== null &&
                  'alt' in post.thumbnail &&
                  (post.thumbnail as { alt?: string }).alt
                    ? (post.thumbnail as { alt: string }).alt
                    : post.title

                return (
                  <PostCard
                    key={post.id}
                    title={post.title}
                    slug={post.slug}
                    format={post.format || 'article'}
                    series={post.series || null}
                    topic={post.topic || null}
                    thumbnail={thumbnailSrc ? { src: thumbnailSrc, alt: thumbnailAlt } : null}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* 5. Phần sau Puck (sau ResourcePostsSlot) */}
        {puckAfter && (
          <div className="mt-12 md:mt-16">
            <Render config={puckConfig} data={puckAfter} />
          </div>
        )}
      </div>
    </div>
  )
}
