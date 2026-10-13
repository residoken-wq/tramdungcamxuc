import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'
import { vi } from '@/lib/i18n/vi'

export async function TrialBanner() {
  const customer = await getCurrentCustomer()
  if (!customer) return null

  const payload = await getPayload({ config: await config })
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })

  const product = products.docs[0] as Product | undefined
  if (!product) return null

  const now = new Date()
  const access = await getAccess(customer.id, product.id, { payload, now })

  if (access.status === 'active' || access.status === 'none') {
    return null
  }

  const buyUrl = `/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`

  if (access.status === 'trial') {
    const daysLeft = access.daysLeft ?? product.trialDays ?? 0
    return (
      <aside
        aria-label={vi.trial.banner.trialAria}
        className="w-full bg-soft-pink/90 border-b border-accent-pink/20 py-2.5 px-4 text-deep-navy"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta animate-pulse shrink-0" />
            <p className="font-sans text-xs sm:text-sm font-semibold text-deep-navy">
              {vi.trial.banner.daysLeft(daysLeft)}
            </p>
          </div>
          <Link
            href={buyUrl}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-bright-magenta text-white font-ui font-semibold text-xs hover:bg-bright-magenta/90 transition-colors shadow-sm"
          >
            {vi.trial.banner.buyButton}
          </Link>
        </div>
      </aside>
    )
  }

  if (access.status === 'expired') {
    return (
      <aside
        aria-label={vi.trial.banner.expiredAria}
        className="w-full bg-butter-cream/90 border-b border-butter-cream py-2.5 px-4 text-deep-navy"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-pink shrink-0" />
            <p className="font-sans text-xs sm:text-sm font-semibold text-deep-navy">
              {vi.trial.banner.expired}
            </p>
          </div>
          <Link
            href={buyUrl}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-bright-magenta text-white font-ui font-semibold text-xs hover:bg-bright-magenta/90 transition-colors shadow-sm"
          >
            {vi.trial.banner.buyButton}
          </Link>
        </div>
      </aside>
    )
  }

  return null
}
