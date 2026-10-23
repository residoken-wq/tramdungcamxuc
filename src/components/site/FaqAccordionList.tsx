'use client'

import React, { useState } from 'react'
import { useClientFaqs } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'

export interface FAQItem {
  question: string
  answer: string
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

  // When source === 'group', use resolved items (from SSR) or client preview items (in Puck editor),
  // falling back to prop items if explicitly provided.
  // When source === 'manual', use items prop.
  const activeItems: FAQItem[] = isGroupSource
    ? initialGroupItems !== undefined && initialGroupItems !== null
      ? initialGroupItems
      : isEditing
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

  return (
    <div className="space-y-4">
      {validItems.map((item, index) => {
        const isOpen = Boolean(openIndices[index])
        const questionId = `faq-q-${index}`
        const answerId = `faq-a-${index}`

        return (
          <div
            key={index}
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
                <span className={questionColorClass}>{item.question}</span>
              </span>
              <span
                className={`shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                } ${iconColorClass}`}
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
            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              hidden={!isOpen}
              className={`mt-4 pt-3 border-t ${
                isDeepNavy ? 'border-white/10' : 'border-deep-navy/10'
              } font-ui text-sm sm:text-base leading-relaxed ${answerColorClass}${answerWhitespaceClass}`}
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
