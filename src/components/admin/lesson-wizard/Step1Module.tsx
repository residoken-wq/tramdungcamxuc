'use client'

import React, { useState } from 'react'
import type { CourseModuleOption } from '@/lib/cms/lesson-wizard.server'
import { createCourseModuleQuickAction } from '@/lib/cms/lesson-wizard.server'
import { vi } from '@/lib/i18n/vi'

interface Step1ModuleProps {
  selectedModuleId?: number | string
  modules: CourseModuleOption[]
  onSelectModule: (moduleId: number | string) => void
  onModuleCreated?: (newModule: CourseModuleOption) => void
}

export function Step1Module({
  selectedModuleId,
  modules,
  onSelectModule,
  onModuleCreated,
}: Step1ModuleProps) {
  const [showNewModuleForm, setShowNewModuleForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGroup, setNewGroup] = useState<'insight' | 'principle' | 'technique'>('insight')
  const [newOrder, setNewOrder] = useState<number>(modules.length + 1)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setCreateError(vi.cms.lessonWizard.errors.createModuleFailed)
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await createCourseModuleQuickAction({
        title: newTitle.trim(),
        group: newGroup,
        order: newOrder,
      })

      if (res.success && res.docId) {
        const createdOption: CourseModuleOption = {
          id: res.docId,
          title: res.title || newTitle.trim(),
          group: newGroup,
          order: newOrder,
        }
        onSelectModule(res.docId)
        if (onModuleCreated) {
          onModuleCreated(createdOption)
        }
        setShowNewModuleForm(false)
        setNewTitle('')
      } else {
        setCreateError(res.error || vi.cms.lessonWizard.errors.createModuleFailed)
      }
    } catch {
      setCreateError(vi.cms.lessonWizard.errors.createModuleFailed)
    } finally {
      setIsCreating(false)
    }
  }

  const getGroupName = (group?: string) => {
    switch (group) {
      case 'insight':
        return vi.cms.lessonWizard.labels.newModuleGroupOptions.insight
      case 'principle':
        return vi.cms.lessonWizard.labels.newModuleGroupOptions.principle
      case 'technique':
        return vi.cms.lessonWizard.labels.newModuleGroupOptions.technique
      default:
        return group || 'Bài học'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
            {vi.cms.lessonWizard.steps.step1.title}
          </h2>
          <p className="mt-1 font-ui text-sm text-deep-navy/70">
            {vi.cms.lessonWizard.steps.step1.description}
          </p>
        </div>

        {!showNewModuleForm && (
          <button
            type="button"
            onClick={() => setShowNewModuleForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-bright-magenta/30 bg-soft-pink/40 px-3.5 py-2 font-ui text-xs font-bold text-bright-magenta shadow-sm transition-all hover:bg-soft-pink hover:text-deep-navy"
          >
            {vi.cms.lessonWizard.labels.createModuleToggle}
          </button>
        )}
      </div>

      {/* Form tạo nhanh nhóm mới */}
      {showNewModuleForm && (
        <form
          onSubmit={handleCreateModule}
          className="rounded-2xl border-2 border-bright-magenta/20 bg-warm-ivory/60 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-ui text-sm font-bold text-deep-navy">
              {vi.cms.lessonWizard.labels.createModuleToggle}
            </h3>
            <button
              type="button"
              onClick={() => setShowNewModuleForm(false)}
              className="font-ui text-xs font-semibold text-deep-navy/60 hover:text-accent-pink"
            >
              {vi.cms.lessonWizard.buttons.cancelNewModule}
            </button>
          </div>

          {createError && (
            <div className="rounded-xl border border-accent-pink/40 bg-soft-pink p-3 text-xs text-accent-pink">
              ⚠️ {createError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block font-ui text-xs font-bold text-deep-navy">
                {vi.cms.lessonWizard.labels.newModuleTitle} <span className="text-accent-pink">*</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={vi.cms.lessonWizard.labels.newModuleTitlePlaceholder}
                className="w-full rounded-xl border border-lavender-mist bg-white px-3.5 py-2 font-ui text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-ui text-xs font-bold text-deep-navy">
                {vi.cms.lessonWizard.labels.newModuleGroup}
              </label>
              <select
                value={newGroup}
                onChange={(e) =>
                  setNewGroup(e.target.value as 'insight' | 'principle' | 'technique')
                }
                className="w-full rounded-xl border border-lavender-mist bg-white px-3.5 py-2 font-ui text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
              >
                <option value="insight">
                  {vi.cms.lessonWizard.labels.newModuleGroupOptions.insight}
                </option>
                <option value="principle">
                  {vi.cms.lessonWizard.labels.newModuleGroupOptions.principle}
                </option>
                <option value="technique">
                  {vi.cms.lessonWizard.labels.newModuleGroupOptions.technique}
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewModuleForm(false)}
              className="rounded-xl border border-lavender-mist bg-white px-4 py-2 font-ui text-xs font-semibold text-deep-navy/70 hover:bg-soft-pink/30"
            >
              {vi.cms.lessonWizard.buttons.cancelNewModule}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-bright-magenta px-4 py-2 font-ui text-xs font-bold text-white shadow-sm transition-all hover:bg-accent-pink disabled:opacity-50"
            >
              {isCreating
                ? vi.cms.lessonWizard.buttons.creatingModule
                : vi.cms.lessonWizard.buttons.createModule}
            </button>
          </div>
        </form>
      )}

      {/* Danh sách module hiện có */}
      {modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-lavender-mist bg-white p-8 text-center">
          <p className="font-ui text-sm text-deep-navy/70">
            Chưa có nhóm bài học nào trong khóa Habit. Vui lòng bấm &ldquo;Tạo nhóm bài học mới&rdquo; ở trên để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {modules.map((mod) => {
            const isSelected = String(mod.id) === String(selectedModuleId)
            return (
              <button
                key={mod.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectModule(mod.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-bright-magenta bg-soft-pink/20 shadow-md ring-2 ring-bright-magenta/20'
                    : 'border-lavender-mist/60 bg-white hover:border-lavender-mist hover:bg-warm-ivory/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-lavender-mist/60 px-2.5 py-0.5 font-ui text-[11px] font-bold text-deep-navy">
                      {getGroupName(mod.group)}
                    </span>
                    <h4 className="mt-2 font-ui text-sm font-bold text-deep-navy group-hover:text-bright-magenta">
                      {mod.title}
                    </h4>
                  </div>
                  {isSelected && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bright-magenta text-xs font-bold text-white">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-deep-navy/60 font-ui">
                  <span>Thứ tự nhóm: #{mod.order ?? 0}</span>
                  <span className={isSelected ? 'font-bold text-bright-magenta' : ''}>
                    {isSelected ? '✓ Đang chọn nhóm này' : 'Nhấn để chọn →'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
