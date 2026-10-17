'use client'

import React, { useState } from 'react'
import { vi } from '@/lib/i18n/vi'

interface Step4PreviewProps {
  lessonId?: number | string | null
  title: string
  isDraftSaved: boolean
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export function Step4Preview({ lessonId, title, isDraftSaved }: Step4PreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const previewUrl = lessonId ? `/habit/hoc/${lessonId}?preview=1` : null

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
            {vi.cms.lessonWizard.steps.step4.title}
          </h2>
          <p className="mt-1 font-ui text-sm text-deep-navy/70">
            {vi.cms.lessonWizard.steps.step4.description}
          </p>
        </div>

        {/* Viewport switchers */}
        <div className="flex items-center gap-1 rounded-xl border border-lavender-mist bg-warm-ivory p-1">
          <button
            type="button"
            aria-pressed={viewport === 'mobile'}
            onClick={() => setViewport('mobile')}
            className={`rounded-lg px-3 py-1 font-ui text-xs font-semibold transition-all ${
              viewport === 'mobile'
                ? 'bg-bright-magenta text-white shadow-sm'
                : 'text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            📱 {vi.cms.wizard.preview.mobile}
          </button>
          <button
            type="button"
            aria-pressed={viewport === 'tablet'}
            onClick={() => setViewport('tablet')}
            className={`rounded-lg px-3 py-1 font-ui text-xs font-semibold transition-all ${
              viewport === 'tablet'
                ? 'bg-bright-magenta text-white shadow-sm'
                : 'text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            📋 {vi.cms.wizard.preview.tablet}
          </button>
          <button
            type="button"
            aria-pressed={viewport === 'desktop'}
            onClick={() => setViewport('desktop')}
            className={`rounded-lg px-3 py-1 font-ui text-xs font-semibold transition-all ${
              viewport === 'desktop'
                ? 'bg-bright-magenta text-white shadow-sm'
                : 'text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            💻 {vi.cms.wizard.preview.desktop}
          </button>
        </div>
      </div>

      {isDraftSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-mint-haze bg-mint-haze/50 p-3 font-ui text-xs text-deep-navy">
          <span>✓</span>
          <span>Bản nháp bài học &ldquo;{title}&rdquo; đã được đồng bộ với hệ thống để xem trước.</span>
        </div>
      )}

      {/* Frame xem trước */}
      <div className="flex justify-center overflow-x-auto rounded-2xl border border-lavender-mist bg-warm-ivory/40 p-4">
        {previewUrl ? (
          <div
            style={{ width: getViewportWidth() }}
            className="transition-all duration-300 relative rounded-xl border border-lavender-mist bg-white shadow-sm overflow-hidden"
          >
            {!iframeLoaded && (
              <div className="flex h-96 w-full items-center justify-center p-8 text-center">
                <div className="space-y-2">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-bright-magenta border-t-transparent" />
                  <p className="font-ui text-xs text-deep-navy/70">
                    {vi.cms.wizard.preview.loadingPreview}
                  </p>
                </div>
              </div>
            )}
            <iframe
              src={previewUrl}
              title={`Xem trước bài học: ${title}`}
              onLoad={() => setIframeLoaded(true)}
              className="h-[640px] w-full border-0"
            />
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-lavender-mist bg-white p-8 text-center">
            <p className="font-ui text-xs text-deep-navy/70">
              {vi.cms.wizard.preview.loadingPreview}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
