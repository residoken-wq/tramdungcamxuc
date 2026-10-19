import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TestimonialCard } from '@/components/site/TestimonialCard'
import { vi } from '@/lib/i18n/vi'
import type { PublicService } from '@/lib/detail-pages'
import { PATHS } from '@/lib/paths'

export function ServiceDetail({ service }: { service: PublicService }) {
  const hasAudience = Boolean(service.audience)
  const hasSituations = service.situations.length > 0
  const hasOutcomes = service.outcomes.length > 0
  const hasProcess = service.process.length > 0
  const hasTestimonials = service.testimonials.length > 0
  const hasInfo = Boolean(
    service.duration || service.format || service.displayPrice || service.bookingUrl,
  )

  const bookingLabel = service.ctaLabel || vi.detail.service.defaultBookingLabel

  return (
    <article className="w-full bg-warm-ivory py-10 sm:py-16 min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Điều hướng quay lại */}
        <div className="mb-6">
          <Link
            href={PATHS.coaching}
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

        {/* Tiêu đề & Thông tin mở đầu */}
        <header className="mb-10 sm:mb-12">
          <span className="font-ui font-bold text-xs uppercase tracking-widest text-bright-magenta mb-3 block">
            {vi.status.consult}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-deep-navy mb-4 leading-[1.15]">
            {service.name}
          </h1>
          {hasAudience && (
            <p className="font-sans text-base sm:text-lg text-deep-navy/85 max-w-3xl leading-relaxed">
              <span className="font-semibold text-deep-navy">
                {vi.detail.service.sections.audience}:
              </span>{' '}
              {service.audience}
            </p>
          )}
        </header>

        {/* Bố cục nội dung chính và thẻ thông tin tóm tắt */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start mb-14">
          {/* Cột trái: Chi tiết nội dung */}
          <div className="lg:col-span-2 space-y-10 sm:space-y-12">
            {/* Tình huống phù hợp */}
            {hasSituations && (
              <section aria-label={vi.detail.service.sections.situations}>
                <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-4">
                  {vi.detail.service.sections.situations}
                </h2>
                <ul className="space-y-3">
                  {service.situations.map((situation, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/80 border border-deep-navy/10 shadow-sm"
                    >
                      <span
                        className="mt-1 w-2 h-2 rounded-full bg-bright-magenta flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-sans text-sm sm:text-base text-deep-navy leading-relaxed">
                        {situation}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Kết quả mong đợi */}
            {hasOutcomes && (
              <section aria-label={vi.detail.service.sections.outcomes}>
                <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-4">
                  {vi.detail.service.sections.outcomes}
                </h2>
                <ul className="space-y-3">
                  {service.outcomes.map((outcome, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-xl bg-mint-haze/30 border border-deep-navy/10 shadow-sm"
                    >
                      <svg
                        className="w-5 h-5 text-bright-magenta flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-sans text-sm sm:text-base text-deep-navy leading-relaxed">
                        {outcome}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Quy trình dạng bước */}
            {hasProcess && (
              <section aria-label={vi.detail.service.sections.process}>
                <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-6">
                  {vi.detail.service.sections.process}
                </h2>
                <ol className="space-y-4">
                  {service.process.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-deep-navy/10 shadow-sm"
                    >
                      <span
                        className="w-8 h-8 rounded-full bg-soft-pink text-deep-navy font-ui font-bold text-sm flex items-center justify-center flex-shrink-0 border border-deep-navy/15"
                        aria-hidden="true"
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 pt-1">
                        <span className="font-sans text-sm sm:text-base text-deep-navy leading-relaxed block">
                          {step}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Cột phải: Thẻ tóm tắt & Nút đặt lịch */}
          {hasInfo && (
            <aside className="lg:col-span-1">
              <Card
                variant="white"
                className="p-6 sm:p-8 space-y-6 sticky top-24 border border-deep-navy/10 shadow-sm"
              >
                <h2 className="font-ui font-bold text-lg text-deep-navy border-b border-deep-navy/10 pb-3">
                  {vi.detail.service.sections.info}
                </h2>

                <div className="space-y-4 font-ui text-sm sm:text-base text-deep-navy">
                  {service.duration && (
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-bold text-deep-navy/60">
                        {vi.detail.service.sections.duration}
                      </span>
                      <span className="font-medium text-deep-navy mt-0.5">{service.duration}</span>
                    </div>
                  )}

                  {service.format && (
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-bold text-deep-navy/60">
                        {vi.detail.service.sections.format}
                      </span>
                      <span className="font-medium text-deep-navy mt-0.5">{service.format}</span>
                    </div>
                  )}

                  {service.displayPrice && (
                    <div className="flex flex-col pt-2 border-t border-deep-navy/10">
                      <span className="text-xs uppercase font-bold text-deep-navy/60">
                        {vi.detail.service.sections.price}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-bright-magenta tracking-tight mt-0.5">
                        {service.displayPrice}
                      </span>
                    </div>
                  )}
                </div>

                {service.bookingUrl && (
                  <div className="pt-2">
                    <Button
                      href={service.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="primary"
                      size="lg"
                      className="w-full justify-center"
                    >
                      {bookingLabel}
                    </Button>
                  </div>
                )}
              </Card>
            </aside>
          )}
        </div>

        {/* Lời chia sẻ từ người đồng hành */}
        {hasTestimonials && (
          <section
            aria-label={vi.detail.service.sections.testimonials}
            className="pt-10 border-t border-deep-navy/15"
          >
            <h2 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy mb-8 text-center">
              {vi.detail.service.sections.testimonials}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {service.testimonials.map((t) => (
                <TestimonialCard
                  key={t.id}
                  quote={t.quote}
                  name={t.name}
                  role={t.role || undefined}
                  photo={t.photo || undefined}
                  consent={t.consent}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
