'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { deleteSavedCardAction } from '@/lib/eq/saved-actions'
import type { CustomerSavedCardItem } from '@/lib/eq/saved.server'
import { vi } from '@/lib/i18n/vi'

export interface SavedCardsProps {
  initialCards: CustomerSavedCardItem[]
  loadError?: boolean
}

export function SavedCards({ initialCards, loadError = false }: SavedCardsProps) {
  const [cards, setCards] = useState<CustomerSavedCardItem[]>(initialCards)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    setErrorMessage(null)
    try {
      const res = await deleteSavedCardAction({ savedCardId: id })
      if (res.success) {
        setCards((prev) => prev.filter((c) => c.id !== id))
        setConfirmId(null)
      } else {
        setErrorMessage(res.message || vi.eqBuddy.savedCards.errors.generalError)
      }
    } catch {
      setErrorMessage(vi.eqBuddy.savedCards.errors.generalError)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="bg-warm-ivory rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-deep-navy/10 pb-3">
        <h2 className="font-ui text-base font-bold text-deep-navy">
          {vi.eqBuddy.savedCards.title}
        </h2>
        {cards.length > 0 && (
          <span className="font-ui text-xs font-semibold px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
            {cards.length}
          </span>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-accent-pink/10 border border-accent-pink/30 text-deep-navy text-xs font-sans"
        >
          {errorMessage}
        </div>
      )}

      {loadError ? (
        <p role="alert" className="font-sans text-sm font-semibold text-deep-navy">
          {vi.eqBuddy.savedCards.loadError}
        </p>
      ) : cards.length === 0 ? (
        <div className="p-8 rounded-xl bg-warm-ivory/50 border border-dashed border-deep-navy/20 text-center space-y-4">
          <p className="font-sans text-sm text-deep-navy/70">
            {vi.eqBuddy.savedCards.emptyDescription}
          </p>
          <div>
            <Button
              href="/eq-buddy"
              variant="secondary"
              size="sm"
              className="motion-reduce:transition-none"
            >
              {vi.eqBuddy.savedCards.drawCardCTA}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const isConfirming = confirmId === card.id
            const isDeleting = deletingId === card.id

            return (
              <div
                key={card.id}
                data-testid={`saved-card-item-${card.code}`}
                className="p-4 sm:p-5 rounded-2xl border border-lavender-mist bg-warm-ivory/60 space-y-3 transition-colors motion-reduce:transition-none"
              >
                {/* Header: Code, Keyword, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-xs font-bold text-bright-magenta uppercase">
                      {card.code}
                    </span>
                    <h3 className="font-ui font-bold text-deep-navy text-base">{card.keywordEn}</h3>
                    {card.keywordVi && (
                      <span className="font-sans text-xs text-deep-navy/60 italic">
                        ({card.keywordVi})
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-xs text-deep-navy/50">
                    {vi.eqBuddy.savedCards.savedAt(formatDate(card.savedAt))}
                  </span>
                </div>

                {/* Thông điệp ngắn */}
                {card.message && (
                  <p className="font-sans text-sm text-deep-navy/80 leading-relaxed">
                    {card.message}
                  </p>
                )}

                {/* Suy ngẫm của riêng chủ tài khoản */}
                {card.reflection && (
                  <div className="p-3.5 rounded-xl bg-soft-pink/40 border border-lavender-mist/70 space-y-1">
                    <span className="font-ui text-[11px] font-bold uppercase tracking-wider text-bright-magenta/80 block">
                      {vi.eqBuddy.savedCards.savedNotePrefix}
                    </span>
                    <p className="font-quote italic text-sm text-deep-navy whitespace-pre-wrap">
                      {card.reflection}
                    </p>
                  </div>
                )}

                {/* Hành động: Xem thẻ & Xóa */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-deep-navy/10">
                  <Link
                    href={`/eq-buddy/the/${encodeURIComponent(card.qrSlug)}`}
                    className="font-ui text-xs font-semibold text-bright-magenta hover:underline inline-flex items-center gap-1 motion-reduce:transition-none"
                  >
                    {vi.eqBuddy.savedCards.openCardLink} →
                  </Link>

                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs text-deep-navy/70 hidden sm:inline">
                        {vi.eqBuddy.savedCards.deleteConfirmTitle}?
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmId(null)}
                        disabled={isDeleting}
                        className="text-xs py-1 px-2.5"
                      >
                        {vi.eqBuddy.savedCards.cancelDelete}
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting
                          ? vi.eqBuddy.savedCards.deletingButton
                          : vi.eqBuddy.savedCards.confirmDelete}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(card.id)}
                      className="font-ui text-xs font-semibold text-deep-navy/50 hover:text-accent-pink transition-colors motion-reduce:transition-none"
                    >
                      {vi.eqBuddy.savedCards.deleteButton}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
