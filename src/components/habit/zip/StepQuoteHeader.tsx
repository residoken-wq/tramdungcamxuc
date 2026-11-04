'use client'

import React from 'react'

export interface StepQuoteHeaderProps {
  subtitle?: string
  stage?: string
  title?: string
  quote: string
  author?: string
  description?: React.ReactNode
}

export function StepQuoteHeader({
  subtitle,
  stage,
  title,
  quote,
  author,
  description,
}: StepQuoteHeaderProps) {
  // Tách câu trích dẫn và phần nguồn nếu có để hiển thị thanh lịch
  let quoteBody = quote
  let sourceText = author ? author : ''

  if (!sourceText) {
    const sourceIndex = quote.lastIndexOf('(Nguồn:')
    if (sourceIndex !== -1) {
      quoteBody = quote.slice(0, sourceIndex).trim()
      const rawSource = quote
        .slice(sourceIndex)
        .replace(/^\(Nguồn:\s*/i, '')
        .replace(/\)$/, '')
        .trim()
      sourceText = `— ${rawSource} —`
    }
  }

  const stageText = stage || subtitle

  return (
    <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-lavender-mist shadow-soft text-center relative overflow-hidden mb-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-bright-magenta to-accent-pink" />
      {stageText && (
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold uppercase tracking-wider mb-2 font-ui">
          <span>{stageText}</span>
        </div>
      )}
      {title && (
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy uppercase tracking-wide mb-3">
          {title.includes('|') ? (
            <>
              <span className="block text-deep-navy">{title.split('|')[0].trim()}</span>
              <span className="block text-bright-magenta">{title.split('|')[1].trim()}</span>
            </>
          ) : (
            title
          )}
        </h2>
      )}
      <blockquote className="font-quote italic text-base sm:text-lg md:text-xl text-deep-navy max-w-2xl mx-auto leading-relaxed">
        {quoteBody}
      </blockquote>
      {sourceText && (
        <p className="mt-2.5 font-ui font-semibold text-xs sm:text-sm text-bright-magenta tracking-wide">
          {sourceText}
        </p>
      )}
      {description && (
        <div className="mt-3 text-xs sm:text-sm text-deep-navy/70 font-ui">{description}</div>
      )}
    </div>
  )
}
