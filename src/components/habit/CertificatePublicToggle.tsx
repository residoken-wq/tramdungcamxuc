'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { vi } from '@/lib/i18n/vi'
import { toggleCertificatePublicAction } from '@/lib/habit/certificate-actions'

export interface CertificatePublicToggleProps {
  code: string
  initialIsPublic: boolean
}

export function CertificatePublicToggle({ code, initialIsPublic }: CertificatePublicToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Khóa nút tới khi trang chạy JavaScript trên client
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleToggle = async () => {
    if (!isHydrated || isLoading) return
    setIsLoading(true)
    setError(null)

    const nextState = !isPublic
    try {
      const res = await toggleCertificatePublicAction(code, nextState)
      if (res.success) {
        setIsPublic(nextState)
      } else {
        setError(res.message || vi.certificate.errors.updateStatusFailed)
      }
    } catch {
      setError(vi.certificate.errors.updateStatusFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 rounded-xl border border-deep-navy/15 bg-warm-ivory shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full border border-deep-navy/30 ${
              isPublic ? 'bg-mint-haze' : 'bg-butter-cream'
            }`}
          />
          <span className="text-xs font-ui font-semibold text-deep-navy">
            {isPublic
              ? vi.certificate.publicStatus.isPublic
              : vi.certificate.publicStatus.isPrivate}
          </span>
        </div>

        <button
          type="button"
          disabled={!isHydrated || isLoading}
          onClick={handleToggle}
          className={`px-3.5 py-1.5 rounded-full font-ui font-semibold text-xs transition-all motion-reduce:transition-none shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
            isPublic
              ? 'border border-deep-navy/20 bg-warm-ivory hover:bg-soft-pink text-deep-navy'
              : 'bg-bright-magenta text-warm-ivory hover:bg-bright-magenta/90'
          }`}
        >
          {isLoading
            ? vi.certificate.publicStatus.toggling
            : isPublic
              ? vi.certificate.publicStatus.togglePrivate
              : vi.certificate.publicStatus.togglePublic}
        </button>
      </div>

      {!isPublic && (
        <p className="text-xs font-sans text-deep-navy/70 leading-relaxed bg-butter-cream/30 p-2.5 rounded-lg border border-butter-cream">
          {vi.certificate.publicStatus.privateNotice}
        </p>
      )}

      {error && (
        <p className="text-xs font-sans text-bright-magenta bg-soft-pink/60 p-2 rounded-lg border border-bright-magenta/20">
          {error}
        </p>
      )}
    </div>
  )
}
