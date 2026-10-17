import React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Butterfly } from '@/components/brand/Butterfly'
import { LeadForm } from '@/components/site/LeadForm'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

interface ComingSoonPageProps {
  searchParams: Promise<{
    'san-pham'?: string | string[]
    loai?: string | string[]
  }>
}

export async function generateMetadata({ searchParams }: ComingSoonPageProps): Promise<Metadata> {
  const rawParams = await searchParams
  const rawSlug = Array.isArray(rawParams['san-pham'])
    ? rawParams['san-pham'][0]
    : rawParams['san-pham']
  const slug = rawSlug?.trim()

  if (!slug) {
    return {
      title: vi.comingSoon.defaultMetaTitle,
      robots: { index: false, follow: false },
    }
  }

  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'products',
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
          { saleStatus: { not_equals: 'hidden' } },
        ],
      },
      limit: 1,
      depth: 0,
    })

    const product = res.docs[0]
    if (!product) {
      return {
        title: vi.comingSoon.defaultMetaTitle,
        robots: { index: false, follow: false },
      }
    }

    return {
      title: vi.comingSoon.metaTitle(product.name),
      description: product.shortDescription || vi.comingSoon.defaultMetaDesc,
      robots: { index: false, follow: false },
    }
  } catch {
    return {
      title: vi.comingSoon.defaultMetaTitle,
      robots: { index: false, follow: false },
    }
  }
}

export default async function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const rawParams = await searchParams
  const rawSlug = Array.isArray(rawParams['san-pham'])
    ? rawParams['san-pham'][0]
    : rawParams['san-pham']
  const slug = rawSlug?.trim()

  if (!slug) {
    notFound()
  }

  const rawLoai = Array.isArray(rawParams.loai) ? rawParams.loai[0] : rawParams.loai
  const isTrial = rawLoai?.trim() === 'dung-thu'

  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'products',
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
        { saleStatus: { not_equals: 'hidden' } },
      ],
    },
    limit: 1,
    depth: 1,
  })

  const product = res.docs[0]
  if (!product) {
    notFound()
  }

  type MediaDoc = { url?: string | null; alt?: string | null }
  const coverImage: MediaDoc | null =
    typeof product.coverImage === 'object' && product.coverImage !== null
      ? (product.coverImage as MediaDoc)
      : typeof product.preview === 'object' && product.preview !== null
        ? (product.preview as MediaDoc)
        : null

  const interestTags = isTrial
    ? [`sap-ra-mat:${product.slug}`, `dung-thu:${product.slug}`]
    : [`sap-ra-mat:${product.slug}`]

  const journeyLabel =
    product.journeyStep && vi.product.journeySteps[product.journeyStep]
      ? vi.product.journeySteps[product.journeyStep]
      : null

  return (
    <div className="w-full bg-warm-ivory min-h-screen py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/thu-vien"
            className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta transition-colors"
          >
            ← {vi.comingSoon.backToLibrary}
          </Link>
        </div>

        {/* Header with two-tone Anton and emotion quote */}
        <div className="mb-8 sm:mb-12">
          <SectionHeader
            as="h1"
            align="center"
            seriesLabel={isTrial ? vi.comingSoon.trialSeriesLabel : vi.comingSoon.seriesLabel}
            titleLine1={product.name}
            titleLine2={isTrial ? vi.comingSoon.trialSubtitle : vi.comingSoon.saleSubtitle}
            emotionLine={isTrial ? vi.comingSoon.trialEmotion : vi.comingSoon.saleEmotion}
          />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Product Overview Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <Card
              variant="white"
              className="w-full max-w-md overflow-hidden p-0 shadow-sm border border-deep-navy/10"
            >
              <div className="relative w-full aspect-[16/10] bg-lavender-mist overflow-hidden flex items-center justify-center">
                {coverImage?.url ? (
                  <Image
                    src={coverImage.url}
                    alt={coverImage.alt || product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div
                    data-testid="coming-soon-placeholder"
                    className="w-full h-full bg-lavender-mist flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {/* a11y-contrast-ok: SVG trang trí Butterfly có aria-hidden, không chứa chữ */}
                    <Butterfly className="w-16 h-16 text-deep-navy/35" aria-hidden={true} />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                  <StatusBadge status={product.saleStatus} />
                  {isTrial && product.trialDays && product.trialDays > 0 ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-semibold bg-white/95 text-deep-navy border border-deep-navy/15 shadow-sm backdrop-blur-sm">
                      {product.trialDays} {vi.product.trialBadge}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="p-6">
                {journeyLabel && (
                  <span className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-2 block font-ui">
                    {journeyLabel}
                  </span>
                )}
                <h2 className="font-ui font-bold text-xl text-deep-navy mb-2.5 leading-snug">
                  {product.name}
                </h2>
                {product.shortDescription && (
                  <p className="font-sans text-sm text-deep-navy/80 leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Lead Capture Form */}
          <div className="lg:col-span-7">
            <LeadForm
              title={isTrial ? vi.comingSoon.trialLeadTitle : vi.comingSoon.saleLeadTitle}
              description={isTrial ? vi.comingSoon.trialLeadDesc : vi.comingSoon.saleLeadDesc}
              submitLabel={isTrial ? vi.comingSoon.submitTrial : vi.comingSoon.submitSale}
              need="resource"
              interestTags={interestTags}
              resourceSlug={product.slug}
              pageSlug="sap-ra-mat"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
