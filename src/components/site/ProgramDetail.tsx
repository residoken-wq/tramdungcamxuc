import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import type { PublicProgram } from '@/lib/detail-pages'

export function ProgramDetail({ program }: { program: PublicProgram }) {
  const hasLearnerGroup = Boolean(program.learnerGroup)
  const hasFormat = Boolean(program.format)
  const hasDuration = Boolean(program.duration)
  const hasTargetBehaviors = program.targetBehaviors.length > 0
  const hasDeliverables = program.deliverables.length > 0
  const hasFollowUp = Boolean(program.followUp)
  const hasMeasurement = Boolean(program.measurement)
  const hasCaseStudies = program.caseStudies.length > 0
  const hasInfo = hasFormat || hasDuration

  const ctaButtonLabel = program.ctaLabel || vi.detail.program.sendBrief

  return (
    <article className="w-full bg-warm-ivory py-10 sm:py-16 min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Điều hướng quay lại */}
        <div className="mb-6">
          <Link
            href="/doanh-nghiep"
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

        {/* Tiêu đề & Nhóm người học */}
        <header className="mb-10 sm:mb-12">
          <span className="font-ui font-bold text-xs uppercase tracking-widest text-bright-magenta mb-3 block">
            {vi.status.consult}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-deep-navy mb-4 leading-[1.15]">
            {program.name}
          </h1>
          {hasLearnerGroup && (
            <p className="font-sans text-base sm:text-lg text-deep-navy/85 max-w-3xl leading-relaxed">
              <span className="font-semibold text-deep-navy">
                {vi.detail.program.sections.learnerGroup}:
              </span>{' '}
              {program.learnerGroup}
            </p>
          )}

          {/* Thanh thông tin nhanh: Hình thức & Thời lượng */}
          {hasInfo && (
            <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-deep-navy/10">
              {hasFormat && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lavender-mist/40 border border-deep-navy/10 text-deep-navy font-ui text-sm">
                  <span className="font-bold text-deep-navy/70">
                    {vi.detail.program.sections.format}:
                  </span>
                  <span className="font-medium">{program.format}</span>
                </div>
              )}
              {hasDuration && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-soft-pink/50 border border-deep-navy/10 text-deep-navy font-ui text-sm">
                  <span className="font-bold text-deep-navy/70">
                    {vi.detail.program.sections.duration}:
                  </span>
                  <span className="font-medium">{program.duration}</span>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Các mục nội dung chính */}
        <div className="space-y-10 sm:space-y-12">
          {/* Hành vi mục tiêu */}
          {hasTargetBehaviors && (
            <section aria-label={vi.detail.program.sections.targetBehaviors}>
              <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-4">
                {vi.detail.program.sections.targetBehaviors}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {program.targetBehaviors.map((behavior, idx) => (
                  <Card
                    key={idx}
                    variant="white"
                    className="p-5 flex items-start gap-3 border border-deep-navy/10 shadow-sm"
                  >
                    <span
                      className="mt-1 w-2.5 h-2.5 rounded-full bg-bright-magenta flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-sans text-sm sm:text-base text-deep-navy leading-relaxed">
                      {behavior}
                    </span>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Sản phẩm bàn giao */}
          {hasDeliverables && (
            <section aria-label={vi.detail.program.sections.deliverables}>
              <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-4">
                {vi.detail.program.sections.deliverables}
              </h2>
              <ul className="space-y-3">
                {program.deliverables.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-xl bg-mint-haze/30 border border-deep-navy/10 shadow-sm"
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
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Theo dõi sau chương trình & Đo lường */}
          {(hasFollowUp || hasMeasurement) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {hasFollowUp && (
                <section aria-label={vi.detail.program.sections.followUp}>
                  <Card
                    variant="white"
                    className="p-6 sm:p-8 h-full border border-deep-navy/10 shadow-sm"
                  >
                    <h2 className="font-ui font-bold text-lg sm:text-xl text-deep-navy mb-3">
                      {vi.detail.program.sections.followUp}
                    </h2>
                    <p className="font-sans text-sm sm:text-base text-deep-navy/85 leading-relaxed whitespace-pre-line">
                      {program.followUp}
                    </p>
                  </Card>
                </section>
              )}

              {hasMeasurement && (
                <section aria-label={vi.detail.program.sections.measurement}>
                  <Card
                    variant="white"
                    className="p-6 sm:p-8 h-full border border-deep-navy/10 shadow-sm"
                  >
                    <h2 className="font-ui font-bold text-lg sm:text-xl text-deep-navy mb-3">
                      {vi.detail.program.sections.measurement}
                    </h2>
                    <p className="font-sans text-sm sm:text-base text-deep-navy/85 leading-relaxed whitespace-pre-line">
                      {program.measurement}
                    </p>
                  </Card>
                </section>
              )}
            </div>
          )}

          {/* Case study / Câu chuyện thực tế */}
          {hasCaseStudies && (
            <section aria-label={vi.detail.program.sections.caseStudies}>
              <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy mb-4">
                {vi.detail.program.sections.caseStudies}
              </h2>
              <div className="space-y-4">
                {program.caseStudies.map((study, idx) => (
                  <Card
                    key={idx}
                    variant="soft-pink"
                    className="p-6 border border-deep-navy/10 shadow-sm"
                  >
                    <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
                      {study}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Nút hành động cuối trang: Dẫn về form brief B2B */}
          <div className="pt-8 border-t border-deep-navy/15 text-center flex flex-col items-center">
            <Button
              href="/doanh-nghiep#gui-brief"
              variant="primary"
              size="lg"
              className="min-w-[260px] justify-center"
            >
              {ctaButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
