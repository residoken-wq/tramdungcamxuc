import React from 'react'
import { vi } from '@/lib/i18n/vi'
import type { CourseModuleItem } from '@/lib/courses/types'
import { LessonCard } from './LessonCard'

export interface ModuleSectionProps {
  module: CourseModuleItem
  moduleIndex: number
}

export function ModuleSection({ module, moduleIndex }: ModuleSectionProps) {
  const groupLabel = vi.learning.dashboard.groups[module.group] || module.group

  return (
    <section aria-labelledby={`module-heading-${module.id}`} className="space-y-4">
      {/* Module Header */}
      <div className="flex flex-col gap-1 border-b border-lavender-mist/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-soft-pink px-2.5 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wider text-bright-magenta">
            {groupLabel}
          </span>
          <span className="font-ui text-xs font-semibold text-deep-navy/50">
            {vi.learning.dashboard.sectionPart(moduleIndex + 1)}
          </span>
        </div>
        <h3
          id={`module-heading-${module.id}`}
          className="font-ui text-lg sm:text-xl font-bold text-deep-navy"
        >
          {module.title}
        </h3>
      </div>

      {/* Module Lessons Grid */}
      {module.lessons.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {module.lessons.map((lesson, idx) => (
            <LessonCard key={lesson.id} lesson={lesson} index={idx} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-lavender-mist/80 p-4 text-center font-body text-sm text-deep-navy/60">
          {vi.learning.dashboard.emptyModule}
        </p>
      )}
    </section>
  )
}
