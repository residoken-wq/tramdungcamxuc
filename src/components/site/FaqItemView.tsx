'use client'

import React, { useState, useId } from 'react'
import {
  fontSizeClass,
  textColorClass,
  type FontSizeOption,
  type TextColorOption,
} from '@/lib/brand/format-classes'

export interface FaqItemViewProps {
  version?: number
  question?: string
  answer?: string
  questionColor?: TextColorOption
  questionSize?: FontSizeOption
  answerColor?: TextColorOption
  answerSize?: FontSizeOption
  index?: number
  isDeepNavy?: boolean
  puck?: {
    isEditing?: boolean
  }
}

export function FaqItemView({
  question = '',
  answer = '',
  questionColor = 'deep-navy',
  questionSize = 'md',
  answerColor = 'deep-navy',
  answerSize = 'md',
  index,
  isDeepNavy = false,
  puck,
}: FaqItemViewProps) {
  const isEditing = Boolean(puck?.isEditing)
  const [isOpen, setIsOpen] = useState(false)
  const instanceId = useId()
  const questionId = `faq-q-${instanceId}`
  const answerId = `faq-a-${instanceId}`

  if (!question && !answer && !isEditing) {
    return null
  }

  const questionSizeClass = fontSizeClass('faq-question', questionSize)
  const answerSizeClass = fontSizeClass('faq-answer', answerSize)

  const questionColorClass =
    questionColor && questionColor !== 'deep-navy'
      ? textColorClass(questionColor)
      : isDeepNavy
        ? 'text-white'
        : 'text-deep-navy group-data-[bg=deep-navy]/faq:text-white'

  const answerColorClass =
    answerColor && answerColor !== 'deep-navy'
      ? answerColor === 'white'
        ? 'text-white/85'
        : textColorClass(answerColor)
      : isDeepNavy
        ? 'text-white/85'
        : 'text-deep-navy/80 group-data-[bg=deep-navy]/faq:text-white/85'

  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft group-data-[bg=deep-navy]/faq:bg-white/10 group-data-[bg=deep-navy]/faq:border-white/20 group-data-[bg=deep-navy]/faq:text-white group-data-[bg=deep-navy]/faq:shadow-none'

  return (
    <div
      className={`p-5 sm:p-6 rounded-card border ${cardBgClass} transition-colors [counter-increment:faq-counter]`}
    >
      <button
        type="button"
        id={questionId}
        aria-expanded={isOpen}
        aria-controls={answerId}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 text-left font-ui font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1 min-w-0">
          <span className="hidden group-data-[numbered=true]/faq:inline-block font-display text-lg text-bright-magenta group-data-[bg=deep-navy]/faq:text-soft-pink select-none shrink-0 mr-3">
            {index !== undefined ? (
              `${String(index + 1).padStart(2, '0')}.`
            ) : (
              <span className="before:content-[counter(faq-counter,_decimal-leading-zero)_'._']" />
            )}
          </span>
          <span className={`${questionSizeClass} ${questionColorClass} break-words`}>
            {question || (isEditing ? <span className="italic opacity-60">[Nhập câu hỏi]</span> : '')}
          </span>
        </span>
        <span
          className={`shrink-0 transition-transform duration-200 ${
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

      <div
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        hidden={!isOpen}
        className={`mt-4 pt-3 border-t border-deep-navy/10 group-data-[bg=deep-navy]/faq:border-white/10 font-ui leading-relaxed whitespace-pre-line ${answerSizeClass} ${answerColorClass}`}
      >
        {answer ||
          (isEditing ? <span className="italic opacity-50">[Nhập câu trả lời chi tiết]</span> : '')}
      </div>
    </div>
  )
}
