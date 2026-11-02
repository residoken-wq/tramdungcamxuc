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
import { Puck, type Data, type Viewports, useGetPuck, usePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { puckConfig, getPuckConfig } from '@/puck/config'
import { puckVietnameseDictionary } from '@/puck/dictionary'
import {
  saveDraftAction,
  publishPageAction,
  getVersionsAction,
  getVersionDataAction,
  restoreVersionAction,
  duplicatePageAction,
  listTemplatesAction,
  deleteTemplateAction,
  type VersionSummary,
  type TemplateSummary,
} from '@/puck/actions'
import { formatVietnamDateTime, getVersionBadgeInfo } from '@/puck/version-history'
import { remapPageBlockIds } from '@/puck/template-validation'
import {
  SaveTemplateModal,
  notifyTemplatesChanged,
} from '@/puck/editor/SaveTemplateModal'
import { pageTemplateList, getTemplateData, type PageTemplateKey } from '@/puck/templates'
import { AutosaveController } from '@/puck/autosave'
import { LeftPanel } from '@/puck/editor/LeftPanel'
import { EditorToolbar } from '@/puck/editor/EditorToolbar'
import { StylePanelProvider } from '@/puck/editor/style-context'
import { FieldsWithTabs, tabFieldTypes } from '@/puck/editor/StylePanelTabs'
import { StylePreview } from '@/puck/editor/StylePreview'
import { DEFAULT_DESIGN_SYSTEM, type CleanDesignSystem } from '@/lib/design/design-system'
import { ContextMenuProvider } from '@/puck/editor/context-menu/context-menu-context'
import { BlockContextMenu } from '@/puck/editor/context-menu/BlockContextMenu'
import { ContextMenuOverlay } from '@/puck/editor/context-menu/ContextMenuOverlay'
import { ToastNotification } from '@/puck/editor/context-menu/ToastNotification'
import { OutlineWrapper } from '@/puck/editor/navigator/OutlineWrapper'

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
  /** EB-04b: brand locks + palette, loaded on the server (Brand Book defaults when absent). */
  designSystem?: CleanDesignSystem
}

type Feedback = {
  type: 'idle' | 'saving' | 'saved' | 'error'
  message: string
}

export type PreviewVersionState = {
  id: string
  dateFormatted: string
  originalData: Data
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
  previewVersion: PreviewVersionState | null
  setPreviewVersion: (preview: PreviewVersionState | null) => void
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
  const [isSavePageModalOpen, setIsSavePageModalOpen] = useState<boolean>(false)
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
    context.setPreviewVersion(null)
    setFeedback({ type: 'saved', message: vi.builder.restoredVersion })
  }

  const handlePreviewVersion = (versionId: string, dateFormatted: string, versionData: Data) => {
    const currentData = getPuck().appState.data
    context.setPreviewVersion({
      id: versionId,
      dateFormatted,
      originalData: currentData,
    })
    getPuck().dispatch({ type: 'setData', data: versionData })
    setFeedback({
      type: 'saved',
      message: vi.eb08.previewingVersion(dateFormatted),
    })
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
          title="Áp dụng một trong 4 mẫu trang dựng sẵn hoặc mẫu đã lưu"
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

        {/* Button: Lưu trang thành mẫu */}
        <button
          type="button"
          onClick={() => setIsSavePageModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-ui text-xs font-semibold bg-white text-deep-navy border border-deep-navy/20 hover:bg-soft-pink/40 transition cursor-pointer"
          title={vi.eb08.savePageTemplateDesc}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <span>{vi.eb08.savePageAsTemplate}</span>
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
      {isTemplateModalOpen && (
        <TemplateModal
          onClose={() => setIsTemplateModalOpen(false)}
          pageTitle={pageTitle}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {/* Save Page Template Modal */}
      <SaveTemplateModal
        isOpen={isSavePageModalOpen}
        onClose={() => setIsSavePageModalOpen(false)}
        kind="page"
        puckData={getPuck().appState.data}
        defaultName={pageTitle ? `${pageTitle} (Mẫu)` : 'Mẫu trang mới'}
        onSaved={() => {
          setFeedback({ type: 'saved', message: vi.eb08.savedSuccess })
          setIsSavePageModalOpen(false)
        }}
      />

      {/* Version History Modal */}
      {isHistoryModalOpen && (
        <HistoryModal
          onClose={() => setIsHistoryModalOpen(false)}
          pageId={pageId}
          onRestore={handleRestoreVersion}
          onPreview={handlePreviewVersion}
        />
      )}
    </>
  )
}

function TemplateModal({
  onClose,
  pageTitle,
  onApplyTemplate,
}: {
  onClose: () => void
  pageTitle: string
  onApplyTemplate: (templateData: Data) => void
}) {
  const [activeTab, setActiveTab] = useState<'builtin' | 'saved'>('builtin')
  const [savedTemplates, setSavedTemplates] = useState<TemplateSummary[]>([])
  const [loadingSaved, setLoadingSaved] = useState<boolean>(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    let active = true
    listTemplatesAction('page')
      .then((res) => {
        if (!active) return
        if (res.success && res.templates) {
          setSavedTemplates(res.templates)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSaved(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSelectBuiltin = (key: PageTemplateKey) => {
    const confirmed = window.confirm(vi.builder.confirmApplyTemplate)
    if (!confirmed) return

    const data = getTemplateData(key, pageTitle)
    if (data) {
      onApplyTemplate(data)
      onClose()
    }
  }

  const handleSelectSaved = (template: TemplateSummary) => {
    const confirmed = window.confirm(vi.builder.confirmApplyTemplate)
    if (!confirmed) return

    if (template.puckData && typeof template.puckData === 'object') {
      const remapped = remapPageBlockIds(template.puckData as Data)
      onApplyTemplate(remapped)
      onClose()
    }
  }

  const handleDeleteSaved = async (template: TemplateSummary) => {
    const confirmed = window.confirm(vi.eb08.confirmDeleteNamed(template.name))
    if (!confirmed) return

    setDeletingId(template.id)
    setErrorMsg('')
    try {
      const res = await deleteTemplateAction(template.id)
      if (res.success) {
        setSavedTemplates((prev) => prev.filter((t) => t.id !== template.id))
        notifyTemplatesChanged()
      } else {
        setErrorMsg(res.message || vi.eb08.deleteFailed)
      }
    } catch {
      setErrorMsg(vi.eb08.deleteFailed)
    } finally {
      setDeletingId(null)
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
        <div className="flex items-center justify-between pb-3 border-b border-deep-navy/10">
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

        {/* Tab switch: Mẫu có sẵn / Mẫu đã lưu */}
        <div className="flex items-center gap-2 border-b border-deep-navy/10 pt-2 pb-0 px-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'builtin'}
            onClick={() => setActiveTab('builtin')}
            className={`pb-2 px-3 text-xs font-ui font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'builtin'
                ? 'border-bright-magenta text-deep-navy'
                : 'border-transparent text-deep-navy/60 hover:text-deep-navy'
            }`}
          >
            {vi.eb08.groupBuiltin} ({pageTemplateList.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')}
            className={`pb-2 px-3 text-xs font-ui font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'saved'
                ? 'border-bright-magenta text-deep-navy'
                : 'border-transparent text-deep-navy/60 hover:text-deep-navy'
            }`}
          >
            {vi.eb08.groupSaved} ({savedTemplates.length})
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-soft-pink text-bright-magenta text-xs font-semibold my-2"
          >
            {errorMsg}
          </div>
        )}

        {/* Tab contents */}
        {activeTab === 'builtin' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 overflow-y-auto">
            {pageTemplateList.map((tpl) => (
              <div
                key={tpl.key}
                className="p-4 rounded-xl border border-deep-navy/15 bg-white hover:border-bright-magenta hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-deep-navy mb-1.5">{tpl.label}</h3>
                  <p className="text-xs text-deep-navy/70 leading-relaxed mb-4">
                    {tpl.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectBuiltin(tpl.key)}
                  className="w-full py-2 px-3 rounded-lg bg-deep-navy text-white text-xs font-bold hover:bg-bright-magenta transition cursor-pointer shadow-sm"
                >
                  {vi.eb08.useThisTemplate}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 overflow-y-auto flex-1 min-h-[180px]">
            {loadingSaved && (
              <div className="py-12 text-center text-xs text-deep-navy/60 font-ui">
                {vi.common.loading}
              </div>
            )}

            {!loadingSaved && savedTemplates.length === 0 && (
              <div className="py-12 text-center text-xs text-deep-navy/60 font-ui">
                {vi.eb08.noTemplates}
              </div>
            )}

            {!loadingSaved && savedTemplates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedTemplates.map((template) => {
                  const isDeleting = deletingId === template.id
                  const dateStr = new Date(template.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                  const author =
                    template.createdBy?.name || template.createdBy?.email || vi.eb08.unknownUser

                  return (
                    <div
                      key={template.id}
                      className="p-4 rounded-xl border border-deep-navy/15 bg-white hover:border-bright-magenta hover:shadow-md transition flex flex-col justify-between gap-3"
                    >
                      <div>
                        <h3 className="font-bold text-sm text-deep-navy mb-1 line-clamp-1">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-xs text-deep-navy/70 leading-relaxed mb-2 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-deep-navy/60">
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{author}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-deep-navy/10">
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(template)}
                          disabled={isDeleting}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-ui font-semibold text-bright-magenta hover:bg-soft-pink/40 transition disabled:opacity-50 cursor-pointer"
                        >
                          {isDeleting ? '…' : vi.eb08.delete}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSaved(template)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-deep-navy text-white text-xs font-bold hover:bg-bright-magenta transition cursor-pointer shadow-sm text-center"
                        >
                          {vi.eb08.useThisTemplate}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-deep-navy/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory transition cursor-pointer"
          >
            {vi.common.close}
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryModal({
  onClose,
  pageId,
  onRestore,
  onPreview,
}: {
  onClose: () => void
  pageId: string
  onRestore: (restoredData: Data, status: string) => void
  onPreview: (versionId: string, dateFormatted: string, data: Data) => void
}) {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    let active = true
    getVersionsAction(pageId, 1, 25)
      .then((res) => {
        if (!active) return
        if (res.success && res.versions) {
          setVersions(res.versions)
          setHasMore(Boolean(res.hasMore))
        } else {
          setErrorMsg(res.message || vi.builder.error)
        }
      })
      .catch(() => {
        if (!active) return
        setErrorMsg(vi.builder.error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [pageId])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await getVersionsAction(pageId, nextPage, 25)
      if (res.success && res.versions) {
        setVersions((prev) => [...prev, ...res.versions!])
        setHasMore(Boolean(res.hasMore))
        setPage(nextPage)
      }
    } catch {
      setErrorMsg(vi.builder.error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleView = async (ver: VersionSummary) => {
    setPreviewingId(ver.id)
    setErrorMsg('')
    try {
      const res = await getVersionDataAction(ver.id)
      if (res.success && res.puckData) {
        const dateFormatted = formatVietnamDateTime(ver.updatedAt)
        onPreview(ver.id, dateFormatted, res.puckData)
        onClose()
      } else {
        setErrorMsg(res.message || vi.builder.error)
      }
    } catch {
      setErrorMsg(vi.builder.error)
    } finally {
      setPreviewingId(null)
    }
  }

  const handleRestore = async (versionId: string) => {
    const confirmed = window.confirm(vi.builder.confirmRestoreVersion)
    if (!confirmed) return

    setRestoringId(versionId)
    setErrorMsg('')
    try {
      const res = await restoreVersionAction(versionId)
      if (res.success && res.puckData) {
        onRestore(res.puckData, res.status || 'draft')
        onClose()
      } else {
        setErrorMsg(res.message || vi.builder.restoreFailed)
      }
    } catch {
      setErrorMsg(vi.builder.restoreFailed)
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
            <div
              role="alert"
              className="p-3 rounded-lg bg-soft-pink text-bright-magenta text-xs font-semibold mb-3"
            >
              {errorMsg}
            </div>
          )}

          {!loading && versions.length === 0 && !errorMsg && (
            <div className="py-12 text-center text-sm text-deep-navy/60 font-ui">
              {vi.builder.noVersions}
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-2.5">
              {versions.map((ver) => {
                const dateStr = formatVietnamDateTime(ver.updatedAt)
                const badge = getVersionBadgeInfo({ status: ver.status, autosave: ver.autosave })
                const author = ver.authorName || vi.eb08.unknownUser
                const isRestoring = restoringId === ver.id
                const isViewing = previewingId === ver.id
                const isBusy = isRestoring || isViewing

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
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-deep-navy/60 flex items-center gap-2">
                        <span>
                          {vi.eb08.versionAuthor}: {author}
                        </span>
                        <span>•</span>
                        <span>Mã: {ver.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleView(ver)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-deep-navy/20 text-deep-navy text-xs font-bold hover:bg-soft-pink/40 disabled:opacity-50 transition cursor-pointer"
                      >
                        {isViewing ? '…' : vi.eb08.viewVersion}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestore(ver.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-deep-navy/20 text-deep-navy text-xs font-bold hover:bg-soft-pink/40 disabled:opacity-50 transition cursor-pointer"
                      >
                        {isRestoring ? vi.builder.restoringVersion : vi.builder.restoreVersion}
                      </button>
                    </div>
                  </div>
                )
              })}

              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-4 py-1.5 text-xs font-ui font-semibold text-deep-navy bg-white border border-deep-navy/20 rounded-lg hover:bg-soft-pink/40 disabled:opacity-50 transition cursor-pointer"
                  >
                    {loadingMore ? vi.common.loading : vi.eb08.loadMore}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-deep-navy/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory transition cursor-pointer"
          >
            {vi.common.close}
          </button>
        </div>
      </div>
    </div>
  )
}

// Elementor-style Puck layout override with docked canvas bottom toolbar and version preview banner
function PuckLayoutOverride({ children }: { children?: React.ReactNode }) {
  const context = useContext(EditorContext)
  const { dispatch } = usePuck()
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

  const handleExitPreview = () => {
    if (context?.previewVersion) {
      dispatch({ type: 'setData', data: context.previewVersion.originalData })
      context.setPreviewVersion(null)
      context.setFeedback({ type: 'idle', message: '' })
    }
  }

  const handleRestoreFromPreview = async () => {
    if (!context?.previewVersion) return
    const confirmed = window.confirm(vi.builder.confirmRestoreVersion)
    if (!confirmed) return

    const versionId = context.previewVersion.id
    context.setFeedback({ type: 'saving', message: vi.builder.restoringVersion })
    try {
      const res = await restoreVersionAction(versionId)
      if (res.success && res.puckData) {
        dispatch({ type: 'setData', data: res.puckData })
        context.autosaveController.markSaved(res.puckData)
        context.onStatusChange(res.status || 'draft')
        context.setPreviewVersion(null)
        context.setFeedback({ type: 'saved', message: vi.builder.restoredVersion })
      } else {
        context.setFeedback({ type: 'error', message: res.message || vi.builder.restoreFailed })
      }
    } catch {
      context.setFeedback({ type: 'error', message: vi.builder.restoreFailed })
    }
  }

  return (
    <>
      {children}
      {context?.previewVersion &&
        canvasEl &&
        createPortal(
          <div
            role="status"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-bright-magenta text-white py-2 px-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-ui font-semibold animate-in fade-in slide-in-from-top-2 select-none"
          >
            <span>
              {vi.eb08.previewingVersion(context.previewVersion.dateFormatted)}
            </span>
            <div className="flex items-center gap-1.5 border-l border-white/30 pl-3">
              <button
                type="button"
                onClick={handleExitPreview}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition cursor-pointer"
              >
                {vi.eb08.previewExit}
              </button>
              <button
                type="button"
                onClick={handleRestoreFromPreview}
                className="px-2.5 py-1 rounded-lg bg-white text-deep-navy hover:bg-mint-haze font-bold transition cursor-pointer shadow-sm"
              >
                {vi.eb08.previewRestore}
              </button>
            </div>
          </div>,
          canvasEl,
        )}
      {canvasEl &&
        createPortal(
          <EditorToolbar
            pageSlug={context?.pageSlug || ''}
            currentStatus={context?.currentStatus || 'draft'}
          />,
          canvasEl,
        )}
      <BlockContextMenu />
    </>
  )
}

// Stable overrides identity: Header actions, LeftPanel (blocks & outline), Puck layout override
const editorOverrides = {
  headerActions: EditorHeaderActions,
  puck: PuckLayoutOverride,
  // EB-04b: Content / Style / Advanced tabs and live block styles in the preview.
  fields: FieldsWithTabs,
  fieldTypes: tabFieldTypes,
  iframe: StylePreview,
  // EB-07: Canvas context menu overlay and custom Navigator outline
  componentOverlay: ContextMenuOverlay,
  outline: OutlineWrapper,
}

// EB-03c: Puck renders every left-sidebar plugin at once (inactive ones only hidden by CSS), so
// overriding just the drawer left Puck's own Outline mounted beside ours – two outlines and two
// copies of each layer in the DOM. Replace the "blocks" plugin with LeftPanel (blocks + outline
// tabs) and blank out the default "outline" plugin so each item exists once.
const editorPlugins = [
  { name: 'blocks', label: vi.eb03.tabBlocks, render: LeftPanel },
  { name: 'outline', label: vi.eb03.tabOutline, render: () => <></> },
]

export function PuckEditorClient({
  initialData,
  pageId,
  pageTitle,
  pageSlug,
  initialStatus,
  designSystem = DEFAULT_DESIGN_SYSTEM,
}: PuckEditorClientProps) {
  const [feedback, setFeedback] = useState<Feedback>({ type: 'idle', message: '' })
  const [docStatus, setDocStatus] = useState<string>(initialStatus)
  const [previewVersion, setPreviewVersion] = useState<PreviewVersionState | null>(null)

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
    <StylePanelProvider ds={designSystem}>
      <ContextMenuProvider>
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
            previewVersion,
            setPreviewVersion,
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
                plugins={editorPlugins}
                onChange={(data) => {
                  autosaveController.setData(data)
                }}
                onAction={(_action) => {
                  // Action handler hook if needed
                }}
              />
            </div>
          </div>
          <ToastNotification />
        </EditorContext.Provider>
      </ContextMenuProvider>
    </StylePanelProvider>
  )
}
