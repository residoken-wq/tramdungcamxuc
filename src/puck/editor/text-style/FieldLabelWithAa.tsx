'use client'

import React, { useRef, useState } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { TEXT_TARGETS } from '@/puck/style/text-targets'
import type { BlockStyle } from '@/puck/style/style-schema'
import { useCurrentField } from './current-field-context'
import { TextStylePopover } from './TextStylePopover'

const usePuckSelector = createUsePuck()

export function FieldLabelWithAa({
  children,
  icon,
  label,
  el = 'label',
  readOnly,
  className,
}: {
  children?: React.ReactNode
  icon?: React.ReactNode
  label: string
  el?: 'label' | 'div'
  readOnly?: boolean
  className?: string
}) {
  const Component = el
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const fieldName = useCurrentField()
  const selectedItem = usePuckSelector((s) => s.selectedItem)
  const blockType = selectedItem?.type as string | undefined

  // Find target definition
  const targetDefs = blockType ? TEXT_TARGETS[blockType] : undefined
  const targetDef = targetDefs?.find(
    (t) =>
      t.key === fieldName || (fieldName && fieldName.endsWith(`.${t.key}`)) || t.label === label,
  )

  const currentStyle = (selectedItem?.props?._style || {}) as BlockStyle
  const textStyles = currentStyle.texts || {}
  const hasCustomStyle = Boolean(
    targetDef && textStyles[targetDef.key] && Object.keys(textStyles[targetDef.key]).length > 0,
  )

  // QA EB-15ac: the "Aa" button sits next to (not inside) the <label>: interactive content inside a
  // label is invalid HTML and a click on it would also activate the field (toggle a checkbox).
  return (
    <div className={`relative block mb-3 ${className || ''}`}>
      <Component className="block">
        <div className={`flex items-center gap-1.5 mb-1.5 min-w-0 ${targetDef ? 'pr-10' : ''}`}>
          {icon && <div className="shrink-0 text-deep-navy/60">{icon}</div>}
          <span className="font-ui text-xs font-semibold text-deep-navy truncate">{label}</span>
          {readOnly && (
            <span className="text-[10px] text-deep-navy/70 uppercase font-ui tracking-wider">
              {vi.eb15a.readOnlySuffix}
            </span>
          )}
        </div>
        {children}
      </Component>

      {targetDef && (
        <div className="absolute top-0 right-0">
          <button
            ref={buttonRef}
            type="button"
            aria-label={vi.eb15a.buttonAaLabel(label || targetDef.label)}
            title={vi.eb15a.buttonAaLabel(label || targetDef.label)}
            aria-expanded={isPopoverOpen}
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            className={`relative inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-display uppercase tracking-tight rounded border transition ${
              hasCustomStyle || isPopoverOpen
                ? 'border-bright-magenta text-bright-magenta bg-soft-pink/40 font-bold'
                : 'border-deep-navy/20 text-deep-navy/70 hover:text-deep-navy hover:border-deep-navy/40 bg-white'
            }`}
          >
            Aa
            {hasCustomStyle && (
              <span
                data-testid="aa-dot"
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-pink ring-2 ring-white"
              />
            )}
          </button>

          <TextStylePopover
            isOpen={isPopoverOpen}
            onClose={() => setIsPopoverOpen(false)}
            buttonRef={buttonRef}
            targetKey={targetDef.key}
            targetLabel={label || targetDef.label}
          />
        </div>
      )}
    </div>
  )
}
