'use client'

import React, { useState } from 'react'
import { vi } from '@/lib/i18n/vi'

type ViewportMode = 'mobile' | 'tablet' | 'desktop'

interface Step5PreviewProps {
  docId?: number | string | null
  isSavingDraft: boolean
  saveDraftError?: string | null
  onRetrySaveDraft: () => void
}

export function Step5Preview({
  docId,
  isSavingDraft,
  saveDraftError,
  onRetrySaveDraft,
}: Step5PreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>('desktop')

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return '375px'
      case 'tablet':
        return '768px'
      case 'desktop':
      default:
        return '100%'
    }
  }

  const previewUrl = docId ? `/xem-truoc/san-pham/${docId}?preview=1` : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-ui text-lg font-bold text-deep-navy">
            {vi.cms.wizard.steps.step5.title}
          </h2>
          <p className="text-sm text-deep-navy/70">{vi.cms.wizard.steps.step5.description}</p>
        </div>

        {/* Bộ chuyển kích thước hiển thị */}
        <div className="inline-flex items-center rounded-xl border border-lavender-mist bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`rounded-lg px-3 py-1.5 font-ui text-xs font-semibold transition-all ${
              viewport === 'mobile'
                ? 'bg-bright-magenta text-white shadow-sm'
                : 'text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            📱 {vi.cms.wizard.preview.mobile}
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`rounded-lg px-3 py-1.5 font-ui text-xs font-semibold transition-all ${
              viewport === 'tablet'
                ? 'bg-bright-magenta text-white shadow-sm'
                : 'text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            📋 {vi.cms.wizard.preview.tablet}
          </button>
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`rounded-lg px-3 py-1.5 font-ui text-xs font-semibold transition-all ${
              viewport === 'desktop'
                ? 'bg-bright-magenta text-white shadow-sm'
                : 'text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            💻 {vi.cms.wizard.preview.desktop}
          </button>
        </div>
      </div>

      {/* Thông báo hướng dẫn */}
      <div className="rounded-xl border border-mint-haze bg-mint-haze/40 p-3 text-xs text-deep-navy">
        ℹ️ {vi.cms.wizard.preview.readyHint}
      </div>

      {/* Khung xem trước iframe */}
      <div className="flex justify-center rounded-2xl border border-lavender-mist/80 bg-gray-100 p-4 min-h-[560px] overflow-hidden">
        {isSavingDraft ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-deep-navy/70">
            <span className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-3 border-bright-magenta border-t-transparent" />
            <p className="font-semibold">{vi.cms.wizard.preview.loadingPreview}</p>
            <p className="text-xs text-deep-navy/50 mt-1">
              Hệ thống đang chuẩn bị bản ghi xem trước...
            </p>
          </div>
        ) : saveDraftError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-red-600">
            <span className="text-2xl mb-2">⚠️</span>
            <p className="font-bold">Không thể tải bản xem trước</p>
            <p className="text-xs mt-1 text-deep-navy/70 max-w-md">{saveDraftError}</p>
            <button
              type="button"
              onClick={onRetrySaveDraft}
              className="mt-4 rounded-xl bg-bright-magenta px-4 py-2 font-ui text-xs font-bold text-white shadow-sm hover:bg-accent-pink"
            >
              Thử lại lưu nháp
            </button>
          </div>
        ) : previewUrl ? (
          <div
            className="transition-all duration-300 w-full overflow-hidden rounded-xl border border-lavender-mist bg-white shadow-md"
            style={{ maxWidth: getViewportWidth() }}
          >
            <div className="flex items-center justify-between border-b border-lavender-mist bg-soft-pink/30 px-3 py-2 text-[11px] text-deep-navy/60 font-mono">
              <span>{previewUrl}</span>
              <span>
                {viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%'}
              </span>
            </div>
            <iframe
              src={previewUrl}
              title="Xem trước sản phẩm"
              className="h-[600px] w-full border-0 bg-white"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-deep-navy/60">
            <p>Chưa có dữ liệu bản ghi để xem trước.</p>
          </div>
        )}
      </div>
    </div>
  )
}
