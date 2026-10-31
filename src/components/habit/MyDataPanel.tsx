'use client'

import React, { useId, useRef, useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { vi } from '@/lib/i18n/vi'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import { MAX_BACKUP_BYTES, parseHabitBackup, type HabitBackupData } from '@/lib/habit/backup'
import {
  copyForCoach,
  exportBackup,
  exportCsv,
  restartJourney,
  restoreBackup,
  type RestoreBackupResult,
  type RestoredCheckinSnapshot,
} from '@/lib/habit/my-data-actions'

export interface MyDataPanelProps {
  journeyDays: number
  privacyNote?: string | null
  readOnly?: boolean
  buyUrl: string
  onRestored?: (checkins: RestoredCheckinSnapshot[]) => void
}

function triggerBrowserDownload(content: string, filename: string, mimeType: string) {
  const isCsv = mimeType.startsWith('text/csv')
  const cleanContent = isCsv && content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
  const blobParts: BlobPart[] = isCsv
    ? [new Uint8Array([0xef, 0xbb, 0xbf]), cleanContent]
    : [cleanContent]
  const blob = new Blob(blobParts, { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function MyDataPanel({
  journeyDays,
  privacyNote,
  readOnly = false,
  buyUrl,
  onRestored,
}: MyDataPanelProps) {
  const includeNotesId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const restoreButtonRef = useRef<HTMLButtonElement | null>(null)
  const restartButtonRef = useRef<HTMLButtonElement | null>(null)

  const [includeNotes, setIncludeNotes] = useState(false)
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [pendingRawJson, setPendingRawJson] = useState<string | null>(null)
  const [pendingBackup, setPendingBackup] = useState<HabitBackupData | null>(null)
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [restoreResult, setRestoreResult] = useState<RestoreBackupResult | null>(null)

  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false)

  const effectivePrivacyNote =
    privacyNote && privacyNote.trim().length > 0 ? privacyNote.trim() : vi.hb13.defaultPrivacyNote

  const handleExportBackup = async () => {
    setFeedback(null)
    setIsExportingJson(true)
    try {
      const res = await exportBackup()
      if (!res.success || !res.json || !res.filename) {
        setFeedback({
          type: 'error',
          message: res.message || vi.hb13.exportFailedToast,
        })
        return
      }
      triggerBrowserDownload(res.json, res.filename, 'application/json;charset=utf-8')
    } catch {
      setFeedback({
        type: 'error',
        message: vi.hb13.exportFailedToast,
      })
    } finally {
      setIsExportingJson(false)
    }
  }

  const handleExportCsv = async () => {
    setFeedback(null)
    setIsExportingCsv(true)
    try {
      const res = await exportCsv()
      if (!res.success || !res.csv || !res.filename) {
        setFeedback({
          type: 'error',
          message: res.message || vi.hb13.exportFailedToast,
        })
        return
      }
      triggerBrowserDownload(res.csv, res.filename, 'text/csv;charset=utf-8')
    } catch {
      setFeedback({
        type: 'error',
        message: vi.hb13.exportFailedToast,
      })
    } finally {
      setIsExportingCsv(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_BACKUP_BYTES) {
      setFeedback({
        type: 'error',
        message: vi.hb13.errors.fileTooLarge,
      })
      return
    }

    try {
      const rawText = await file.text()
      const parsed = parseHabitBackup(rawText)
      if (!parsed.success) {
        setFeedback({
          type: 'error',
          message: parsed.message,
        })
        return
      }

      setPendingRawJson(rawText)
      setPendingBackup(parsed.data)
      setRestoreResult(null)
      setIsRestoreModalOpen(true)
    } catch {
      setFeedback({
        type: 'error',
        message: vi.hb13.errors.invalidJson,
      })
    }
  }

  const handleConfirmRestore = async () => {
    if (!pendingRawJson) return
    setIsRestoring(true)
    setFeedback(null)
    try {
      const res = await restoreBackup(pendingRawJson)
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.message || vi.hb13.errors.invalidSchema,
        })
        setIsRestoreModalOpen(false)
        return
      }

      setRestoreResult(res)
      setFeedback({
        type: 'success',
        message: vi.hb13.restoreModal.resultSummary(res.restored, res.skipped),
      })

      if (res.checkins && onRestored) {
        onRestored(res.checkins)
      }
    } catch {
      setFeedback({
        type: 'error',
        message: vi.hb13.errors.invalidSchema,
      })
      setIsRestoreModalOpen(false)
    } finally {
      setIsRestoring(false)
    }
  }

  const handleCloseRestoreModal = () => {
    if (isRestoring) return
    setIsRestoreModalOpen(false)
    setPendingRawJson(null)
    setPendingBackup(null)
    setRestoreResult(null)
  }

  const handleCopyForCoach = async () => {
    setFeedback(null)
    setIsCopying(true)
    try {
      const res = await copyForCoach({ includeNotes })
      if (!res.success || !res.text) {
        setFeedback({
          type: 'error',
          message: res.message || vi.hb13.copyFailedToast,
        })
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(res.text)
      }
      setFeedback({
        type: 'success',
        message: vi.hb13.copiedToast,
      })
    } catch {
      setFeedback({
        type: 'error',
        message: vi.hb13.copyFailedToast,
      })
    } finally {
      setIsCopying(false)
    }
  }

  const handleConfirmRestart = async () => {
    setIsRestarting(true)
    setFeedback(null)
    try {
      const res = await restartJourney()
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.message || vi.hb13.errors.accessDenied,
        })
        setIsRestartModalOpen(false)
        setIsRestarting(false)
        return
      }

      try {
        window.localStorage.removeItem(HABIT_LOOP_STORAGE_KEY)
      } catch {
        // Ignore storage errors in private mode
      }

      if (typeof window !== 'undefined') {
        window.location.assign(res.redirectTo || '/habit/5-phut')
      }
    } catch {
      setFeedback({
        type: 'error',
        message: vi.hb13.errors.accessDenied,
      })
      setIsRestartModalOpen(false)
      setIsRestarting(false)
    }
  }

  return (
    <section
      aria-labelledby="my-data-heading"
      className="bg-warm-ivory rounded-card border border-deep-navy/10 p-6 sm:p-8 shadow-soft space-y-5"
    >
      <div className="space-y-2">
        <h2 id="my-data-heading" className="font-ui font-bold text-base sm:text-lg text-deep-navy">
          {vi.hb13.heading}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-deep-navy/80 leading-relaxed">
          {effectivePrivacyNote}
        </p>
      </div>

      {/* Lời nhắc mua khi hết hạn quyền dùng */}
      {readOnly && (
        <div className="p-4 rounded-xl border border-bright-magenta/20 bg-soft-pink/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-sans text-deep-navy font-medium leading-relaxed">
            {vi.hb13.expiredHint}
          </p>
          <Link
            href={buyUrl}
            className="shrink-0 inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-full bg-bright-magenta text-warm-ivory font-ui font-semibold text-xs hover:bg-bright-magenta/90 transition-colors motion-reduce:transition-none"
          >
            {vi.tracker.expiredNotice.buyButton}
          </Link>
        </div>
      )}

      {/* Tùy chọn kèm ghi chú khi sao chép gửi Coach */}
      <div className="flex items-center gap-2.5 pt-1">
        <input
          id={includeNotesId}
          type="checkbox"
          checked={includeNotes}
          onChange={(e) => setIncludeNotes(e.target.checked)}
          className="w-4 h-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
        />
        <label
          htmlFor={includeNotesId}
          className="text-xs sm:text-sm font-sans text-deep-navy cursor-pointer select-none"
        >
          {vi.hb13.includeNotesLabel}
        </label>
      </div>

      {/* Input chọn file JSON ẩn */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        aria-label={vi.hb13.fileInputAriaLabel}
        onChange={handleFileChange}
        disabled={readOnly}
        className="sr-only"
      />

      {/* 5 nút thao tác dữ liệu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleExportBackup}
          disabled={isExportingJson}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-deep-navy/15 text-deep-navy font-ui font-semibold text-xs sm:text-sm hover:bg-lavender-mist/40 transition-colors motion-reduce:transition-none disabled:opacity-50 cursor-pointer text-center"
        >
          {vi.hb13.buttons.exportBackup}
        </button>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExportingCsv}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-deep-navy/15 text-deep-navy font-ui font-semibold text-xs sm:text-sm hover:bg-lavender-mist/40 transition-colors motion-reduce:transition-none disabled:opacity-50 cursor-pointer text-center"
        >
          {vi.hb13.buttons.exportCsv(journeyDays)}
        </button>

        <button
          ref={restoreButtonRef}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={readOnly || isRestoring}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-deep-navy/15 text-deep-navy font-ui font-semibold text-xs sm:text-sm hover:bg-lavender-mist/40 transition-colors motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
        >
          {vi.hb13.buttons.restoreBackup}
        </button>

        <button
          type="button"
          onClick={handleCopyForCoach}
          disabled={isCopying}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-lavender-mist/60 border border-deep-navy/15 text-deep-navy font-ui font-semibold text-xs sm:text-sm hover:bg-lavender-mist transition-colors motion-reduce:transition-none disabled:opacity-50 cursor-pointer text-center"
        >
          {vi.hb13.buttons.copyForCoach}
        </button>

        <button
          ref={restartButtonRef}
          type="button"
          onClick={() => setIsRestartModalOpen(true)}
          disabled={readOnly || isRestarting}
          className="sm:col-span-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-soft-pink/60 border border-bright-magenta/25 text-deep-navy font-ui font-semibold text-xs sm:text-sm hover:bg-soft-pink transition-colors motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
        >
          {vi.hb13.buttons.restartJourney}
        </button>
      </div>

      {/* Thông báo kết quả / lỗi */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-sans font-medium ${
            feedback.type === 'error'
              ? 'bg-soft-pink/70 border border-bright-magenta/30 text-deep-navy'
              : 'bg-mint-haze/80 border border-deep-navy/15 text-deep-navy'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Modal xác nhận & kết quả Khôi phục từ file */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={handleCloseRestoreModal}
        title={restoreResult ? vi.hb13.restoreModal.resultTitle : vi.hb13.restoreModal.title}
        triggerRef={restoreButtonRef}
      >
        {!restoreResult ? (
          <div className="space-y-5">
            <p className="font-sans text-sm text-deep-navy leading-relaxed">
              {vi.hb13.restoreModal.confirmMessage(pendingBackup?.checkins.length ?? 0)}
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseRestoreModal}
                disabled={isRestoring}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-deep-navy/20 bg-white text-deep-navy font-ui font-semibold text-sm hover:bg-warm-ivory transition-colors cursor-pointer"
              >
                {vi.hb13.restoreModal.cancelButton}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-bright-magenta text-warm-ivory font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isRestoring
                  ? vi.hb13.restoreModal.restoringButton
                  : vi.hb13.restoreModal.confirmButton}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-mint-haze/70 border border-deep-navy/10">
              <p className="font-sans text-sm font-semibold text-deep-navy">
                {vi.hb13.restoreModal.resultSummary(restoreResult.restored, restoreResult.skipped)}
              </p>
            </div>

            {restoreResult.reasons.length > 0 && (
              <div className="p-4 rounded-xl bg-butter-cream/50 border border-deep-navy/10 space-y-2">
                <p className="font-ui text-xs font-bold uppercase text-deep-navy">
                  {vi.hb13.restoreModal.reasonsHeading}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-sans text-xs text-deep-navy/90">
                  {restoreResult.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCloseRestoreModal}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-deep-navy text-warm-ivory font-ui font-semibold text-sm hover:bg-deep-navy/90 transition-colors cursor-pointer"
              >
                {vi.hb13.restoreModal.closeButton}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận Bắt đầu lại */}
      <Modal
        isOpen={isRestartModalOpen}
        onClose={() => {
          if (!isRestarting) setIsRestartModalOpen(false)
        }}
        title={vi.hb13.restartModal.title}
        triggerRef={restartButtonRef}
      >
        <div className="space-y-5">
          <p className="font-sans text-sm text-deep-navy leading-relaxed">
            {vi.hb13.restartModal.message}
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRestartModalOpen(false)}
              disabled={isRestarting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-deep-navy/20 bg-white text-deep-navy font-ui font-semibold text-sm hover:bg-warm-ivory transition-colors cursor-pointer"
            >
              {vi.hb13.restartModal.cancelButton}
            </button>
            <button
              type="button"
              onClick={handleConfirmRestart}
              disabled={isRestarting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-bright-magenta text-warm-ivory font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isRestarting
                ? vi.hb13.restartModal.restartingButton
                : vi.hb13.restartModal.confirmButton}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
