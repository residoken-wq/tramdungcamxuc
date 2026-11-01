'use client'

import React from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { isFieldVisible, type PanelTab } from '@/puck/style/field-groups'
import { useStylePanel } from './style-context'

const usePuckSelector = createUsePuck()

const TABS: PanelTab[] = ['content', 'style', 'advanced']

/**
 * EB-04b `overrides.fields`: Elementor-style tab bar (Nội dung / Kiểu / Nâng cao) above the fields
 * of the selected block. The page (root) has no tabs.
 */
export function FieldsWithTabs({
  children,
  itemSelector,
}: {
  children: React.ReactNode
  isLoading: boolean
  itemSelector?: unknown
}) {
  const { tab, setTab } = useStylePanel()
  if (!itemSelector) return <>{children}</>
  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        aria-label={vi.eb04.tabs.label}
        className="sticky top-0 z-10 flex border-b border-deep-navy/10 bg-white"
      >
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 px-2 py-2.5 font-ui text-xs font-semibold transition ${
              tab === id
                ? 'border-b-2 border-bright-magenta text-deep-navy'
                : 'border-b-2 border-transparent text-deep-navy/70 hover:text-deep-navy'
            }`}
          >
            {vi.eb04.tabs[id]}
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}

/** Wraps Puck's default renderer of one field and hides it outside its tab. */
function TabFilteredField({ name, children }: { name: string; children: React.ReactNode }) {
  const { tab } = useStylePanel()
  const hasSelection = usePuckSelector((s) => Boolean(s.selectedItem))
  if (!hasSelection) return <>{children}</>
  return isFieldVisible(name, tab) ? <>{children}</> : null
}

const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'select',
  'radio',
  'array',
  'object',
  'external',
  'custom',
  'slot',
  'richtext',
] as const

/** EB-04b `overrides.fieldTypes`: same wrapper for every field type. */
export const tabFieldTypes = Object.fromEntries(
  FIELD_TYPES.map((type) => [type, TabFilteredField]),
) as Record<(typeof FIELD_TYPES)[number], typeof TabFilteredField>
