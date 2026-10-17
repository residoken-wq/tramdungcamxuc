'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'

interface WizardControlsProps {
  currentStep: number
  totalSteps: number
  canGoBack: boolean
  canContinue: boolean
  isSaving: boolean
  isPublishing: boolean
  errorMessage?: string | null
  successMessage?: string | null
  onBack: () => void
  onContinue: () => void
  onSaveDraft: () => void
  onPublish?: () => void
  onClearDraft?: () => void
}

export function WizardControls({
  currentStep,
  totalSteps,
  canGoBack,
  canContinue,
  isSaving,
  isPublishing,
  errorMessage,
  successMessage,
  onBack,
  onContinue,
  onSaveDraft,
  onPublish,
  onClearDraft,
}: WizardControlsProps) {
  const isLastStep = currentStep === totalSteps
  const isBusy = isSaving || isPublishing

  return (
    <div className="sticky bottom-0 z-20 mt-8 rounded-2xl border border-lavender-mist/80 bg-white/95 p-4 shadow-lg backdrop-blur-md">
      {/* Banner thông báo lỗi / thành công */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span className="font-bold">⚠️</span>
          <span className="flex-1 font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-3 flex items-start gap-2 rounded-xl border border-mint-haze bg-mint-haze/60 p-3 text-sm text-deep-navy"
        >
          <span className="font-bold">✓</span>
          <span className="flex-1 font-medium">{successMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Nút bên trái: Quay lại & Xóa nháp */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack || isBusy}
            className={`inline-flex items-center gap-2 rounded-xl border border-lavender-mist px-4 py-2.5 font-ui text-sm font-semibold transition-all ${
              canGoBack && !isBusy
                ? 'bg-white text-deep-navy hover:bg-soft-pink/40 hover:text-bright-magenta'
                : 'cursor-not-allowed bg-gray-50 text-gray-300'
            }`}
          >
            ← {vi.cms.wizard.buttons.back}
          </button>

          {onClearDraft && (
            <button
              type="button"
              onClick={onClearDraft}
              disabled={isBusy}
              className="text-xs font-medium text-deep-navy/50 underline hover:text-red-600 transition-colors px-2 py-1"
            >
              {vi.cms.wizard.buttons.clearDraft}
            </button>
          )}
        </div>

        {/* Nút bên phải: Tiếp tục, Lưu nháp, Xuất bản */}
        <div className="flex items-center gap-3">
          {!isLastStep && (
            <>
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-lavender-mist bg-soft-pink/40 px-4 py-2.5 font-ui text-sm font-semibold text-deep-navy transition-all hover:bg-soft-pink hover:text-bright-magenta disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-bright-magenta border-t-transparent" />
                    {vi.cms.wizard.buttons.savingDraft}
                  </>
                ) : (
                  vi.cms.wizard.buttons.saveDraft
                )}
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue || isBusy}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-ui text-sm font-bold shadow-sm transition-all ${
                  canContinue && !isBusy
                    ? 'bg-accent-pink text-white hover:bg-bright-magenta hover:shadow-md'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}
              >
                {vi.cms.wizard.buttons.continue} →
              </button>
            </>
          )}

          {isLastStep && (
            <>
              {/* Nút mặc định: Lưu nháp */}
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-deep-navy bg-white px-5 py-2.5 font-ui text-sm font-bold text-deep-navy shadow-sm transition-all hover:bg-soft-pink/30 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-deep-navy border-t-transparent" />
                    {vi.cms.wizard.buttons.savingDraft}
                  </>
                ) : (
                  `💾 ${vi.cms.wizard.buttons.saveDraft} (Mặc định)`
                )}
              </button>

              {/* Nút Xuất bản */}
              {onPublish && (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-bright-magenta px-6 py-2.5 font-ui text-sm font-bold text-white shadow-sm transition-all hover:bg-accent-pink hover:shadow-md disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {vi.cms.wizard.buttons.publishing}
                    </>
                  ) : (
                    `🚀 ${vi.cms.wizard.buttons.publish}`
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
