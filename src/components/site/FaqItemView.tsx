'use client'

import React, { useState, useId } from 'react'
import { useFaqIconStyle, useFaqVariant, type FaqVariant } from './faq-style-context'
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
  highlight?: boolean
  variant?: FaqVariant
  index?: number
  isDeepNavy?: boolean
  iconStyle?: 'chevron' | 'plusminus'
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
  highlight = false,
  variant: ownVariant,
  index,
  isDeepNavy = false,
  iconStyle: ownIconStyle,
  puck,
}: FaqItemViewProps) {
  const iconStyle = useFaqIconStyle(ownIconStyle)
  const variant = useFaqVariant(ownVariant)
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

  // Biến thể Cards (tr. 21)
  if (variant === 'cards') {
    const isHighlight = Boolean(highlight)
    const cardClass = isHighlight
      ? 'bg-deep-navy text-white border-white/20 shadow-soft'
      : isDeepNavy
        ? 'bg-white/10 text-white border-white/20'
        : 'bg-white text-deep-navy border-deep-navy/10 shadow-soft'

    return (
      <div
        data-eb-card=""
        data-eb-card-solid={isHighlight ? '' : undefined}
        className={`p-6 sm:p-7 rounded-2xl border ${cardClass} transition-all [counter-increment:faq-counter] flex flex-col justify-between h-full`}
      >
        <div>
          <div className="mb-3 font-display text-3xl sm:text-4xl text-accent-pink leading-none select-none">
            {index !== undefined ? (
              String(index + 1).padStart(2, '0')
            ) : (
              <span className="before:content-[counter(faq-counter,_decimal-leading-zero)]" />
            )}
          </div>
          <h3
            className={`font-ui ${questionSizeClass} font-bold leading-snug break-words ${
              isHighlight || isDeepNavy ? 'text-white' : 'text-deep-navy'
            }`}
          >
            {question ||
              (isEditing ? <span className="italic opacity-60">[Nhập câu hỏi]</span> : '')}
          </h3>
          <div
            className={`h-px w-full my-4 ${
              isHighlight || isDeepNavy ? 'bg-white/15' : 'bg-deep-navy/10'
            }`}
          />
          <p
            className={`font-ui ${answerSizeClass} leading-relaxed whitespace-pre-line ${
              isHighlight || isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'
            }`}
          >
            {answer ||
              (isEditing ? (
                <span className="italic opacity-50">[Nhập câu trả lời chi tiết]</span>
              ) : (
                ''
              ))}
          </p>
        </div>
      </div>
    )
  }

  // Biến thể Quick (tr. 61)
  if (variant === 'quick') {
    return (
      <div
        data-eb-card=""
        className={`p-4 sm:p-5 rounded-xl border ${cardBgClass} transition-all [counter-increment:faq-counter]`}
      >
        <button
          type="button"
          id={questionId}
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={() => setIsOpen(!isOpen)}
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
                {question ||
                  (isEditing ? <span className="italic opacity-60">[Nhập câu hỏi]</span> : '')}
              </h3>
              {!isOpen && answer && (
                <p className="mt-1 line-clamp-1 font-ui text-xs sm:text-sm text-deep-navy/70 group-data-[bg=deep-navy]/faq:text-white/70">
                  {answer}
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
            className={`mt-3 pt-3 border-t border-deep-navy/10 group-data-[bg=deep-navy]/faq:border-white/10 font-ui text-sm sm:text-base leading-relaxed whitespace-pre-line pl-5 sm:pl-6 ${answerColorClass}`}
          >
            {answer ||
              (isEditing ? (
                <span className="italic opacity-50">[Nhập câu trả lời chi tiết]</span>
              ) : (
                ''
              ))}
          </div>
        )}
      </div>
    )
  }

  // Biến thể Mặc định: Accordion
  const activeQuestionColorClass =
    isOpen && iconStyle === 'plusminus'
      ? isDeepNavy
        ? 'text-soft-pink'
        : 'text-bright-magenta group-data-[bg=deep-navy]/faq:text-soft-pink'
      : questionColorClass

  return (
    <div
      data-eb-card=""
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
        <span className="flex items-center gap-3 min-w-0">
          <span className="hidden group-data-[numbered=true]/faq:inline-block font-display text-lg text-bright-magenta group-data-[bg=deep-navy]/faq:text-soft-pink select-none shrink-0">
            {index !== undefined ? (
              `${String(index + 1).padStart(2, '0')}.`
            ) : (
              <span className="before:content-[counter(faq-counter,_decimal-leading-zero)_'.']" />
            )}
          </span>
          <span className={`${questionSizeClass} ${activeQuestionColorClass} break-words`}>
            {question ||
              (isEditing ? <span className="italic opacity-60">[Nhập câu hỏi]</span> : '')}
          </span>
        </span>
        <span
          className={`shrink-0 ${
            iconStyle === 'chevron'
              ? `transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`
              : ''
          } text-bright-magenta group-data-[bg=deep-navy]/faq:text-soft-pink`}
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
        className={`mt-4 pt-3 border-t border-deep-navy/10 group-data-[bg=deep-navy]/faq:border-white/10 font-ui leading-relaxed whitespace-pre-line ${answerSizeClass} ${answerColorClass}`}
      >
        {answer ||
          (isEditing ? <span className="italic opacity-50">[Nhập câu trả lời chi tiết]</span> : '')}
      </div>
    </div>
  )
}
