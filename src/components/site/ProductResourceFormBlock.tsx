'use client'

import React, { Suspense, lazy } from 'react'
import { Card } from '@/components/ui/Card'
import { useClientProduct } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'

// Loaded lazily (like LeadForm's server action) so the builder config never pulls the server
// action module into its import graph.
const ResourceRequestForm = lazy(() =>
  import('@/components/site/ResourceRequestForm').then((m) => ({ default: m.ResourceRequestForm })),
)

export interface ProductResourceResolved {
  slug: string
  name: string
  hasFiles: boolean
}

export interface ProductResourceFormBlockProps {
  productId?: string | number | null
  _resolved?: ProductResourceResolved | null
  isEditing?: boolean
}

/**
 * BX-08: the free-resource request form of `/tai-nguyen/<slug>` as a builder block. Reuses
 * `ResourceRequestForm` (same lead path); shows the "đang chuẩn bị" card when the product has no
 * file yet, exactly like the coded page.
 */
export function ProductResourceFormBlock({
  productId,
  _resolved,
  isEditing = false,
}: ProductResourceFormBlockProps) {
  // Public pages pass `_resolved` (no fetch); the builder fetches the product summary.
  const { product } = useClientProduct(
    _resolved ? undefined : (productId ?? undefined),
    _resolved ? null : undefined,
  )
  const data: ProductResourceResolved | null =
    _resolved ??
    (product
      ? { slug: product.slug, name: product.name, hasFiles: true /* builder preview */ }
      : null)

  if (!productId || !data) {
    return isEditing ? (
      <div className="mx-auto my-4 max-w-xl rounded-card border border-dashed border-bright-magenta/40 bg-soft-pink/40 p-4 text-center font-ui text-sm text-deep-navy">
        {vi.bx08.chooseProduct}
      </div>
    ) : null
  }

  return (
    <section className="w-full px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        {data.hasFiles ? (
          <Suspense fallback={null}>
            <ResourceRequestForm slug={data.slug} productName={data.name} />
          </Suspense>
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
    </section>
  )
}
