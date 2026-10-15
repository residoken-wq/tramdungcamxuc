import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess, type AccessResult } from '@/lib/entitlements'
import { vi } from '@/lib/i18n/vi'

export interface ToolPaywallProps {
  productSlug: string
  product?: Product
  access?: AccessResult
  /** Badge above the title; defaults to a product-neutral label. */
  badge?: string
  /** Used when the product has no short description in the CMS. */
  fallbackDescription?: string
  className?: string
}

export async function ToolPaywall({
  productSlug,
  product: initialProduct,
  access: initialAccess,
  badge = vi.trial.paywallBadge,
  fallbackDescription = vi.trial.paywallDescription,
  className = '',
}: ToolPaywallProps) {
  let product = initialProduct
  let access = initialAccess

  const payload = await getPayload({ config: await config })

  if (!product) {
    const productsRes = await payload.find({
      collection: 'products',
      where: { slug: { equals: productSlug } },
      overrideAccess: true,
      limit: 1,
    })
    product = productsRes.docs[0] as Product | undefined
  }

  if (!product) {
    return (
      <div className={`w-full max-w-xl mx-auto py-12 px-4 text-center ${className}`.trim()}>
        <p className="text-sm font-sans text-deep-navy/70">{vi.trial.productNotFound}</p>
      </div>
    )
  }

  if (!access) {
    const customer = await getCurrentCustomer()
    if (customer) {
      const now = new Date()
      access = await getAccess(customer.id, product.id, { payload, now })
    }
  }

  const buyUrl = `/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`
  const trialUrl = `/dung-thu?san-pham=${encodeURIComponent(product.slug)}`
  const trialDays = product.trialDays ?? 0
  const isExpired = access?.status === 'expired'
  // Hide the trial button only when this customer's trial is what expired (startTrial would refuse).
  const showTrial = trialDays > 0 && !(isExpired && access?.expiredType === 'trial')

  const description = product.shortDescription?.trim() || fallbackDescription

  return (
    <div className={`w-full max-w-xl mx-auto py-12 px-4 ${className}`.trim()}>
      <div className="bg-warm-ivory rounded-card border border-deep-navy/15 p-6 sm:p-8 shadow-soft text-center space-y-5">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-soft-pink text-deep-navy">
          {badge}
        </span>
        <h1 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy">{product.name}</h1>
        <p className="font-sans text-sm text-deep-navy/80 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          {showTrial && (
            <Link
              href={trialUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-accent-pink text-warm-ivory font-ui font-bold text-sm hover:bg-accent-pink/90 transition-all motion-reduce:transition-none shadow-sm"
            >
              {vi.trial.startButton(trialDays)}
            </Link>
          )}
          <Link
            href={buyUrl}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full font-ui font-bold text-sm transition-all motion-reduce:transition-none shadow-sm ${
              isExpired
                ? 'bg-bright-magenta text-warm-ivory hover:bg-bright-magenta/90'
                : 'border border-deep-navy/20 text-deep-navy bg-warm-ivory hover:bg-lavender-mist/40'
            }`}
          >
            {isExpired ? vi.trial.buyToContinueButton : vi.tracker.paywall.buyButton}
          </Link>
        </div>
      </div>
    </div>
  )
}
