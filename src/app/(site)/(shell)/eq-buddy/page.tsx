import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isRichTextEmpty } from '@/lib/legal'
import { TrialBanner } from '@/components/habit/TrialBanner'
import { Button } from '@/components/ui/Button'
import { HeartLine } from '@/components/brand/HeartLine'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'products',
      where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })
    const product = res.docs[0] as Product | undefined
    if (product) {
      return {
        title: `${product.name} | Trạm Dừng Cảm Xúc`,
        description: product.shortDescription || vi.eqBuddy.intro.metaDescription,
      }
    }
  } catch {
    // Fallback to static meta below
  }
  return {
    title: vi.eqBuddy.intro.metaTitle,
    description: vi.eqBuddy.intro.metaDescription,
  }
}

export default async function EqBuddyIntroPage() {
  const payload = await getPayload({ config: await config })
  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const product = res.docs[0] as Product | undefined

  const title = product?.name || vi.eqBuddy.intro.defaultTitle
  const shortDesc = product?.shortDescription || vi.eqBuddy.intro.defaultDescription
  const hasDescription = Boolean(product?.description && !isRichTextEmpty(product.description))

  return (
    <div className="w-full">
      {/* Trial banner when customer is logged in */}
      <TrialBanner productSlug={EQ_BUDDY_PRODUCT_SLUG} />

      <div className="max-w-4xl mx-auto py-12 sm:py-16 px-6 sm:px-8">
        <header className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs font-bold uppercase tracking-wider">
            {vi.eqBuddy.intro.badge}
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-deep-navy tracking-tight">
            {title}
          </h1>
          {shortDesc && (
            <p className="font-quote italic text-lg sm:text-xl text-deep-navy/80 leading-relaxed pt-2">
              {shortDesc}
            </p>
          )}

          {/* Primary CTA */}
          <div className="pt-6 flex justify-center">
            <Button
              href="/eq-buddy/rut-the"
              variant="primary"
              size="lg"
              className="shadow-md hover:shadow-lg transition-all motion-reduce:transition-none"
            >
              {vi.eqBuddy.intro.drawButton}
            </Button>
          </div>
        </header>

        <div
          className="flex items-center justify-center my-10 sm:my-14 text-accent-pink/40"
          aria-hidden="true"
        >
          <HeartLine width={100} height={32} />
        </div>

        {/* Rich text detailed description from CMS */}
        {hasDescription && (
          <section className="bg-warm-ivory rounded-3xl border border-lavender-mist shadow-soft p-6 sm:p-10 md:p-12">
            <div className="prose prose-purple max-w-none font-sans text-deep-navy/90 leading-relaxed space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <RichText data={product?.description as any} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
