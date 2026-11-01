'use client'

import React, { useId, useState } from 'react'
import { typographyClasses, type TypographyDefaults } from './style-defaults'

export interface AccordionItem {
  title: string
  content?: unknown
}

export interface AccordionWidgetProps {
  version?: number
  items?: AccordionItem[]
  expandMode?: 'single' | 'multiple'
  defaultExpanded?: 'first' | 'none' | 'all'
}

function renderSlot(slot: unknown, className?: string): React.ReactNode {
  if (!slot) return null
  if (typeof slot === 'function') {
    const SlotComponent = slot as React.ComponentType<{ className?: string }>
    return <SlotComponent className={className} />
  }
  if (React.isValidElement(slot)) {
    return slot
  }
  return null
}

const ACCORDION_DEFAULTS: TypographyDefaults = {
  textColor: 'text-deep-navy',
  fontFamily: 'font-ui',
  fontWeight: 'font-semibold',
  fontSize: 'text-base sm:text-lg',
}

const ChevronDownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 shrink-0"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export function AccordionWidget({
  id,
  items = [{ title: 'Mục câu hỏi 1' }, { title: 'Mục câu hỏi 2' }],
  expandMode = 'single',
  defaultExpanded = 'first',
  _style,
  isEditing = false,
}: AccordionWidgetProps & { id?: string; _style?: unknown; isEditing?: boolean }) {
  // Puck's drag overlay swallows clicks in the editor: every item is open there so blocks can be
  // dropped into any of them.
  const generatedId = useId()
  const baseId = id || `acc-${generatedId.replace(/:/g, '')}`

  const [openIndices, setOpenIndices] = useState<number[]>(() => {
    if (defaultExpanded === 'none') return []
    if (defaultExpanded === 'all') return items.map((_, i) => i)
    return items.length > 0 ? [0] : []
  })

  const titleClass = typographyClasses(ACCORDION_DEFAULTS, _style)

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) => {
      const isOpen = prev.includes(idx)
      if (expandMode === 'single') {
        return isOpen ? [] : [idx]
      }
      return isOpen ? prev.filter((i) => i !== idx) : [...prev, idx]
    })
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {items.map((item, idx) => {
        const isOpen = isEditing || openIndices.includes(idx)
        return (
          <div
            key={idx}
            className="w-full rounded-xl border border-deep-navy/10 overflow-hidden bg-white shadow-soft transition-all duration-200"
          >
            <button
              type="button"
              id={`${baseId}-header-${idx}`}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-panel-${idx}`}
              onClick={() => toggleItem(idx)}
              className="flex w-full items-center justify-between py-4 px-5 text-left bg-white hover:bg-soft-pink/20 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-pink"
            >
              <span className={titleClass}>{item.title}</span>
              <span
                className={`transform transition-transform duration-200 motion-reduce:transition-none text-deep-navy/60 ${
                  isOpen ? 'rotate-180 text-accent-pink' : ''
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>

            <div
              id={`${baseId}-panel-${idx}`}
              role="region"
              aria-labelledby={`${baseId}-header-${idx}`}
              className={
                isOpen ? 'block px-5 py-4 bg-white border-t border-deep-navy/10' : 'hidden'
              }
            >
              {renderSlot(item.content, 'min-h-[48px] w-full flex flex-col gap-3')}
            </div>
          </div>
        )
      })}
    </div>
  )
}
