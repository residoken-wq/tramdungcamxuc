'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { usePuck, type ComponentData } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { listTemplatesAction, deleteTemplateAction, type TemplateSummary } from '@/puck/actions'
import { prepareForPaste } from '@/puck/editor/context-menu/clipboard'
import { normalizeVi } from './block-search'
import { TEMPLATES_CHANGED_EVENT, notifyTemplatesChanged } from './SaveTemplateModal'
import { useContextMenu } from './context-menu/context-menu-context'

export function TemplatesTab() {
  const { config, dispatch, appState, getParentById, getItemById } = usePuck()
  const { showToast } = useContextMenu()

  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await listTemplatesAction('section')
      if (res.success && res.templates) {
        setTemplates(res.templates)
      }
    } catch {
      // Ignore background fetch error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()

    const handleTemplatesChanged = () => {
      fetchTemplates()
    }

    window.addEventListener(TEMPLATES_CHANGED_EVENT, handleTemplatesChanged)
    return () => window.removeEventListener(TEMPLATES_CHANGED_EVENT, handleTemplatesChanged)
  }, [fetchTemplates])

  const filteredTemplates = useMemo(() => {
    const q = normalizeVi(searchQuery.trim())
    if (!q) return templates
    return templates.filter((t) => {
      const nameMatch = normalizeVi(t.name).includes(q)
      const descMatch = t.description ? normalizeVi(t.description).includes(q) : false
      return nameMatch || descMatch
    })
  }, [templates, searchQuery])

  const handleInsert = useCallback(
    (template: TemplateSummary) => {
      setErrorMsg('')
      if (!template.puckData) return

      const itemSelector = appState.ui.itemSelector
      let targetZone = 'root:default-zone'
      let targetIndex = (appState.data.content || []).length
      let parentType: string | undefined

      if (itemSelector) {
        targetZone = itemSelector.zone || 'root:default-zone'
        targetIndex = itemSelector.index + 1

        if (targetZone.includes(':') && !targetZone.startsWith('root:')) {
          const parentId = targetZone.slice(0, targetZone.indexOf(':'))
          const parentItem = getItemById ? (getItemById(parentId) as ComponentData) : null
          parentType = parentItem?.type
        }
      }

      const pasteValidation = prepareForPaste(template.puckData, config, targetZone, parentType)
      if (!pasteValidation.success) {
        setErrorMsg(vi.eb08.cannotInsertDisallowed)
        return
      }

      const newItem = pasteValidation.item

      dispatch({
        type: 'insert',
        componentType: newItem.type,
        destinationIndex: targetIndex,
        destinationZone: targetZone,
        id: String(newItem.props.id),
      })
      dispatch({
        type: 'replace',
        destinationIndex: targetIndex,
        destinationZone: targetZone,
        data: newItem,
      })
      dispatch({
        type: 'setUi',
        ui: {
          itemSelector: { index: targetIndex, zone: targetZone },
        },
      })
      showToast(vi.eb08.insertSuccess)
    },
    [appState.ui.itemSelector, appState.data.content, getItemById, config, dispatch, showToast],
  )

  const handleDelete = useCallback(
    async (template: TemplateSummary) => {
      const confirmed = window.confirm(vi.eb08.confirmDeleteNamed(template.name))
      if (!confirmed) return

      setDeletingId(template.id)
      setErrorMsg('')
      try {
        const res = await deleteTemplateAction(template.id)
        if (res.success) {
          setTemplates((prev) => prev.filter((t) => t.id !== template.id))
          notifyTemplatesChanged()
          showToast(vi.eb08.deleteSuccess)
        } else {
          setErrorMsg(res.message || vi.eb08.deleteFailed)
        }
      } catch {
        setErrorMsg(vi.eb08.deleteFailed)
      } finally {
        setDeletingId(null)
      }
    },
    [showToast],
  )

  return (
    <div
      role="tabpanel"
      id="panel-templates"
      aria-labelledby="tab-templates"
      className="flex-1 min-h-0 flex flex-col p-3 text-deep-navy overflow-hidden"
    >
      {/* Search Input */}
      <div className="relative mb-3 shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={vi.eb08.searchPlaceholder}
          aria-label={vi.eb08.searchPlaceholder}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-deep-navy/15 bg-white text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:border-transparent font-ui"
        />
        <svg
          className="w-4 h-4 text-deep-navy/40 absolute left-2.5 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-2.5 rounded-lg bg-soft-pink text-bright-magenta text-xs font-semibold mb-3 shrink-0"
        >
          {errorMsg}
        </div>
      )}

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {loading && (
          <div className="py-12 text-center text-xs text-deep-navy/60 font-ui">
            {vi.common.loading}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="py-12 text-center text-xs text-deep-navy/60 font-ui">
            {vi.eb08.noTemplates}
          </div>
        )}

        {!loading && templates.length > 0 && filteredTemplates.length === 0 && (
          <div className="py-8 text-center text-xs text-deep-navy/60 font-ui">
            {vi.eb08.noSearchResults}
          </div>
        )}

        {!loading &&
          filteredTemplates.map((template) => {
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
                className="p-3 rounded-xl border border-deep-navy/10 bg-white hover:border-deep-navy/20 hover:shadow-sm transition flex flex-col justify-between gap-2"
              >
                <div>
                  <h4 className="font-ui font-bold text-xs text-deep-navy line-clamp-1">
                    {template.name}
                  </h4>
                  {template.description && (
                    <p className="text-[11px] text-deep-navy/70 line-clamp-2 mt-0.5 leading-relaxed">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-deep-navy/50">
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{author}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-deep-navy/5">
                  <button
                    type="button"
                    onClick={() => handleDelete(template)}
                    disabled={isDeleting}
                    className="px-2 py-1 rounded-md text-[11px] font-ui font-semibold text-accent-pink hover:bg-soft-pink/40 transition disabled:opacity-50"
                  >
                    {isDeleting ? '…' : vi.eb08.delete}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsert(template)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-ui font-bold bg-deep-navy text-white hover:bg-bright-magenta transition shadow-sm"
                  >
                    {vi.eb08.insert}
                  </button>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
