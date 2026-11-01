'use client'

import React, { useId, useRef, useState } from 'react'
import { typographyClasses, type TypographyDefaults } from './style-defaults'

export interface TabItem {
  title: string
  content?: unknown
}

export interface TabsWidgetProps {
  version?: number
  items?: TabItem[]
  orientation?: 'horizontal' | 'vertical'
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

const TAB_DEFAULTS: TypographyDefaults = {
  textColor: 'text-deep-navy',
  fontFamily: 'font-ui',
  fontWeight: 'font-semibold',
  fontSize: 'text-sm sm:text-base',
}

export function TabsWidget({
  id,
  items = [{ title: 'Tab 1' }, { title: 'Tab 2' }],
  orientation = 'horizontal',
  _style,
}: TabsWidgetProps & { id?: string; _style?: unknown; puck?: { isEditing?: boolean } }) {
  const generatedId = useId()
  const baseId = id || `tabs-${generatedId.replace(/:/g, '')}`
  const [activeTab, setActiveTab] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const titleClass = typographyClasses(TAB_DEFAULTS, _style)
  const isVertical = orientation === 'vertical'

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = items.length
    if (total === 0) return

    let nextIndex: number | null = null

    if (isVertical) {
      if (e.key === 'ArrowDown') {
        nextIndex = (index + 1) % total
      } else if (e.key === 'ArrowUp') {
        nextIndex = (index - 1 + total) % total
      }
    } else {
      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % total
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + total) % total
      }
    }

    if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = total - 1
    }

    if (nextIndex !== null) {
      e.preventDefault()
      setActiveTab(nextIndex)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className={`w-full flex ${isVertical ? 'flex-col md:flex-row gap-6' : 'flex-col gap-4'}`}>
      <div
        role="tablist"
        aria-orientation={orientation}
        className={`flex ${
          isVertical
            ? 'flex-col gap-1 min-w-[200px] border-b md:border-b-0 md:border-r border-deep-navy/10 pb-4 md:pb-0 md:pr-4'
            : 'flex-row gap-2 border-b border-deep-navy/10 overflow-x-auto pb-1'
        }`}
      >
        {items.map((item, idx) => {
          const isActive = activeTab === idx
          return (
            <button
              key={idx}
              ref={(el) => {
                tabRefs.current[idx] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${idx}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${idx}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`px-4 py-2.5 rounded-lg text-left transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-pink ${
                isActive
                  ? isVertical
                    ? 'bg-soft-pink/50 text-accent-pink font-bold border-l-4 border-accent-pink'
                    : 'border-b-2 border-accent-pink text-accent-pink font-bold'
                  : 'text-deep-navy/70 hover:text-deep-navy hover:bg-black/5'
              }`}
            >
              <span className={titleClass}>{item.title}</span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 w-full min-w-0">
        {items.map((item, idx) => {
          const isActive = activeTab === idx
          return (
            <div
              key={idx}
              role="tabpanel"
              id={`${baseId}-panel-${idx}`}
              aria-labelledby={`${baseId}-tab-${idx}`}
              tabIndex={0}
              className={isActive ? 'block w-full min-h-[60px]' : 'hidden'}
            >
              {renderSlot(item.content, 'min-h-[48px] w-full flex flex-col gap-3')}
            </div>
          )
        })}
      </div>
    </div>
  )
}
