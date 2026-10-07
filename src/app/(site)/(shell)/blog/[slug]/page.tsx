import React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ProductCard } from '@/components/site/ProductCard'
import { getEffectivePrice, resolveProductCta } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import { getPostDetail } from '@/lib/detail-pages.server'

export const dynamic = 'force-dynamic'

type BlogDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostDetail(slug)

  if (post) {
    return {
      title: `${post.title} | Trạm Dừng Cảm Xúc`,
      description: post.series || undefined,
      openGraph: post.thumbnail?.src ? { images: [post.thumbnail.src] } : undefined,
    }
  }

  return {
    title: `${vi.notFound.title} | Trạm Dừng Cảm Xúc`,
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const post = await getPostDetail(slug)

  if (!post) {
    notFound()
  }

  const topicLabel =
    post.topic && post.topic in vi.library.topics
      ? vi.library.topics[post.topic as keyof typeof vi.library.topics]
      : post.topic

  const now = new Date()
  const hasVideo = Boolean(post.parsedVideo.isValid && post.parsedVideo.embedUrl)
  const hasContent = Boolean(post.content)

  return (
    <article className="w-full bg-warm-ivory py-10 sm:py-16 min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Điều hướng quay lại Thư viện */}
        <div className="mb-6">
          <Link
            href="/thu-vien?tab=noi-dung"
            className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm min-h-[44px]"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>{vi.detail.backToLibrary}</span>
          </Link>
        </div>

        {/* Header bài viết */}
        <header className="mb-8 sm:mb-12">
          {/* Huy hiệu định dạng & Series & Chủ đề */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center rounded-full px-3 py-1 font-ui text-xs font-semibold bg-white text-deep-navy border border-deep-navy/15 shadow-sm">
              {post.format === 'video' ? vi.library.badges.video : vi.library.badges.article}
            </span>
            {post.series && (
              <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
                {post.series}
              </span>
            )}
            {topicLabel && (
              <span className="inline-flex items-center rounded-full px-3 py-1 font-ui text-xs font-semibold bg-soft-pink text-bright-magenta border border-bright-magenta/20 shadow-sm">
                {topicLabel}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-deep-navy leading-[1.15]">
            {post.title}
          </h1>
        </header>

        {/* Video nhúng nếu có URL video YouTube/Vimeo hợp lệ */}
        {hasVideo && post.parsedVideo.embedUrl && (
          <section aria-label={vi.detail.post.videoHeading} className="mb-10 sm:mb-12">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-deep-navy/10 bg-black/5 shadow-sm">
              <iframe
                src={post.parsedVideo.embedUrl}
                title={post.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </section>
        )}

        {/* Ảnh đại diện (nếu không có video hoặc có thumbnail riêng) */}
        {!hasVideo && post.thumbnail?.src && (
          <div className="relative w-full aspect-[16/9] mb-10 sm:mb-12 overflow-hidden rounded-2xl border border-deep-navy/10 shadow-sm bg-lavender-mist/30">
            <Image
              src={post.thumbnail.src}
              alt={post.thumbnail.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        {/* Nội dung Rich Text Lexical */}
        {hasContent && (
          <div className="font-ui text-base sm:text-lg text-deep-navy leading-relaxed space-y-6 border-b border-deep-navy/15 pb-12 mb-12">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <RichText data={post.content as any} />
          </div>
        )}

        {/* Sản phẩm gợi ý ở cuối bài (nếu có ctaProduct) */}
        {post.ctaProduct && (
          <section aria-label={vi.detail.post.relatedProductHeading} className="pt-6 mt-8">
            <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-6 text-center sm:text-left">
              {vi.detail.post.relatedProductHeading}
            </h2>
            <div className="max-w-md mx-auto sm:mx-0">
              <ProductCard
                name={post.ctaProduct.name}
                shortDescription={post.ctaProduct.shortDescription || undefined}
                coverImage={{
                  src: post.ctaProduct.coverImage?.url || '/brand/sample-cover.svg',
                  alt: post.ctaProduct.coverImage?.alt || post.ctaProduct.name,
                }}
                price={getEffectivePrice(post.ctaProduct, now).price}
                salePrice={getEffectivePrice(post.ctaProduct, now).salePrice}
                saleStatus={post.ctaProduct.saleStatus}
                trialDays={post.ctaProduct.trialDays}
                journeyStep={post.ctaProduct.journeyStep || undefined}
                ctaInfo={resolveProductCta(post.ctaProduct, now)}
              />
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
