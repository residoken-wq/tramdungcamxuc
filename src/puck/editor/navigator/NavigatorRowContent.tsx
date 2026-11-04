'use client'

import React, { useRef, useEffect } from 'react'
import { usePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { cleanBlockLabel } from '@/puck/style/block-label'
import { getBlockIcon } from '@/puck/editor/block-icons'
import { useContextMenu } from '@/puck/editor/context-menu/context-menu-context'
import { useLockContext } from '@/puck/editor/lock/lock-context'

export function NavigatorRowContent({ componentId }: { componentId: string }) {
  const { config, dispatch, getItemById, getSelectorForId } = usePuck()
  const { renamingId, setRenamingId, openMenu, showToast } = useContextMenu()
  const { getBlockInfo, isUnlocked } = useLockContext()

  const inputRef = useRef<HTMLInputElement>(null)
  const isRenaming = renamingId === componentId

  const item = getItemById(componentId)

  const type = item?.type || 'Block'
  const lockInfo = getBlockInfo(type)
  const isBlockUnlocked = isUnlocked(componentId)
  const isBlockLocked = lockInfo.locked && !isBlockUnlocked
  const compConfig = config?.components?.[type] as { label?: string } | undefined
  const typeLabel = compConfig?.label || type

  const rawLabel = item?.props?._label
  const cleanLabel = cleanBlockLabel(rawLabel)

  const hideOn = (item?.props?._style as { hideOn?: string[] } | undefined)?.hideOn
  const hasHideOn = Array.isArray(hideOn) && hideOn.length > 0
  const hiddenDeviceNames = hasHideOn
    ? hideOn.map((d) => (vi.eb07.devices as Record<string, string>)[d] || d).join(', ')
    : ''

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const saveRename = (value: string) => {
    setRenamingId(null)
    const cleaned = cleanBlockLabel(value)
    if (cleaned === cleanLabel) return
    const currentItem = getItemById(componentId)
    const currentSelector = getSelectorForId(componentId)
    if (!currentItem || !currentSelector) return

    const updatedItem = {
      ...currentItem,
      props: {
        ...currentItem.props,
        _label: cleaned,
      },
    }

    dispatch({
      type: 'replace',
      destinationIndex: currentSelector.index,
      destinationZone: currentSelector.zone,
      data: updatedItem,
    })
    showToast(vi.eb07.toast.renamed)
  }

  if (!item) return null

  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-1.5 w-full min-w-0 pr-1 py-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-4 h-4 shrink-0 flex items-center justify-center text-deep-navy/70">
          {getBlockIcon(type)}
        </div>
        <input
          ref={inputRef}
          type="text"
          defaultValue={cleanLabel || ''}
          placeholder={typeLabel}
          maxLength={60}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              saveRename(e.currentTarget.value)
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              setRenamingId(null)
            }
          }}
          onBlur={(e) => {
            saveRename(e.target.value)
          }}
          className="flex-1 min-w-0 px-1.5 py-0.5 text-xs font-ui rounded border border-bright-magenta bg-white text-deep-navy focus:outline-none focus:ring-1 focus:ring-bright-magenta"
          aria-label={vi.eb07.rename}
        />
      </div>
    )
  }

  return (
    <div
      title={vi.eb16.renameTooltip}
      className="flex items-center gap-2 w-full min-w-0 pr-1 select-none"
      // This row is portaled into Puck's layer button: React delivers its clicks to the portal's
      // React parent, not to Puck's button, so selecting the block has to happen here.
      onClick={() => {
        const selector = getSelectorForId(componentId)
        if (selector) dispatch({ type: 'setUi', ui: { itemSelector: selector } })
      }}
      onDoubleClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setRenamingId(componentId)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        openMenu({ componentId, x: e.clientX, y: e.clientY })
      }}
    >
      <div className="w-4 h-4 shrink-0 flex items-center justify-center text-deep-navy/70">
        {getBlockIcon(type)}
      </div>

      {cleanLabel ? (
        <div className="flex items-baseline gap-1.5 min-w-0 flex-1 truncate">
          <span className="font-bold text-xs text-deep-navy truncate">{cleanLabel}</span>
          <span className="text-[10px] text-deep-navy/70 truncate shrink-0">({typeLabel})</span>
        </div>
      ) : (
        <span className="font-medium text-xs text-deep-navy truncate flex-1">{typeLabel}</span>
      )}

      {isBlockLocked && (
        <span
          title={lockInfo.reason}
          role="img"
          aria-label={vi.eb14b.lockedAria}
          className="text-deep-navy/80 shrink-0 flex items-center ml-1"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>
      )}

      {lockInfo.locked && isBlockUnlocked && (
        <span
          title={vi.eb14b.unlockedBadge}
          role="img"
          aria-label={vi.eb14b.unlockedAria}
          className="text-bright-magenta shrink-0 flex items-center ml-1"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
        </span>
      )}

      {hasHideOn && (
        <span
          title={`${vi.eb07.hiddenOn}: ${hiddenDeviceNames}`}
          className="text-deep-navy/70 hover:text-deep-navy shrink-0 ml-auto flex items-center"
          aria-label={`${vi.eb07.hiddenOn}: ${hiddenDeviceNames}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
            />
          </svg>
        </span>
      )}
    </div>
  )
}
