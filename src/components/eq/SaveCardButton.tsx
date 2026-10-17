'use client'

import React, { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { saveEqCardAction } from '@/lib/eq/saved-actions'
import { vi } from '@/lib/i18n/vi'

export interface SaveCardButtonProps {
  qrSlug: string
  isLoggedIn: boolean
  initialIsSaved?: boolean
  className?: string
}

export function SaveCardButton({
  qrSlug,
  isLoggedIn,
  initialIsSaved = false,
  className = '',
}: SaveCardButtonProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn) {
    const loginHref = `/tai-khoan/dang-nhap?next=${encodeURIComponent(`/eq-buddy/the/${qrSlug}`)}`
    return (
      <div className={`text-center ${className}`}>
        <Link
          href={loginHref}
          className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-bright-magenta hover:underline motion-reduce:transition-none transition-colors"
        >
          {vi.eqBuddy.savedCards.loginButton} →
        </Link>
      </div>
    )
  }

  const handleSave = async () => {
    if (isSaving || isSaved) return
    setIsSaving(true)
    setError(null)
    try {
      const res = await saveEqCardAction({ qrSlug })
      if (res.success) {
        setIsSaved(true)
      } else {
        setError(res.message || vi.eqBuddy.savedCards.errors.generalError)
      }
    } catch {
      setError(vi.eqBuddy.savedCards.errors.generalError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
      <Button
        type="button"
        variant={isSaved ? 'secondary' : 'primary'}
        size="md"
        onClick={handleSave}
        disabled={!isHydrated || isSaving || isSaved}
        className="motion-reduce:transition-none"
      >
        {isSaved
          ? `✓ ${vi.eqBuddy.savedCards.savedBadge}`
          : isSaving
            ? vi.eqBuddy.savedCards.savingButton
            : vi.eqBuddy.savedCards.saveCardButton}
      </Button>
      {error && <span className="text-xs text-bright-magenta font-sans text-center">{error}</span>}
    </div>
  )
}
