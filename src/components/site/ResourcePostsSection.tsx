'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PostCard } from '@/components/site/PostCard'
import { LibraryFilterLink } from '@/components/site/LibraryFilterLink'
import { buildLibraryUrl, type LibraryQueryParams, type LibraryTopic } from '@/lib/library'
import type { LibraryDataResult } from '@/lib/library.server'
import { vi } from '@/lib/i18n/vi'
import { PATHS } from '@/lib/paths'

export interface ResourcePostsSectionProps {
  data: LibraryDataResult
  params: LibraryQueryParams
}

const TOPIC_CHIPS: Array<{ key: LibraryTopic | undefined; label: string }> = [
  { key: undefined, label: vi.sm05.topics.all },
  { key: 'tai-lieu', label: vi.sm05.topics.taiLieu },
  { key: 'habit', label: vi.sm05.topics.habit },
  { key: 'eq', label: vi.sm05.topics.eq },
  { key: 'career', label: vi.sm05.topics.career },
]

export function ResourcePostsSection({ data, params }: ResourcePostsSectionProps) {
  const { featuredPost, items, totalItems, currentPage, totalPages, hasError } = data

  const isEmpty = !hasError && totalItems === 0 && !featuredPost

  return (
    <div className="w-full">
      {/* 1. Filter Bar: Topics & Search Form */}
      <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-deep-navy/10 shadow-sm">
        {/* Topic Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Lọc theo chủ đề</span>
          {TOPIC_CHIPS.map(({ key, label }) => {
            const isSelected = params.topic === key
            return (
              <LibraryFilterLink
                key={key || 'all'}
                href={buildLibraryUrl({
                  topic: key,
                  q: params.q,
                })}
                tab="noi-dung"
                topic={key}
                isActive={isSelected}
                aria-current={isSelected ? 'page' : undefined}
                className={`min-h-[44px] px-4 py-2 rounded-full font-ui text-xs sm:text-sm font-semibold transition-all duration-200 select-none flex items-center justify-center focus-visible:outline-2 focus-visible:outline-bright-magenta ${
                  isSelected
                    ? 'bg-bright-magenta text-white shadow-sm'
                    : 'bg-warm-ivory text-deep-navy/80 border border-deep-navy/15 hover:bg-soft-pink/40 hover:text-deep-navy'
                }`}
              >
                {label}
              </LibraryFilterLink>
            )
          })}
        </div>

        {/* Search Input (Form GET) */}
        <form
          method="get"
          action={PATHS.resources}
          className="relative flex items-center w-full md:w-72"
        >
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
              className="absolute right-1 top-1 bottom-1 px-2.5 flex items-center justify-center text-deep-navy/60 hover:text-bright-magenta transition-colors min-h-[36px] min-w-[36px]"
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
              href={buildLibraryUrl({ topic: params.topic })}
              aria-label={vi.library.search.clear}
              className="ml-2 text-xs font-semibold text-bright-magenta hover:text-deep-navy whitespace-nowrap min-h-[44px] flex items-center"
            >
              {vi.library.search.clear}
            </Link>
          )}
        </form>
      </div>

      {/* 2. Error State */}
      {hasError ? (
        <Card variant="white" className="p-8 sm:p-12 text-center max-w-lg mx-auto">
          <h2 className="font-ui font-bold text-xl text-deep-navy mb-2">{vi.sm05.error.title}</h2>
          <p className="font-sans text-sm text-deep-navy/80 mb-6">{vi.sm05.error.desc}</p>
          <Button
            href={buildLibraryUrl({ topic: params.topic, q: params.q, trang: params.trang })}
            variant="secondary"
            size="md"
          >
            {vi.sm05.error.retry}
          </Button>
        </Card>
      ) : isEmpty ? (
        /* 3. Empty State */
        <Card variant="white" className="p-8 sm:p-12 text-center max-w-lg mx-auto">
          {params.topic || params.q ? (
            <>
              <h2 className="font-ui font-bold text-xl text-deep-navy mb-2">
                {vi.sm05.empty.noResults}
              </h2>
              <p className="font-sans text-sm text-deep-navy/80 mb-6">
                {vi.sm05.empty.noResultsDesc}
              </p>
              <Button href={buildLibraryUrl({})} variant="ghost" size="md">
                {vi.sm05.empty.resetFilters}
              </Button>
            </>
          ) : (
            <p className="font-ui text-base text-deep-navy/80">{vi.sm05.empty.updating}</p>
          )}
        </Card>
      ) : (
        /* 4. Content Area: Featured Post + Items Grid */
        <section aria-label="Danh sách bài viết và tài nguyên">
          {/* Featured Post (Large Card) */}
          {featuredPost && (
            <div className="mb-10 sm:mb-12">
              <PostCard
                featured={true}
                title={featuredPost.title}
                slug={featuredPost.slug}
                format={featuredPost.format || 'article'}
                series={featuredPost.series || null}
                topic={featuredPost.topic || null}
                readingMinutes={featuredPost.readingMinutes}
                thumbnail={
                  typeof featuredPost.thumbnail === 'object' &&
                  featuredPost.thumbnail !== null &&
                  'url' in featuredPost.thumbnail &&
                  featuredPost.thumbnail.url
                    ? {
                        src: featuredPost.thumbnail.url,
                        alt: featuredPost.thumbnail.alt || featuredPost.title,
                      }
                    : null
                }
              />
            </div>
          )}

          {/* Grid of Remaining Items (3 cols desktop / 2 tablet / 1 mobile) */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                if (item.isProduct) {
                  return (
                    <PostCard
                      key={`prod-${item.id}`}
                      title={item.name}
                      slug={item.slug}
                      format="article"
                      topic={item.topic || null}
                      thumbnail={
                        item.coverImage?.url
                          ? { src: item.coverImage.url, alt: item.coverImage.alt || item.name }
                          : null
                      }
                      excerpt={item.shortDescription || null}
                      href={`/tai-nguyen/${encodeURIComponent(item.slug)}`}
                      isResource={true}
                    />
                  )
                }

                const post = item
                const thumbSrc =
                  typeof post.thumbnail === 'object' &&
                  post.thumbnail !== null &&
                  'url' in post.thumbnail &&
                  post.thumbnail.url
                    ? post.thumbnail.url
                    : null
                const thumbAlt =
                  typeof post.thumbnail === 'object' &&
                  post.thumbnail !== null &&
                  'alt' in post.thumbnail &&
                  post.thumbnail.alt
                    ? post.thumbnail.alt
                    : post.title

                return (
                  <PostCard
                    key={`post-${post.id}`}
                    title={post.title}
                    slug={post.slug}
                    format={post.format || 'article'}
                    series={post.series || null}
                    topic={post.topic || null}
                    thumbnail={thumbSrc ? { src: thumbSrc, alt: thumbAlt } : null}
                    readingMinutes={post.readingMinutes}
                  />
                )
              })}
            </div>
          )}

          {/* 5. Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Phân trang danh sách bài viết"
              className="mt-10 sm:mt-12 flex items-center justify-center gap-4"
            >
              {currentPage > 1 ? (
                <Link
                  href={buildLibraryUrl({
                    topic: params.topic,
                    q: params.q,
                    trang: currentPage - 1,
                  })}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-deep-navy/20 bg-white font-ui text-sm font-semibold text-deep-navy hover:border-bright-magenta hover:text-bright-magenta transition-colors flex items-center justify-center shadow-xs"
                >
                  ← {vi.sm05.pagination.prev}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-deep-navy/10 bg-warm-ivory font-ui text-sm font-semibold text-deep-navy/30 cursor-not-allowed flex items-center justify-center"
                >
                  ← {vi.sm05.pagination.prev}
                </span>
              )}

              <span className="font-ui text-sm font-bold text-deep-navy px-2 select-none">
                {vi.sm05.pagination.page(currentPage, totalPages)}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={buildLibraryUrl({
                    topic: params.topic,
                    q: params.q,
                    trang: currentPage + 1,
                  })}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-deep-navy/20 bg-white font-ui text-sm font-semibold text-deep-navy hover:border-bright-magenta hover:text-bright-magenta transition-colors flex items-center justify-center shadow-xs"
                >
                  {vi.sm05.pagination.next} →
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-deep-navy/10 bg-warm-ivory font-ui text-sm font-semibold text-deep-navy/30 cursor-not-allowed flex items-center justify-center"
                >
                  {vi.sm05.pagination.next} →
                </span>
              )}
            </nav>
          )}
        </section>
      )}
    </div>
  )
}
