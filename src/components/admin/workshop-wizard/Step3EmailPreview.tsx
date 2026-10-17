'use client'

import React, { useEffect, useState } from 'react'
import { vi } from '@/lib/i18n/vi'
import { renderWorkshopEmailPreviewAction } from '@/lib/cms/workshop-wizard.server'

interface Step3EmailPreviewProps {
  title: string
  vnDate: string
  vnTime: string
  joinUrl: string
  isDraftSaved: boolean
}

type ViewportMode = 'mobile' | 'desktop'

export function Step3EmailPreview({
  title,
  vnDate,
  vnTime,
  joinUrl,
  isDraftSaved,
}: Step3EmailPreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>('desktop')
  const [emailHtml, setEmailHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadEmailHtml() {
      setIsLoading(true)
      setRenderError(null)
      try {
        const res = await renderWorkshopEmailPreviewAction({
          title,
          vnDate,
          vnTime,
          joinUrl,
        })
        if (!isCancelled) {
          if (res.success && res.html) {
            setEmailHtml(res.html)
          } else {
            setRenderError(res.error || 'Không thể tạo bản xem trước email')
          }
        }
      } catch {
        if (!isCancelled) {
          setRenderError('Đã xảy ra lỗi khi tạo bản xem trước email')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadEmailHtml()

    return () => {
      isCancelled = true
    }
  }, [title, vnDate, vnTime, joinUrl])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
            {vi.cms.workshopWizard.steps.step3.title}
          </h2>
          <p className="mt-1 font-ui text-sm text-deep-navy/70">
            {vi.cms.workshopWizard.steps.step3.description}
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

      {/* Thông báo an toàn: không gửi email thật */}
      <div className="rounded-2xl border border-lavender-mist/80 bg-warm-ivory/60 p-4 font-ui text-xs text-deep-navy">
        <p className="font-bold text-bright-magenta">
          ✉️ {vi.cms.workshopWizard.labels.emailPreviewNotice}
        </p>
        <p className="mt-1 text-deep-navy/70">
          Giao diện dưới đây minh họa chính xác email mà học viên đã đăng ký sẽ nhận được trước 24
          tiếng. Hệ thống chỉ lưu lịch và hoàn toàn KHÔNG gửi email thật trong bước này.
        </p>
      </div>

      {isDraftSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-mint-haze bg-mint-haze/50 p-3 font-ui text-xs text-deep-navy">
          <span>✓</span>
          <span>Đã đồng bộ bản nháp workshop vào hệ thống.</span>
        </div>
      )}

      {/* Khung hiển thị email */}
      <div className="flex justify-center overflow-x-auto rounded-2xl border border-lavender-mist bg-warm-ivory/40 p-4">
        <div
          style={{ width: viewport === 'mobile' ? '375px' : '100%', maxWidth: '640px' }}
          className="transition-all duration-300 relative rounded-xl border border-lavender-mist bg-white shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="flex h-96 w-full items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-bright-magenta border-t-transparent" />
                <p className="font-ui text-xs text-deep-navy/70">
                  Đang chuẩn bị email xem trước...
                </p>
              </div>
            </div>
          ) : renderError ? (
            <div className="flex h-64 w-full items-center justify-center p-8 text-center font-ui text-xs text-accent-pink">
              ⚠️ {renderError}
            </div>
          ) : (
            <iframe
              srcDoc={emailHtml}
              title={`Bản xem trước email: ${title}`}
              className="h-[620px] w-full border-0"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  )
}
