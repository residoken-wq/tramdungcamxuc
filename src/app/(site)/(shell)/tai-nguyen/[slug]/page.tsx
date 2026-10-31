import React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import { Card } from '@/components/ui/Card'
import { ResourceRequestForm } from '@/components/site/ResourceRequestForm'
import { RefreshOnSave } from '@/components/site/RefreshOnSave'
import { getAdminPreviewUser } from '@/lib/live-preview.server'
import { vi } from '@/lib/i18n/vi'
import { PATHS } from '@/lib/paths'

export const dynamic = 'force-dynamic'

interface ResourcePageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'products',
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
        { or: [{ type: { equals: 'ebook' } }, { type: { equals: 'toolkit' } }] },
        { saleStatus: { equals: 'free' } },
      ],
    },
    limit: 1,
    depth: 1,
  })

  const product = res.docs[0]
  if (!product) {
    return { title: 'Tài nguyên – Trạm Dừng Cảm Xúc' }
  }

  return {
    title: `${product.name} – Trạm Dừng Cảm Xúc`,
    description: product.shortDescription || 'Tài nguyên miễn phí từ Trạm Dừng Cảm Xúc',
  }
}

export default async function ResourcePage({ params, searchParams }: ResourcePageProps) {
  const { slug } = await params
  const search = (await searchParams) || {}
  const payload = await getPayload({ config })

  // REVIEW-REQUIRED: Chỉ phiên admin Payload (users collection) mới được đọc bản nháp của tài nguyên.
  // Khách vãng lai và học viên dù có preview=1 vẫn chỉ đọc bản đã xuất bản.
  const adminUser = await getAdminPreviewUser(search)
  const isDraft = Boolean(adminUser)

  const whereConditions = isDraft
    ? typeof search.previewId === 'string'
      ? { id: { equals: search.previewId } }
      : { slug: { equals: slug } }
    : {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
          { or: [{ type: { equals: 'ebook' } }, { type: { equals: 'toolkit' } }] },
          { saleStatus: { equals: 'free' } },
        ],
      }

  const res = await payload.find({
    collection: 'products',
    where: whereConditions as unknown as Where,
    limit: 1,
    depth: 2,
    draft: isDraft,
    // Draft preview: enforce the admin's access. Public read keeps the previous behaviour
    // (field access such as products.files is admin-only and must not blank the public page).
    ...(isDraft ? { overrideAccess: false, user: adminUser ?? undefined } : {}),
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

  const includes = Array.isArray(product.includes) ? product.includes : []
  const hasFiles = Boolean(product.files && product.files.length > 0)

  return (
    <>
      {adminUser && <RefreshOnSave />}
      <div className="w-full bg-warm-ivory min-h-screen py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation link */}
          <div className="mb-6 sm:mb-8">
            <Link
              href={PATHS.resources}
              className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta transition-colors"
            >
              ← {vi.resource.backToLibrary}
            </Link>
          </div>

          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
            {/* Cover image or visual container */}
            <div className="md:col-span-5 flex justify-center">
              {coverImage?.url ? (
                <div className="relative w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden shadow-md border border-lavender-mist bg-white">
                  <Image
                    src={coverImage.url}
                    alt={coverImage.alt || product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full max-w-sm aspect-[4/5] rounded-2xl bg-lavender-mist/40 border border-lavender-mist flex flex-col items-center justify-center p-6 text-center shadow-sm">
                  <span className="font-ui text-4xl mb-3">📖</span>
                  <span className="font-display uppercase text-xl text-deep-navy">
                    {product.name}
                  </span>
                </div>
              )}
            </div>

            {/* Product details */}
            <div className="md:col-span-7 flex flex-col">
              <span className="inline-block self-start px-3 py-1 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs font-bold uppercase tracking-wider mb-3">
                {product.type === 'ebook' ? 'Sách điện tử miễn phí' : 'Bộ tài nguyên miễn phí'}
              </span>

              <h1 className="font-display uppercase text-3xl sm:text-4xl lg:text-5xl text-deep-navy leading-[1.3] tracking-tight mb-4">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="font-body text-base sm:text-lg text-deep-navy/85 leading-relaxed mb-6">
                  {product.shortDescription}
                </p>
              )}

              {includes.length > 0 && (
                <div className="mb-6 p-5 rounded-2xl bg-white/70 border border-lavender-mist">
                  <h2 className="font-ui text-sm font-bold text-deep-navy uppercase tracking-wider mb-3">
                    {vi.resource.includesTitle}
                  </h2>
                  <ul className="space-y-2">
                    {includes.map((item: unknown, idx: number) => {
                      const text =
                        typeof item === 'object' && item !== null && 'text' in item
                          ? String((item as { text: unknown }).text)
                          : String(item)
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 font-body text-sm text-deep-navy/80"
                        >
                          <span className="text-bright-magenta font-bold mt-0.5">•</span>
                          <span>{text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Form or Preparation Notice */}
          <div className="max-w-xl mx-auto">
            {hasFiles ? (
              <ResourceRequestForm slug={product.slug} productName={product.name} />
            ) : (
              <Card
                variant="white"
                className="p-8 sm:p-10 bg-white border border-butter-cream shadow-sm text-center"
              >
                <div className="w-14 h-14 rounded-full bg-butter-cream/60 text-deep-navy flex items-center justify-center mx-auto mb-4 text-2xl">
                  ⏳
                </div>
                <h2 className="font-display uppercase tracking-tight text-2xl text-deep-navy mb-2">
                  {vi.resource.preparing}
                </h2>
                <p className="font-body text-sm sm:text-base text-deep-navy/80 leading-relaxed max-w-md mx-auto">
                  {vi.resource.preparingDesc}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
