import React from 'react'
import type { Metadata } from 'next'
import { StyledRender } from '@/components/design/StyledRender'
import { puckConfig } from '@/puck/config'
import { ResourcePostsSection } from '@/components/site/ResourcePostsSection'
import { parseLibraryParams, splitAtPostsSlot } from '@/lib/library'
import { getLibraryData } from '@/lib/library.server'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.library.pageTitle,
}

// The page is split around the posts section, so each half is a short fragment: drop the
// root wrapper's `min-h-screen`, which otherwise leaves a screen-tall gap under a short intro.
const sectionConfig: typeof puckConfig = {
  ...puckConfig,
  root: {
    ...puckConfig.root,
    render: ({ children }) => (
      <div className="font-sans text-deep-navy antialiased">{children}</div>
    ),
  },
}

type LibraryPageProps = {
  searchParams: Promise<{
    tab?: string | string[]
    topic?: string | string[]
    q?: string | string[]
    trang?: string | string[]
  }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const rawParams = await searchParams
  const params = parseLibraryParams(rawParams)
  const libraryData = await getLibraryData(params)
  const { before: puckBefore, after: puckAfter } = splitAtPostsSlot(libraryData.introData)

  return (
    <div className="w-full bg-warm-ivory min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Phần mở đầu Puck (trước ResourcePostsSlot) hoặc tiêu đề dự phòng */}
        {puckBefore ? (
          <div className="mb-8 md:mb-12">
            <StyledRender config={sectionConfig} data={puckBefore} />
          </div>
        ) : !libraryData.introData ? (
          <header className="mb-8 sm:mb-12 text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-[1.3] text-deep-navy">
              {vi.library.heading}
            </h1>
          </header>
        ) : null}

        {/* 2. Khu bài viết ứng dụng (bộ lọc, bài nổi bật, lưới bài viết, phân trang) */}
        <ResourcePostsSection data={libraryData} params={params} />

        {/* 3. Phần sau Puck (sau ResourcePostsSlot) */}
        {puckAfter && (
          <div className="mt-12 md:mt-16">
            <StyledRender config={sectionConfig} data={puckAfter} />
          </div>
        )}
      </div>
    </div>
  )
}
