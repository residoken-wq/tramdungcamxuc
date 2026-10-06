import React from 'react'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  items?: FAQItem[]
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function FAQ({
  seriesLabel,
  titleLine1 = '[MẪU] CÂU HỎI THƯỜNG GẶP',
  titleLine2 = '[MẪU] GIẢI ĐÁP BĂN KHOĂN',
  items = [],
  bgColor = 'warm-ivory',
  padding = 'md',
}: FAQProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const validItems = Array.isArray(items)
    ? items.filter((item) => item && (item.question || item.answer))
    : []

  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  const questionColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const answerColorClass = isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'
  const iconColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12 flex flex-col items-center">
          {seriesLabel && (
            <span
              className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
            >
              {seriesLabel}
            </span>
          )}

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15]">
            <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
            <span className={titleLine2ColorClass}>{titleLine2}</span>
          </h2>
        </div>

        {/* FAQ Accordion Items */}
        <div className="space-y-4">
          {validItems.map((item, index) => (
            <details
              key={index}
              className={`group p-6 rounded-card border ${cardBgClass} transition-colors`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-ui text-base sm:text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md">
                <span className={questionColorClass}>{item.question}</span>
                <span
                  className={`shrink-0 transition-transform duration-200 group-open:rotate-180 ${iconColorClass}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </summary>
              <div
                className={`mt-4 pt-3 border-t ${isDeepNavy ? 'border-white/10' : 'border-deep-navy/10'} font-ui text-sm sm:text-base leading-relaxed ${answerColorClass}`}
              >
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
