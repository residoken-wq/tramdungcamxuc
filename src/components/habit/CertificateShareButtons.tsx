'use client'

import React, { useState } from 'react'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'

export interface CertificateShareButtonsProps {
  code: string
  customerName: string
  isPublic?: boolean
}

export function CertificateShareButtons({
  code,
  customerName,
  isPublic = true,
}: CertificateShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleDownload45 = () => {
    track('certificate_shared', { format: '4x5' })
  }

  const handleDownload916 = () => {
    track('certificate_shared', { format: '9x16' })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/chung-nhan/${code}`
    track('certificate_shared', { format: 'link' })

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: vi.certificate.metaTitle(customerName),
          text: vi.certificate.metaDescription,
          url,
        })
        return
      } catch {
        // Hủy hoặc không hỗ trợ -> fallback sao chép link
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch {
        // Bỏ qua lỗi sao chép
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={`/chung-nhan/${code}/anh/4x5`}
          download={`chung-nhan-${code}-4x5.png`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownload45}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-accent-pink text-warm-ivory font-ui font-bold text-sm hover:bg-accent-pink/90 transition-all motion-reduce:transition-none shadow-sm"
        >
          {vi.certificate.actions.download45}
        </a>

        <a
          href={`/chung-nhan/${code}/anh/9x16`}
          download={`chung-nhan-${code}-9x16.png`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownload916}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border-2 border-accent-pink text-deep-navy bg-warm-ivory hover:bg-soft-pink font-ui font-bold text-sm transition-all motion-reduce:transition-none shadow-xs"
        >
          {vi.certificate.actions.download916}
        </a>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-deep-navy/20 text-deep-navy bg-warm-ivory hover:bg-lavender-mist/40 font-ui font-semibold text-sm transition-all motion-reduce:transition-none"
        >
          {copied ? vi.certificate.actions.copiedLink : vi.certificate.actions.share}
        </button>
      </div>

      {!isPublic && (
        <p className="text-xs font-sans text-deep-navy/70 text-center">
          {vi.certificate.publicStatus.privateShareNotice}
        </p>
      )}
    </div>
  )
}
