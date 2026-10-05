'use client'

import React, { createContext, useContext, useState, useTransition } from 'react'
import Link from 'next/link'
import { Puck, type Data, type Viewports, usePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { puckConfig } from '@/puck/config'
import { saveDraftAction, publishPageAction } from '@/puck/actions'

export const brandViewports: Viewports = [
  { width: 375, height: 'auto', label: 'Điện thoại (375px)', icon: 'Smartphone' },
  { width: 768, height: 'auto', label: 'Máy tính bảng (768px)', icon: 'Tablet' },
  { width: 1440, height: 'auto', label: 'Máy tính (1440px)', icon: 'Monitor' },
]

type PuckEditorClientProps = {
  initialData: Data
  pageId: string
  pageTitle: string
  pageSlug: string
  initialStatus: string
}

type Feedback = {
  type: 'idle' | 'saving' | 'saved' | 'error'
  message: string
}

const EditorContext = createContext<{
  pageId: string
  pageSlug: string
  currentStatus: string
  onStatusChange: (status: string) => void
  feedback: Feedback
  setFeedback: (feedback: Feedback) => void
} | null>(null)

function EditorHeaderActions() {
  const context = useContext(EditorContext)
  const { appState } = usePuck()
  const [isPending, startTransition] = useTransition()
  if (!context) throw new Error('EditorHeaderActions requires EditorContext')
  const { pageId, pageSlug, currentStatus, onStatusChange, feedback, setFeedback } = context

  const previewHref = pageSlug === '/' ? '/' : `/${pageSlug}`

  const handleSaveDraft = () => {
    setFeedback({ type: 'saving', message: vi.builder.saving })
    startTransition(async () => {
      try {
        const result = await saveDraftAction(pageId, appState.data)
        if (result.success) {
          const time = new Date().toLocaleTimeString('vi-VN')
          setFeedback({ type: 'saved', message: `${vi.builder.savedDraft} (${time})` })
          onStatusChange(result.status || 'draft')
        } else {
          setFeedback({ type: 'error', message: result.message || vi.builder.saveFailed })
        }
      } catch {
        setFeedback({ type: 'error', message: vi.builder.saveConnectionFailed })
      }
    })
  }

  const handlePublish = () => {
    setFeedback({ type: 'saving', message: vi.builder.publishing })
    startTransition(async () => {
      try {
        const result = await publishPageAction(pageId, appState.data)
        if (result.success) {
          const time = new Date().toLocaleTimeString('vi-VN')
          setFeedback({ type: 'saved', message: `${vi.builder.published} (${time})` })
          onStatusChange('published')
        } else {
          setFeedback({ type: 'error', message: result.message || vi.builder.publishFailed })
        }
      } catch {
        setFeedback({ type: 'error', message: vi.builder.publishConnectionFailed })
      }
    })
  }

  const isSaving = isPending || feedback.type === 'saving'

  return (
    <div className="flex items-center gap-3">
      {/* Status & Feedback message */}
      {feedback.message && (
        <span
          role="status"
          className={`text-xs font-ui px-2.5 py-1 rounded-full ${
            feedback.type === 'error'
              ? 'bg-soft-pink text-bright-magenta'
              : feedback.type === 'saved'
                ? 'bg-mint-haze text-deep-navy font-semibold'
                : 'bg-butter-cream text-deep-navy'
          }`}
        >
          {feedback.message}
        </span>
      )}

      {/* View public page link */}
      {currentStatus === 'published' && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-ui font-semibold text-deep-navy/80 hover:text-deep-navy px-2.5 py-1.5 rounded-lg border border-deep-navy/20 bg-white hover:bg-warm-ivory transition"
        >
          <span>{vi.builder.viewPage}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {/* Button 1: Save Draft */}
      <button
        type="button"
        onClick={handleSaveDraft}
        disabled={isSaving}
        className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg font-ui text-xs font-bold bg-white text-deep-navy border border-deep-navy/30 hover:bg-soft-pink/40 disabled:opacity-50 transition cursor-pointer"
      >
        {isSaving ? vi.builder.processing : vi.builder.saveDraft}
      </button>

      {/* Button 2: Publish */}
      <button
        type="button"
        onClick={handlePublish}
        disabled={isSaving}
        className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-ui text-xs font-bold bg-deep-navy text-white hover:opacity-90 disabled:opacity-50 transition shadow-sm cursor-pointer"
      >
        {isSaving ? vi.builder.processing : vi.builder.publish}
      </button>
    </div>
  )
}

// Keep the override component identity stable across editor state updates.
const editorOverrides = { headerActions: EditorHeaderActions }

export function PuckEditorClient({
  initialData,
  pageId,
  pageTitle,
  pageSlug,
  initialStatus,
}: PuckEditorClientProps) {
  const [feedback, setFeedback] = useState<Feedback>({ type: 'idle', message: '' })
  const [docStatus, setDocStatus] = useState<string>(initialStatus)

  return (
    <EditorContext.Provider
      value={{
        pageId,
        pageSlug,
        currentStatus: docStatus,
        onStatusChange: setDocStatus,
        feedback,
        setFeedback,
      }}
    >
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-warm-ivory">
        {/* Top Banner Navigation */}
        <header className="bg-deep-navy text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm shadow-md z-20">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/collections/pages/${pageId}`}
              className="inline-flex items-center gap-1 text-white/80 hover:text-white transition font-ui font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Quản trị CMS</span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="font-ui font-bold truncate max-w-xs sm:max-w-md">
              Trạm Dừng Cảm Xúc · {pageTitle}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-ui font-bold uppercase tracking-wider ${
                docStatus === 'published'
                  ? 'bg-mint-haze text-deep-navy'
                  : 'bg-soft-pink text-deep-navy'
              }`}
            >
              {docStatus === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
          </div>

          <div className="text-white/70 font-ui text-xs hidden sm:block">
            Đường dẫn:{' '}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">{pageSlug}</code>
          </div>
        </header>

        {/* Puck Editor Container */}
        <div className="flex-1 min-h-0 relative">
          <Puck
            config={puckConfig}
            data={initialData}
            viewports={brandViewports}
            iframe={{
              enabled: true,
              waitForStyles: true,
            }}
            overrides={editorOverrides}
          />
        </div>
      </div>
    </EditorContext.Provider>
  )
}
