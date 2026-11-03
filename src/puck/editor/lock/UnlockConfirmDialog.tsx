'use client'

import React, { useEffect, useRef } from 'react'
import { vi } from '@/lib/i18n/vi'
import { isHomepageSlug } from '@/puck/locks'
import type { ComponentData } from '@puckeditor/core'

export type UnlockConfirmDialogProps = {
  item: ComponentData
  pageSlug: string
  pageKind: string
  onConfirm: () => void
  onCancel: () => void
}

export function UnlockConfirmDialog({
  item,
  pageSlug,
  pageKind,
  onConfirm,
  onCancel,
}: UnlockConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelBtnRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const isHeroHomepage = item.type === 'HeroTwoEntries' && isHomepageSlug(pageSlug)
  const isFooterLegal = item.type === 'LegalFooter' && pageKind === 'footer'

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-deep-navy/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unlock-dialog-title"
        aria-describedby="unlock-dialog-desc"
        className="bg-warm-ivory rounded-2xl border border-deep-navy/15 shadow-2xl max-w-md w-full p-6 text-deep-navy flex flex-col space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-deep-navy/10 pb-3">
          <span className="text-xl" aria-hidden="true">
            🔓
          </span>
          <h2 id="unlock-dialog-title" className="text-base font-bold font-ui text-deep-navy">
            {vi.eb14b.confirmTitle}
          </h2>
        </div>

        <div id="unlock-dialog-desc" className="text-xs sm:text-sm text-deep-navy/90 font-ui space-y-2">
          <p>{vi.eb14b.confirmMessage}</p>
          {isHeroHomepage && (
            <p className="text-xs text-bright-magenta font-semibold">
              {vi.eb14b.confirmHeroNotice}
            </p>
          )}
          {isFooterLegal && (
            <p className="text-xs text-bright-magenta font-semibold">
              {vi.eb14b.confirmLegalFooterNotice}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-deep-navy/10">
          <button
            ref={cancelBtnRef}
            type="button"
            data-testid="dialog-cancel-unlock"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory text-deep-navy transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta"
          >
            {vi.eb14b.cancelButton}
          </button>
          <button
            type="button"
            data-testid="dialog-confirm-unlock"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-ui text-xs font-bold bg-bright-magenta text-white hover:bg-bright-magenta/90 transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta"
          >
            {vi.eb14b.confirmButton}
          </button>
        </div>
      </div>
    </div>
  )
}

