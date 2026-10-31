'use client'

import React, {
  createContext,
  useContext,
  useState,
  useTransition,
  useMemo,
  useEffect,
} from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Puck, type Data, type Viewports, useGetPuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { puckConfig, getPuckConfig } from '@/puck/config'
import { puckVietnameseDictionary } from '@/puck/dictionary'
import {
  saveDraftAction,
  publishPageAction,
  getVersionsAction,
  restoreVersionAction,
  duplicatePageAction,
  type VersionSummary,
} from '@/puck/actions'
import { pageTemplateList, getTemplateData, type PageTemplateKey } from '@/puck/templates'
import { AutosaveController } from '@/puck/autosave'
import { LeftPanel } from '@/puck/editor/LeftPanel'
import { EditorToolbar } from '@/puck/editor/EditorToolbar'

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

type EditorContextValue = {
  pageId: string
  pageTitle: string
  pageSlug: string
  currentStatus: string
  onStatusChange: (status: string) => void
  feedback: Feedback
  setFeedback: (feedback: Feedback) => void
  autosaveController: AutosaveController
}

const EditorContext = createContext<EditorContextValue | null>(null)

function EditorHeaderActions() {
  const context = useContext(EditorContext)
  // Read Puck state at click time. A value captured from the last render can lag behind a just
  // committed drag-and-drop move, so Save / Publish would send the previous order (PK-06).
  const getPuck = useGetPuck()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false)

  if (!context) throw new Error('EditorHeaderActions requires EditorContext')
  const {
    pageId,
    pageTitle,
    pageSlug,
    currentStatus,
    onStatusChange,
    feedback,
    setFeedback,
    autosaveController,
  } = context

  const previewHref = pageSlug === '/' ? '/' : `/${pageSlug}`

  const handleApplyTemplate = (templateData: Data) => {
    getPuck().dispatch({ type: 'setData', data: templateData })
    autosaveController.setData(templateData)
    setFeedback({ type: 'saved', message: vi.builder.templateApplied })
  }

  const handleRestoreVersion = (restoredData: Data, newStatus: string) => {
    getPuck().dispatch({ type: 'setData', data: restoredData })
    autosaveController.markSaved(restoredData)
    onStatusChange(newStatus)
    setFeedback({ type: 'saved', message: vi.builder.restoredVersion })
  }

  const handleSaveDraft = () => {
    setFeedback({ type: 'saving', message: vi.builder.saving })
    startTransition(async () => {
      try {
        const data = getPuck().appState.data
        const result = await saveDraftAction(pageId, data)
        if (result.success) {
          autosaveController.markSaved(data)
          const time = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
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
    autosaveController.setPublishing(true)
    startTransition(async () => {
      try {
        const data = getPuck().appState.data
        const result = await publishPageAction(pageId, data)
        if (result.success) {
          autosaveController.markSaved(data)
          const time = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
          setFeedback({ type: 'saved', message: `${vi.builder.published} (${time})` })
          onStatusChange('published')
        } else {
          setFeedback({ type: 'error', message: result.message || vi.builder.publishFailed })
        }
      } catch {
        setFeedback({ type: 'error', message: vi.builder.publishConnectionFailed })
      } finally {
        autosaveController.setPublishing(false)
      }
    })
  }

  const handleDuplicatePage = () => {
    setFeedback({ type: 'saving', message: vi.builder.duplicatingPage })
    startTransition(async () => {
      try {
        const result = await duplicatePageAction(pageId)
        if (result.success && result.newPageId) {
          router.push(`/builder/${result.newPageId}`)
        } else {
          setFeedback({
            type: 'error',
            message: result.message || vi.builder.duplicatePageFailed,
          })
        }
      } catch {
        setFeedback({ type: 'error', message: vi.builder.duplicatePageFailed })
      }
    })
  }

  const isSaving = isPending || feedback.type === 'saving'

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Status & Feedback message */}
        {feedback.message && (
          <span
            role="status"
            className={`text-xs font-ui px-2.5 py-1 rounded-full transition-all ${
              feedback.type === 'error'
                ? 'bg-soft-pink text-bright-magenta font-semibold'
                : feedback.type === 'saved'
                  ? 'bg-mint-haze text-deep-navy font-semibold'
                  : 'bg-butter-cream text-deep-navy'
            }`}
          >
            {feedback.message}
          </span>
        )}

        {/* Button: Dùng mẫu... */}
        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-ui text-xs font-semibold bg-white text-deep-navy border border-deep-navy/20 hover:bg-soft-pink/40 transition cursor-pointer"
          title="Áp dụng một trong 4 mẫu trang dựng sẵn"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <span>{vi.builder.useTemplate}</span>
        </button>

        {/* Button: Lịch sử */}
        <button
          type="button"
          onClick={() => setIsHistoryModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-ui text-xs font-semibold bg-white text-deep-navy border border-deep-navy/20 hover:bg-soft-pink/40 transition cursor-pointer"
          title="Xem và khôi phục các phiên bản trước"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{vi.builder.history}</span>
        </button>

        {/* Button: Nhân bản trang */}
        <button
          type="button"
          onClick={handleDuplicatePage}
          disabled={isSaving}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-ui text-xs font-semibold bg-white text-deep-navy border border-deep-navy/20 hover:bg-soft-pink/40 disabled:opacity-50 transition cursor-pointer"
          title="Tạo bản sao mới của trang này"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
            />
          </svg>
          <span>{vi.builder.duplicatePage}</span>
        </button>

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

        {/* Button: Lưu nháp */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg font-ui text-xs font-bold bg-white text-deep-navy border border-deep-navy/30 hover:bg-soft-pink/40 disabled:opacity-50 transition cursor-pointer"
        >
          {isSaving ? vi.builder.processing : vi.builder.saveDraft}
        </button>

        {/* Button: Xuất bản */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={isSaving}
          className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-ui text-xs font-bold bg-deep-navy text-white hover:opacity-90 disabled:opacity-50 transition shadow-sm cursor-pointer"
        >
          {isSaving ? vi.builder.processing : vi.builder.publish}
        </button>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        pageTitle={pageTitle}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Version History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        pageId={pageId}
        onRestore={handleRestoreVersion}
      />
    </>
  )
}

function TemplateModal({
  isOpen,
  onClose,
  pageTitle,
  onApplyTemplate,
}: {
  isOpen: boolean
  onClose: () => void
  pageTitle: string
  onApplyTemplate: (templateData: Data) => void
}) {
  if (!isOpen) return null

  const handleSelect = (key: PageTemplateKey) => {
    const confirmed = window.confirm(vi.builder.confirmApplyTemplate)
    if (!confirmed) return

    const data = getTemplateData(key, pageTitle)
    if (data) {
      onApplyTemplate(data)
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-deep-navy/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-warm-ivory rounded-2xl border border-deep-navy/15 shadow-2xl max-w-2xl w-full p-6 text-deep-navy flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-deep-navy/10">
          <h2 id="template-modal-title" className="text-lg font-bold font-ui text-deep-navy">
            {vi.builder.selectTemplateTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/40 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 overflow-y-auto">
          {pageTemplateList.map((tpl) => (
            <div
              key={tpl.key}
              className="p-4 rounded-xl border border-deep-navy/15 bg-white hover:border-bright-magenta hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-sm text-deep-navy mb-1.5">{tpl.label}</h3>
                <p className="text-xs text-deep-navy/70 leading-relaxed mb-4">{tpl.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleSelect(tpl.key)}
                className="w-full py-2 px-3 rounded-lg bg-deep-navy text-white text-xs font-bold hover:bg-bright-magenta transition"
              >
                Áp dụng mẫu này
              </button>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-deep-navy/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory transition"
          >
            {vi.common.close}
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryModal({
  isOpen,
  onClose,
  pageId,
  onRestore,
}: {
  isOpen: boolean
  onClose: () => void
  pageId: string
  onRestore: (restoredData: Data, status: string) => void
}) {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    let active = true
    if (!isOpen) return

    getVersionsAction(pageId)
      .then((res) => {
        if (!active) return
        if (res.success && res.versions) {
          setVersions(res.versions)
        } else {
          setErrorMsg(res.message || vi.builder.error)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setErrorMsg(vi.builder.error)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, pageId])

  if (!isOpen) return null

  const handleRestore = async (versionId: string) => {
    const confirmed = window.confirm(vi.builder.confirmRestoreVersion)
    if (!confirmed) return

    setRestoringId(versionId)
    try {
      const res = await restoreVersionAction(versionId)
      if (res.success && res.puckData) {
        onRestore(res.puckData, res.status || 'draft')
        onClose()
      } else {
        alert(res.message || vi.builder.restoreFailed)
      }
    } catch {
      alert(vi.builder.restoreFailed)
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-deep-navy/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-warm-ivory rounded-2xl border border-deep-navy/15 shadow-2xl max-w-xl w-full p-6 text-deep-navy flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-deep-navy/10">
          <h2 id="history-modal-title" className="text-lg font-bold font-ui text-deep-navy">
            {vi.builder.historyTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/40 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="py-4 overflow-y-auto flex-1 min-h-[160px]">
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm text-deep-navy/60 font-ui">
              {vi.common.loading}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-soft-pink text-bright-magenta text-xs font-semibold mb-3">
              {errorMsg}
            </div>
          )}

          {!loading && versions.length === 0 && !errorMsg && (
            <div className="py-12 text-center text-sm text-deep-navy/60">
              {vi.builder.noVersions}
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-2.5">
              {versions.map((ver) => {
                const dateStr = new Date(ver.updatedAt).toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                })
                const isRestoring = restoringId === ver.id

                return (
                  <div
                    key={ver.id}
                    className="p-3.5 rounded-xl border border-deep-navy/10 bg-white flex items-center justify-between gap-3 hover:border-deep-navy/20 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-ui font-semibold text-xs text-deep-navy">
                          {dateStr}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            ver.status === 'published'
                              ? 'bg-mint-haze text-deep-navy'
                              : 'bg-soft-pink text-deep-navy'
                          }`}
                        >
                          {ver.status === 'published'
                            ? vi.builder.publishedStatus
                            : vi.builder.draftStatus}
                        </span>
                        {ver.autosave && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-butter-cream text-deep-navy font-semibold">
                            Tự lưu
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-deep-navy/60">Mã phiên bản: {ver.id}</div>
                    </div>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleRestore(ver.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-deep-navy/25 text-deep-navy text-xs font-bold hover:bg-soft-pink/40 disabled:opacity-50 transition"
                    >
                      {isRestoring ? vi.builder.restoringVersion : vi.builder.restoreVersion}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-deep-navy/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory transition"
          >
            {vi.common.close}
          </button>
        </div>
      </div>
    </div>
  )
}

// Elementor-style Puck layout override with docked canvas bottom toolbar
function PuckLayoutOverride({ children }: { children?: React.ReactNode }) {
  const context = useContext(EditorContext)
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const findCanvas = () => {
      const el = document.querySelector<HTMLElement>('[class*="_PuckCanvas_"]')
      if (el) {
        setCanvasEl(el)
        return true
      }
      return false
    }

    if (findCanvas()) return

    const timer = setInterval(() => {
      if (findCanvas()) {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {children}
      {canvasEl &&
        createPortal(
          <EditorToolbar
            pageSlug={context?.pageSlug || ''}
            currentStatus={context?.currentStatus || 'draft'}
          />,
          canvasEl,
        )}
    </>
  )
}

// Stable overrides identity: Header actions, LeftPanel (blocks & outline), Puck layout override
const editorOverrides = {
  headerActions: EditorHeaderActions,
  drawer: LeftPanel,
  puck: PuckLayoutOverride,
}

export function PuckEditorClient({
  initialData,
  pageId,
  pageTitle,
  pageSlug,
  initialStatus,
}: PuckEditorClientProps) {
  const [feedback, setFeedback] = useState<Feedback>({ type: 'idle', message: '' })
  const [docStatus, setDocStatus] = useState<string>(initialStatus)

  // Memoized config tailored for pageSlug (with locked permissions for Hero on homepage)
  const config = useMemo(() => {
    return typeof getPuckConfig === 'function' ? getPuckConfig({ pageSlug }) : puckConfig
  }, [pageSlug])

  // Setup Autosave Controller with useState initializer (pure, runs once, stable instance)
  const [autosaveController] = useState(() => {
    const ctrl = new AutosaveController({
      intervalMs: 30000,
      onSave: async (dataToSave) => {
        const res = await saveDraftAction(pageId, dataToSave)
        return res.success
      },
      onAutoSaveSuccess: (timeString) => {
        setFeedback({
          type: 'saved',
          message: vi.builder.autoSavedAt(timeString),
        })
      },
    })
    ctrl.init(initialData)
    return ctrl
  })

  // Start autosave interval timer
  useEffect(() => {
    const cleanup = autosaveController.start()
    return cleanup
  }, [autosaveController])

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autosaveController.isDirty()) {
        e.preventDefault()
        e.returnValue = vi.builder.unsavedChangesPrompt
        return vi.builder.unsavedChangesPrompt
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [autosaveController])

  return (
    <EditorContext.Provider
      value={{
        pageId,
        pageTitle,
        pageSlug,
        currentStatus: docStatus,
        onStatusChange: setDocStatus,
        feedback,
        setFeedback,
        autosaveController,
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
            <span className="font-ui font-bold truncate max-w-xs sm:max-w-md">{pageTitle}</span>
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
            config={config}
            data={initialData}
            viewports={brandViewports}
            dictionary={puckVietnameseDictionary}
            iframe={{
              enabled: true,
              waitForStyles: true,
            }}
            overrides={editorOverrides}
            onChange={(data) => {
              autosaveController.setData(data)
            }}
            onAction={(_action) => {
              // Action handler hook if needed
            }}
          />
        </div>
      </div>
    </EditorContext.Provider>
  )
}
