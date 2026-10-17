'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'

interface IncludeItem {
  text: string
}

interface FaqItem {
  question: string
  answer: string
}

interface Step4ContentProps {
  includes?: IncludeItem[] | null
  painPoint?: string | null
  outcome?: string | null
  faq?: FaqItem[] | null
  onChange: (fields: {
    includes?: IncludeItem[] | null
    painPoint?: string | null
    outcome?: string | null
    faq?: FaqItem[] | null
  }) => void
}

export function Step4Content({
  includes,
  painPoint,
  outcome,
  faq,
  onChange,
}: Step4ContentProps) {
  // Quản lý Includes
  const handleAddInclude = () => {
    const current = includes ? [...includes] : []
    current.push({ text: '' })
    onChange({ includes: current })
  }

  const handleRemoveInclude = (index: number) => {
    if (!includes) return
    const updated = includes.filter((_, i) => i !== index)
    onChange({ includes: updated })
  }

  const handleUpdateInclude = (index: number, text: string) => {
    if (!includes) return
    const updated = includes.map((item, i) => (i === index ? { text } : item))
    onChange({ includes: updated })
  }

  // Quản lý FAQ
  const handleAddFaq = () => {
    const current = faq ? [...faq] : []
    current.push({ question: '', answer: '' })
    onChange({ faq: current })
  }

  const handleRemoveFaq = (index: number) => {
    if (!faq) return
    const updated = faq.filter((_, i) => i !== index)
    onChange({ faq: updated })
  }

  const handleUpdateFaq = (
    index: number,
    field: 'question' | 'answer',
    value: string,
  ) => {
    if (!faq) return
    const updated = faq.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    )
    onChange({ faq: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-ui text-lg font-bold text-deep-navy">
          {vi.cms.wizard.steps.step4.title}
        </h2>
        <p className="text-sm text-deep-navy/70">
          {vi.cms.wizard.steps.step4.description}
        </p>
      </div>

      <div className="space-y-6">
        {/* Khó khăn (painPoint) & Kết quả (outcome) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.painPoint}
            </label>
            <textarea
              rows={3}
              value={painPoint || ''}
              onChange={(e) => onChange({ painPoint: e.target.value })}
              placeholder={vi.cms.wizard.labels.painPointPlaceholder}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.painPoint}
            </p>
          </div>

          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.outcome}
            </label>
            <textarea
              rows={3}
              value={outcome || ''}
              onChange={(e) => onChange({ outcome: e.target.value })}
              placeholder={vi.cms.wizard.labels.outcomePlaceholder}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.outcome}
            </p>
          </div>
        </div>

        {/* Danh sách cấu phần "Bao gồm" */}
        <div className="rounded-2xl border border-lavender-mist bg-soft-pink/20 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-ui text-base font-bold text-deep-navy">
                {vi.cms.wizard.labels.includesTitle}
              </h3>
              <p className="text-xs text-deep-navy/70">
                {vi.cms.productForm.descriptions.includes}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddInclude}
              className="inline-flex items-center gap-1.5 rounded-xl bg-bright-magenta px-3.5 py-1.5 font-ui text-xs font-bold text-white shadow-sm hover:bg-accent-pink transition-all"
            >
              + {vi.cms.wizard.buttons.addInclude}
            </button>
          </div>

          {(!includes || includes.length === 0) && (
            <div className="rounded-xl border border-dashed border-lavender-mist bg-white p-4 text-center text-xs text-deep-navy/60">
              Chưa có mục nào. Nhấn <strong>"Thêm mục"</strong> để liệt kê những gì khách nhận được.
            </div>
          )}

          {includes && includes.length > 0 && (
            <div className="space-y-2">
              {includes.map((inc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-bright-magenta">✓</span>
                  <input
                    type="text"
                    value={inc.text}
                    onChange={(e) => handleUpdateInclude(idx, e.target.value)}
                    placeholder={vi.cms.wizard.labels.includesPlaceholder}
                    className="flex-1 rounded-lg border border-lavender-mist bg-white px-3 py-2 text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInclude(idx)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 p-1"
                    title="Xóa mục này"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Câu hỏi thường gặp (FAQ) */}
        <div className="rounded-2xl border border-lavender-mist bg-warm-ivory/50 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-ui text-base font-bold text-deep-navy">
                {vi.cms.wizard.labels.faqTitle}
              </h3>
              <p className="text-xs text-deep-navy/70">
                {vi.cms.productForm.descriptions.faq}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="inline-flex items-center gap-1.5 rounded-xl border border-lavender-mist bg-white px-3.5 py-1.5 font-ui text-xs font-bold text-deep-navy shadow-sm hover:bg-soft-pink/40 hover:text-bright-magenta transition-all"
            >
              + {vi.cms.wizard.buttons.addFaq}
            </button>
          </div>

          {(!faq || faq.length === 0) && (
            <div className="rounded-xl border border-dashed border-lavender-mist bg-white p-4 text-center text-xs text-deep-navy/60">
              Chưa có câu hỏi thường gặp nào.
            </div>
          )}

          {faq && faq.length > 0 && (
            <div className="space-y-3">
              {faq.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-lavender-mist bg-white p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-deep-navy/60">
                      Câu hỏi #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 p-0.5"
                      title="Xóa câu hỏi này"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) =>
                      handleUpdateFaq(idx, 'question', e.target.value)
                    }
                    placeholder={vi.cms.wizard.labels.faqQuestionPlaceholder}
                    className="w-full rounded-lg border border-lavender-mist px-3 py-1.5 text-xs font-semibold text-deep-navy focus:border-bright-magenta focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    value={item.answer || ''}
                    onChange={(e) =>
                      handleUpdateFaq(idx, 'answer', e.target.value)
                    }
                    placeholder={vi.cms.wizard.labels.faqAnswerPlaceholder}
                    className="w-full rounded-lg border border-lavender-mist px-3 py-1.5 text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
