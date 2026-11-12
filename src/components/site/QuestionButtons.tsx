import React from 'react'
import Link from 'next/link'
import { safeHref } from '@/lib/safe-href'
import { isDarkBrandBg } from '@/lib/brand/format-classes'
import { ExperienceBookingButton } from '@/components/site/ExperienceBookingButton'
import { textTarget } from '@/puck/style/text-target'
import type { PublicProduct } from '@/lib/products'

export interface QuestionButtonActionItem {
  [key: string]: any
  text: string
  action?: 'link' | 'booking'
  linkType?: 'url' | 'page'
  pageId?: string | number
  url?: string
  variant?: 'solid' | 'outline'
}

export interface QuestionButtonsProps {
  version?: number
  question?: string
  buttons?: QuestionButtonActionItem[]
  bgColor?:
    | 'bright-magenta'
    | 'deep-navy'
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    bookingProduct?: PublicProduct | null
    bookingProductId?: number | null
    pageUrls?: Record<string, string>
    pageSlug?: string | null
  }
}

const BG_COLORS: Record<string, string> = {
  'bright-magenta': 'bg-bright-magenta',
  'deep-navy': 'bg-deep-navy',
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
}

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 sm:py-14 px-6 sm:px-8',
  lg: 'py-16 sm:py-20 px-6 sm:px-12',
} as const

export function QuestionButtons({
  id,
  question,
  buttons = [],
  bgColor = 'bright-magenta',
  padding = 'md',
  _resolved,
}: QuestionButtonsProps & { id?: string }) {
  const isDark = isDarkBrandBg(bgColor)
  const hasQuestion = Boolean(
    question && (typeof question === 'string' ? question.trim().length > 0 : true),
  )

  const activeButtons = Array.isArray(buttons)
    ? buttons.filter((b) => b && typeof b.text === 'string' && b.text.trim().length > 0).slice(0, 3)
    : []

  const bgClass = BG_COLORS[bgColor] ?? 'bg-bright-magenta'
  const paddingClass = PADDINGS[padding] ?? PADDINGS.md

  return (
    <section
      id={id}
      data-question-buttons=""
      className={`w-full ${bgClass} ${paddingClass} transition-colors`}
    >
      <div className="mx-auto max-w-4xl flex flex-col items-center text-center">
        {hasQuestion && (
          <p
            {...textTarget(id, 'question')}
            className={`font-quote text-xl sm:text-2xl lg:text-3xl italic text-center max-w-3xl leading-relaxed ${
              isDark ? 'text-white' : 'text-deep-navy'
            }`}
          >
            {question}
          </p>
        )}

        {activeButtons.length > 0 && (
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto ${
              hasQuestion ? 'mt-6 sm:mt-8' : ''
            }`}
          >
            {activeButtons.map((btn, index) => {
              const isOutline = btn.variant === 'outline'

              let buttonStyleClass = ''
              if (isDark) {
                if (isOutline) {
                  buttonStyleClass =
                    'border-2 border-white text-white bg-transparent hover:bg-white/10 active:bg-white/20 focus-visible:outline-white'
                } else if (bgColor === 'deep-navy') {
                  buttonStyleClass =
                    '!bg-bright-magenta !text-white hover:opacity-95 active:opacity-90 shadow-sm focus-visible:outline-white'
                } else {
                  // e.g. bright-magenta: dark solid button is deep-navy
                  buttonStyleClass =
                    '!bg-deep-navy !text-white hover:bg-deep-navy/90 active:bg-deep-navy/95 shadow-sm focus-visible:outline-white'
                }
              } else {
                if (isOutline) {
                  buttonStyleClass =
                    'border-2 border-deep-navy text-deep-navy bg-transparent hover:bg-deep-navy/5 active:bg-deep-navy/10 focus-visible:outline-deep-navy'
                } else {
                  buttonStyleClass =
                    '!bg-bright-magenta !text-white hover:opacity-95 active:opacity-90 shadow-sm focus-visible:outline-deep-navy'
                }
              }

              const commonButtonClass = `inline-flex items-center justify-center min-h-[44px] sm:min-h-[48px] px-6 py-3 text-base sm:text-lg font-bold font-ui rounded-xl transition-all duration-150 select-none w-full sm:w-auto text-center focus-visible:outline-2 focus-visible:outline-offset-2 ${buttonStyleClass}`

              if (btn.action === 'booking') {
                return (
                  <ExperienceBookingButton
                    key={`qbtn-${index}`}
                    product={_resolved?.bookingProduct}
                    productId={_resolved?.bookingProductId}
                    buttonText={btn.text}
                    showPrice={true}
                    pageSlug={_resolved?.pageSlug ?? undefined}
                    className={commonButtonClass}
                  />
                )
              }

              let resolvedHref = btn.url || '#'
              if (btn.linkType === 'page' && btn.pageId) {
                resolvedHref = _resolved?.pageUrls?.[String(btn.pageId)] || btn.url || '#'
              }

              const safeLink = safeHref(resolvedHref) || '#'

              return (
                <Link
                  key={`qbtn-${index}`}
                  href={safeLink}
                  className={commonButtonClass}
                >
                  {btn.text}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
