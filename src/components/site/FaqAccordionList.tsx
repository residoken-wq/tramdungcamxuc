'use client'

import React, { useState } from 'react'
import { useClientFaqs } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'
import type { FaqVariant } from './faq-style-context'

export interface FAQItem {
  question: string
  answer: string
  highlight?: boolean
}

export interface FaqAccordionListProps {
  items?: FAQItem[]
  source?: 'manual' | 'group'
  group?: string
  limit?: number
  initialGroupItems?: FAQItem[] | null
  isEditing?: boolean
  numbered?: boolean
  isDeepNavy?: boolean
  iconStyle?: 'chevron' | 'plusminus'
  variant?: FaqVariant
  cardBgClass?: string
  questionColorClass?: string
  answerColorClass?: string
  iconColorClass?: string
  answerWhitespaceClass?: string
}

export function FaqAccordionList({
  items = [],
  source = 'manual',
  group = 'general',
  limit = 5,
  initialGroupItems,
  isEditing = false,
  numbered = false,
  isDeepNavy = false,
  iconStyle = 'chevron',
  variant = 'accordion',
  cardBgClass = 'bg-white border-deep-navy/10 text-deep-navy shadow-soft',
  questionColorClass = 'text-deep-navy',
  answerColorClass = 'text-deep-navy/80',
  iconColorClass = 'text-bright-magenta',
  answerWhitespaceClass = '',
}: FaqAccordionListProps) {
  const isGroupSource = source === 'group'

  const { items: clientItems } = useClientFaqs({
    group,
    limit,
    initialItems: initialGroupItems !== undefined ? (initialGroupItems ?? []) : undefined,
  })

  const activeItems = isGroupSource
    ? clientItems && clientItems.length > 0
      ? clientItems
      : items && items.length > 0
        ? items
        : clientItems
    : items || []

  const validItems = Array.isArray(activeItems)
    ? activeItems.filter((item) => item && (item.question || item.answer))
    : []

  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({})

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  if (isGroupSource && validItems.length === 0) {
    if (isEditing) {
      return (
        <div className="p-6 rounded-card border border-dashed border-deep-navy/30 text-center font-ui text-sm text-deep-navy/70">
          {vi.sm06.faq.editorEmptyGroup}
        </div>
      )
    }
    return null
  }

  if (validItems.length === 0) {
    return null
  }

  // Biến thể Cards (tr. 21)
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {validItems.map((item, index) => {
          const isHighlight = 'highlight' in item && Boolean(item.highlight)
          const cardClass = isHighlight
            ? 'bg-deep-navy text-white border-white/20 shadow-soft'
            : isDeepNavy
              ? 'bg-white/10 text-white border-white/20'
              : 'bg-white text-deep-navy border-deep-navy/10 shadow-soft'

          return (
            <div
              key={index}
              data-eb-card=""
              data-eb-card-solid={isHighlight ? '' : undefined}
              className={`p-6 sm:p-7 rounded-2xl border ${cardClass} transition-all flex flex-col justify-between h-full`}
            >
              <div>
                <div className="mb-3 font-display text-3xl sm:text-4xl text-accent-pink leading-none select-none">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3
                  className={`font-ui font-bold text-lg sm:text-xl leading-snug break-words ${
                    isHighlight || isDeepNavy ? 'text-white' : 'text-deep-navy'
                  }`}
                >
                  {item.question}
                </h3>
                <div
                  className={`h-px w-full my-4 ${
                    isHighlight || isDeepNavy ? 'bg-white/15' : 'bg-deep-navy/10'
                  }`}
                />
                <p
                  className={`font-ui text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                    isHighlight || isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'
                  }`}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Biến thể Quick (tr. 61)
  if (variant === 'quick') {
    return (
      <div className="space-y-3">
        {validItems.map((item, index) => {
          const isOpen = Boolean(openIndices[index])
          const questionId = `faq-q-${index}`
          const answerId = `faq-a-${index}`

          return (
            <div
              key={index}
              data-eb-card=""
              className={`p-4 sm:p-5 rounded-xl border ${cardBgClass} transition-all`}
            >
              <button
                type="button"
                id={questionId}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggleItem(index)}
                className="w-full flex items-start justify-between gap-4 text-left font-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 rounded-sm bg-accent-pink shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`font-ui font-bold text-base sm:text-lg leading-snug break-words ${questionColorClass}`}
                    >
                      {item.question}
                    </h3>
                    {!isOpen && item.answer && (
                      <p className="mt-1 line-clamp-1 font-ui text-xs sm:text-sm text-deep-navy/70 group-data-[bg=deep-navy]/faq:text-white/70">
                        {item.answer}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 mt-1 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  } text-bright-magenta group-data-[bg=deep-navy]/faq:text-soft-pink`}
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
              </button>

              {isOpen && (
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className={`mt-3 pt-3 border-t border-deep-navy/10 group-data-[bg=deep-navy]/faq:border-white/10 font-ui text-sm sm:text-base leading-relaxed pl-5 sm:pl-6 ${answerColorClass}${answerWhitespaceClass}`}
                >
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Biến thể Mặc định: Accordion
  return (
    <div className="space-y-4">
      {validItems.map((item, index) => {
        const isOpen = Boolean(openIndices[index])
        const questionId = `faq-q-${index}`
        const answerId = `faq-a-${index}`

        const activeQuestionColor =
          isOpen && iconStyle === 'plusminus'
            ? isDeepNavy
              ? 'text-soft-pink'
              : 'text-bright-magenta'
            : questionColorClass

        return (
          <div
            key={index}
            data-eb-card=""
            className={`p-5 sm:p-6 rounded-card border ${cardBgClass} transition-colors`}
          >
            <button
              type="button"
              id={questionId}
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between gap-4 text-left font-ui text-base sm:text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                {numbered && (
                  <span className="font-display text-lg text-bright-magenta select-none shrink-0">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                )}
                <span className={activeQuestionColor}>{item.question}</span>
              </span>
              <span
                className={`shrink-0 ${
                  iconStyle === 'chevron'
                    ? `transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`
                    : ''
                } ${iconColorClass}`}
              >
                {iconStyle === 'plusminus' ? (
                  isOpen ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10H16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 4V16M4 10H16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )
                ) : (
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
                )}
              </span>
            </button>

            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              hidden={!isOpen}
              className={`mt-4 pt-3 border-t border-deep-navy/10 font-ui text-sm sm:text-base leading-relaxed ${answerColorClass}${answerWhitespaceClass}`}
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
