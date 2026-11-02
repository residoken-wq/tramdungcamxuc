'use client'

import React, { useState, useEffect, useRef } from 'react'
import { vi } from '@/lib/i18n/vi'
import { saveTemplateAction, type TemplateSummary } from '@/puck/actions'

export const TEMPLATES_CHANGED_EVENT = 'eb08:templates-changed'

export function notifyTemplatesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TEMPLATES_CHANGED_EVENT))
  }
}

export type SaveTemplateModalProps = {
  isOpen: boolean
  onClose: () => void
  kind: 'section' | 'page'
  puckData: unknown
  defaultName?: string
  onSaved?: (template: TemplateSummary) => void
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  kind,
  puckData,
  defaultName = '',
  onSaved,
}: SaveTemplateModalProps) {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const nameInputRef = useRef<HTMLInputElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null
      setName(defaultName || '')
      setDescription('')
      setErrorMsg('')
      setIsSaving(false)

      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
        nameInputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus()
      }
    }
  }, [isOpen, defaultName])

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMsg(vi.eb08.templateNameRequired)
      nameInputRef.current?.focus()
      return
    }

    if (trimmedName.length > 80) {
      setErrorMsg(vi.eb08.templateNameTooLong)
      nameInputRef.current?.focus()
      return
    }

    setIsSaving(true)
    try {
      const res = await saveTemplateAction({
        name: trimmedName,
        kind,
        puckData,
        description: description.trim() || undefined,
      })

      if (res.success && res.template) {
        notifyTemplatesChanged()
        if (onSaved) {
          onSaved(res.template)
        }
        onClose()
      } else {
        setErrorMsg(res.message || vi.eb08.saveFailed)
      }
    } catch {
      setErrorMsg(vi.eb08.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  const modalTitle = kind === 'section' ? vi.eb08.saveTemplateTitle : vi.eb08.savePageTemplateTitle
  const modalDesc = kind === 'section' ? vi.eb08.saveTemplateDesc : vi.eb08.savePageTemplateDesc

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-deep-navy/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <div className="bg-warm-ivory rounded-2xl border border-deep-navy/15 shadow-2xl max-w-lg w-full p-6 text-deep-navy flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-deep-navy/10">
          <div>
            <h2
              id="save-template-modal-title"
              className="text-base font-bold font-ui text-deep-navy"
            >
              {modalTitle}
            </h2>
            <p className="text-xs text-deep-navy/70 mt-0.5">{modalDesc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/40 transition disabled:opacity-50"
            aria-label={vi.common.close}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-soft-pink text-bright-magenta text-xs font-semibold"
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="template-name-input"
              className="block text-xs font-bold font-ui text-deep-navy mb-1"
            >
              {vi.eb08.name} <span className="text-accent-pink">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="template-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={vi.eb08.namePlaceholder}
              maxLength={80}
              disabled={isSaving}
              className="w-full px-3 py-2 text-xs rounded-lg border border-deep-navy/20 bg-white text-deep-navy focus:outline-none focus:ring-2 focus:ring-bright-magenta font-ui"
            />
            <div className="text-[10px] text-deep-navy/50 text-right mt-1">{name.length}/80</div>
          </div>

          <div>
            <label
              htmlFor="template-description-input"
              className="block text-xs font-bold font-ui text-deep-navy mb-1"
            >
              {vi.eb08.description}
            </label>
            <textarea
              id="template-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={vi.eb08.descriptionPlaceholder}
              disabled={isSaving}
              className="w-full px-3 py-2 text-xs rounded-lg border border-deep-navy/20 bg-white text-deep-navy focus:outline-none focus:ring-2 focus:ring-bright-magenta font-ui resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-deep-navy/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory transition disabled:opacity-50"
            >
              {vi.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-2 rounded-lg font-ui text-xs font-bold bg-deep-navy text-white hover:bg-bright-magenta transition disabled:opacity-50 shadow-sm"
            >
              {isSaving ? vi.eb08.saving : vi.eb08.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
