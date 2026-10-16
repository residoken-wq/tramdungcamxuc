'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { optOutWithTokenAction } from '@/lib/reminders/actions'
import { vi } from '@/lib/i18n/vi'
import { Button } from '@/components/ui/Button'

interface OptOutFormProps {
  token: string
  initialValid: boolean
}

export function OptOutForm({ token, initialValid }: OptOutFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const t = vi.reminders.optOut

  if (!initialValid) {
    return (
      <div className="bg-white/95 rounded-2xl p-6 sm:p-8 border border-lavender-mist shadow-sm text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-butter-cream/40 flex items-center justify-center text-deep-navy text-xl">
          ⚠️
        </div>
        <h2 className="font-ui text-lg sm:text-xl font-bold text-deep-navy">
          {t.invalidTokenTitle}
        </h2>
        <p className="text-sm text-deep-navy/70 max-w-md mx-auto leading-relaxed">
          {t.invalidTokenMessage}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Button href="/" variant="secondary" size="sm">
            {t.backHomeButton}
          </Button>
          <Button href="/tai-khoan" variant="primary" size="sm">
            {t.accountButton}
          </Button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="bg-white/95 rounded-2xl p-6 sm:p-8 border border-mint-haze shadow-sm text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-mint-haze flex items-center justify-center text-deep-navy text-xl">
          ✓
        </div>
        <h2 className="font-ui text-lg sm:text-xl font-bold text-deep-navy">{t.successTitle}</h2>
        <p className="text-sm text-deep-navy/80 max-w-md mx-auto leading-relaxed">
          {t.successMessage}
        </p>
        <p className="text-xs text-deep-navy/60 max-w-md mx-auto">{t.reEnablePrompt}</p>
        <div className="pt-3 flex flex-col sm:flex-row justify-center gap-3">
          <Button href="/tai-khoan" variant="primary" size="sm">
            {t.reEnableButton}
          </Button>
          <Button href="/" variant="ghost" size="sm">
            {t.backHomeButton}
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await optOutWithTokenAction(token)
      if (res.success) {
        setIsSubmitted(true)
      } else {
        setErrorMessage(res.message)
      }
    } catch (err) {
      console.error('[OptOutForm] Lỗi thực hiện yêu cầu:', err)
      setErrorMessage(t.invalidTokenMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/95 rounded-2xl p-6 sm:p-8 border border-lavender-mist shadow-sm space-y-6">
      <div className="space-y-2">
        <p className="text-base text-deep-navy font-medium leading-relaxed">{t.prompt}</p>
        <p className="text-xs text-deep-navy/65 leading-relaxed bg-warm-ivory p-3.5 rounded-xl border border-lavender-mist/60">
          ℹ️ {t.note}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-soft-pink border border-accent-pink/30 text-xs text-bright-magenta">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? t.processingButton : t.confirmButton}
        </Button>
        <Link
          href="/"
          className="text-xs text-deep-navy/60 hover:text-deep-navy transition-colors py-2 px-3"
        >
          {t.backHomeButton}
        </Link>
      </form>
    </div>
  )
}
