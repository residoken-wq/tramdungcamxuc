'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PriceTag } from '@/components/ui/PriceTag'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { getToolUrl } from '@/lib/products'
import { createDigitalToolOrderAction } from '@/lib/payments/actions'

export interface DigitalToolCheckoutProduct {
  id: number
  name: string
  slug: string
  web: 'site' | 'habit' | 'eq'
  shortDescription?: string | null
  coverImage?: {
    url?: string | null
    alt?: string | null
  } | null
  price: number | null
  salePrice: number | null
  accessDurationDays?: number | null
}

interface DigitalToolCheckoutFormProps {
  product: DigitalToolCheckoutProduct
  alreadyActive?: boolean
  toolUrl?: string
}

export function DigitalToolCheckoutForm({
  product,
  alreadyActive = false,
  toolUrl,
}: DigitalToolCheckoutFormProps) {
  const router = useRouter()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isActiveAccess, setIsActiveAccess] = useState(alreadyActive)
  const [activeToolUrl, setActiveToolUrl] = useState(toolUrl)

  useEffect(() => {
    if (!alreadyActive) {
      track('checkout_started', { productSlug: product.slug })
    }
  }, [product.slug, alreadyActive])

  const isLifetime = !product.accessDurationDays || product.accessDurationDays <= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!termsAccepted) {
      setErrorMessage(vi.checkout.termsRequired)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await createDigitalToolOrderAction(product.slug, termsAccepted)

      if (res.unauthenticated) {
        router.push(
          `/tai-khoan/dang-nhap?next=${encodeURIComponent(`/thanh-toan?san-pham=${product.slug}`)}`,
        )
        return
      }

      if (res.alreadyActive) {
        setIsActiveAccess(true)
        setActiveToolUrl(res.toolUrl)
        setErrorMessage(res.error || vi.checkout.alreadyActiveMessage)
        setIsSubmitting(false)
        return
      }

      if (!res.success || !res.payToken) {
        setErrorMessage(res.error || vi.checkout.createOrderError)
        setIsSubmitting(false)
        return
      }

      router.push(`/thanh-toan/don/${res.payToken}`)
      // Không bật lại nút submit sau khi chuyển trang thành công
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg || vi.checkout.createOrderError)
      setIsSubmitting(false)
    }
  }

  if (isActiveAccess) {
    const directToolUrl = activeToolUrl || getToolUrl(product)

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-mint-haze shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-mint-haze rounded-full flex items-center justify-center mx-auto text-deep-navy text-xl">
          ✓
        </div>
        <h2 className="font-display text-2xl text-deep-navy">{product.name}</h2>
        <p className="font-sans text-sm text-deep-navy/80">{vi.checkout.alreadyActiveMessage}</p>
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => router.push(directToolUrl)}
          >
            {vi.checkout.openToolButton}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lavender-mist shadow-sm space-y-6">
      {/* Product Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-deep-navy/10">
        {product.coverImage?.url ? (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-lavender-mist/30 border border-lavender-mist">
            <Image
              src={product.coverImage.url}
              alt={product.coverImage.alt || product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-lavender-mist/50 flex items-center justify-center shrink-0 border border-lavender-mist text-bright-magenta font-bold text-2xl font-display">
            TDCX
          </div>
        )}

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-bright-magenta">
              {product.web === 'habit'
                ? vi.checkout.categories.habit
                : product.web === 'eq'
                  ? vi.checkout.categories.eq
                  : vi.checkout.categories.digital_tool}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isLifetime ? 'bg-mint-haze text-deep-navy' : 'bg-lavender-mist text-deep-navy'
              }`}
            >
              {isLifetime
                ? vi.checkout.lifetimeAccess
                : vi.checkout.durationDays(product.accessDurationDays!)}
            </span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl text-deep-navy break-words">
            {product.name}
          </h2>

          {product.shortDescription && (
            <p className="font-sans text-xs sm:text-sm text-deep-navy/70 line-clamp-2">
              {product.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Price Section */}
      <div className="flex items-baseline justify-between py-2 border-b border-deep-navy/10">
        <span className="font-ui text-sm font-semibold text-deep-navy">
          {vi.checkout.amountToPay}
        </span>
        <PriceTag originalPrice={product.price} salePrice={product.salePrice} size="lg" />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-soft-pink border border-accent-pink/30 text-xs sm:text-sm text-deep-navy"
        >
          {errorMessage}
        </div>
      )}

      {/* Form with Terms Checkbox and Submit */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 rounded-2xl bg-warm-ivory/60 border border-lavender-mist/70">
          <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-deep-navy/80">
            <input
              type="checkbox"
              id="terms-checkbox"
              name="termsAccepted"
              data-testid="checkout-terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked)
                if (errorMessage) setErrorMessage(null)
              }}
              className="mt-0.5 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-accent-pink accent-bright-magenta"
            />
            <span className="leading-relaxed">
              {vi.checkout.termsPrefix}{' '}
              <Link
                href="/dieu-khoan-su-dung"
                target="_blank"
                className="text-bright-magenta underline hover:text-accent-pink font-semibold"
              >
                {vi.checkout.termsLink}
              </Link>{' '}
              {vi.checkout.termsAnd}{' '}
              <Link
                href="/gia-thanh-toan"
                target="_blank"
                className="text-bright-magenta underline hover:text-accent-pink font-semibold"
              >
                {vi.checkout.pricingPolicyLink}
              </Link>
              .
            </span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          data-testid="checkout-submit-button"
          disabled={isSubmitting}
          className="w-full justify-center shadow-md shadow-accent-pink/20"
        >
          {isSubmitting ? vi.checkout.processing : vi.checkout.payButton}
        </Button>

        <p className="text-center text-xs text-deep-navy/60 font-sans">
          🔒 {vi.checkout.secureNotice}
        </p>
      </form>
    </div>
  )
}
