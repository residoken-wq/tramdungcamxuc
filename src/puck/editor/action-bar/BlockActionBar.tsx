'use client'

import React, { useMemo, useCallback } from 'react'
import { usePuck, type ComponentData } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { cleanBlockLabel } from '@/puck/style/block-label'
import { useContextMenu } from '@/puck/editor/context-menu/context-menu-context'
import { puckVietnameseDictionary } from '@/puck/dictionary'
import { getMoveStatus, getMoveUpIndex, getMoveDownIndex } from './actions-pure'
import { useBlockShortcuts } from './useBlockShortcuts'

export type BlockActionBarProps = {
  label?: string
  children?: React.ReactNode
  parentAction?: React.ReactNode
}

export function BlockActionBar({ label, children, parentAction }: BlockActionBarProps) {
  // Activate keyboard shortcuts for selected block
  useBlockShortcuts()

  const {
    appState,
    dispatch,
    selectedItem,
    getPermissions,
    getSelectorForId,
    getParentById,
    config,
  } = usePuck()
  const { showToast } = useContextMenu()

  const itemId = selectedItem?.props?.id ? String(selectedItem.props.id) : undefined

  let selector = itemId && getSelectorForId ? getSelectorForId(itemId) : null
  if (!selector && appState.ui.itemSelector) {
    selector = {
      index: appState.ui.itemSelector.index,
      zone: appState.ui.itemSelector.zone || 'root:default-zone',
    }
  }

  // Block permissions
  const permissions =
    selectedItem && getPermissions ? getPermissions({ item: selectedItem }) : undefined
  const canDrag = permissions ? permissions.drag !== false : true

  // Calculate move capabilities (EB-13ac: locked blocks cannot move)
  const moveStatus = useMemo(
    () => getMoveStatus(appState.data, selector, canDrag),
    [appState.data, selector, canDrag],
  )
  const canDuplicate = permissions ? permissions.duplicate !== false : true
  const canDelete = permissions ? permissions.delete !== false : true

  // Display label: prioritize custom _label, then passed label, then config label, then type
  const compConfig = selectedItem?.type ? config?.components?.[selectedItem.type] : undefined
  const customLabel = cleanBlockLabel(selectedItem?.props?._label)
  const displayLabel =
    customLabel ||
    label ||
    compConfig?.label ||
    selectedItem?.type ||
    puckVietnameseDictionary['label-component'] ||
    'Khối'

  // Move Up
  const handleMoveUp = useCallback(() => {
    if (!selector || !moveStatus.canMoveUp) {
      showToast(vi.eb13a.alreadyAtTop)
      return
    }

    const nextIndex = getMoveUpIndex(selector.index)
    if (nextIndex === null) return

    dispatch({
      type: 'move',
      sourceIndex: selector.index,
      sourceZone: moveStatus.zone,
      destinationIndex: nextIndex,
      destinationZone: moveStatus.zone,
    })
    dispatch({
      type: 'setUi',
      ui: {
        itemSelector: { index: nextIndex, zone: moveStatus.zone },
      },
    })
    showToast(vi.eb13a.movedUp)
  }, [selector, moveStatus, dispatch, showToast])

  // Move Down
  const handleMoveDown = useCallback(() => {
    if (!selector || !moveStatus.canMoveDown) {
      showToast(vi.eb13a.alreadyAtBottom)
      return
    }

    const nextIndex = getMoveDownIndex(selector.index, moveStatus.totalItems)
    if (nextIndex === null) return

    dispatch({
      type: 'move',
      sourceIndex: selector.index,
      sourceZone: moveStatus.zone,
      destinationIndex: nextIndex,
      destinationZone: moveStatus.zone,
    })
    dispatch({
      type: 'setUi',
      ui: {
        itemSelector: { index: nextIndex, zone: moveStatus.zone },
      },
    })
    showToast(vi.eb13a.movedDown)
  }, [selector, moveStatus, dispatch, showToast])

  // Select Parent
  const handleSelectParent = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (React.isValidElement(parentAction)) {
        const parentOnClick = (
          parentAction.props as { onClick?: (event: React.MouseEvent) => void }
        )?.onClick
        if (typeof parentOnClick === 'function') {
          parentOnClick(e)
          return
        }
      }

      if (itemId && getParentById && getSelectorForId) {
        const parent = getParentById(itemId) as ComponentData | undefined
        if (parent?.props?.id) {
          const parentSelector = getSelectorForId(String(parent.props.id))
          if (parentSelector) {
            dispatch({
              type: 'setUi',
              ui: { itemSelector: parentSelector },
            })
          }
        }
      }
    },
    [parentAction, itemId, getParentById, getSelectorForId, dispatch],
  )

  // Duplicate Block
  const handleDuplicate = useCallback(() => {
    if (!canDuplicate) {
      showToast(vi.eb13a.cannotDuplicateLocked)
      return
    }
    if (!selector) return

    dispatch({
      type: 'duplicate',
      sourceIndex: selector.index,
      sourceZone: selector.zone,
    })
    showToast(vi.eb07.toast.duplicated)
  }, [canDuplicate, selector, dispatch, showToast])

  // Delete Block
  const handleDelete = useCallback(() => {
    if (!canDelete) {
      showToast(vi.eb13a.cannotDeleteLocked)
      return
    }
    if (!selector) return

    dispatch({
      type: 'remove',
      index: selector.index,
      zone: selector.zone,
    })
    dispatch({
      type: 'setUi',
      ui: { itemSelector: null },
    })
    showToast(vi.eb13a.deleted)
  }, [canDelete, selector, dispatch, showToast])

  // Filter out Puck's default Duplicate / Delete from children to avoid duplicate rendering,
  // while preserving rich text menus or other extension items.
  const extraChildren = React.Children.toArray(children).filter((child) => {
    if (React.isValidElement(child)) {
      const lbl = (child.props as { label?: string })?.label
      if (
        lbl === 'Nhân bản' ||
        lbl === 'Xóa' ||
        lbl === 'Xoá' ||
        lbl === 'Duplicate' ||
        lbl === 'Delete'
      ) {
        return false
      }
    }
    return true
  })

  // Has parent action if Puck provided parentAction (root blocks have null/undefined/false)
  const hasParent = Boolean(parentAction)

  return (
    <div
      role="toolbar"
      aria-label={`${vi.eb13a.toolbarLabel}: ${displayLabel}`}
      className="inline-flex items-center bg-deep-navy text-white rounded-lg shadow-xl border border-white/10 px-1 py-1 gap-1 select-none pointer-events-auto"
    >
      {/* 1. Select Parent Action (Hidden for root blocks) */}
      {hasParent && (
        <>
          <button
            type="button"
            data-testid="block-action-select-parent"
            onClick={handleSelectParent}
            aria-label={vi.eb13a.selectParent}
            title={vi.eb13a.selectParent}
            className="min-h-[32px] min-w-[32px] px-2 py-1 rounded inline-flex items-center gap-1.5 transition text-xs font-ui font-semibold text-white/95 hover:bg-white/15 active:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h10a5 5 0 015 5v5m-15-10l5 5m-5-5l5-5"
              />
            </svg>
            <span className="truncate">{vi.eb13a.selectParent}</span>
          </button>
          <div className="w-[1px] h-4 bg-white/20 my-auto" />
        </>
      )}

      {/* EB-13ac: no block-name label here – the name is already in the right panel and the
          Structure tab, and the wider bar covered the block right above the selected one
          (it could not be clicked). */}

      {/* 3. Reorder: Move Up (↑) */}
      <button
        type="button"
        data-testid="block-action-move-up"
        onClick={handleMoveUp}
        disabled={!moveStatus.canMoveUp}
        aria-label={vi.eb13a.moveUp}
        title={vi.eb13a.moveUp}
        className={`min-h-[32px] min-w-[32px] px-2 py-1 rounded inline-flex items-center justify-center transition text-xs font-ui ${
          moveStatus.canMoveUp
            ? 'text-white hover:bg-white/15 active:bg-white/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta'
            : 'text-white/30 cursor-not-allowed opacity-40'
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* 4. Reorder: Move Down (↓) */}
      <button
        type="button"
        data-testid="block-action-move-down"
        onClick={handleMoveDown}
        disabled={!moveStatus.canMoveDown}
        aria-label={vi.eb13a.moveDown}
        title={vi.eb13a.moveDown}
        className={`min-h-[32px] min-w-[32px] px-2 py-1 rounded inline-flex items-center justify-center transition text-xs font-ui ${
          moveStatus.canMoveDown
            ? 'text-white hover:bg-white/15 active:bg-white/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta'
            : 'text-white/30 cursor-not-allowed opacity-40'
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Extra children like rich text formatting controls */}
      {extraChildren.length > 0 && (
        <>
          <div className="w-[1px] h-4 bg-white/20 my-auto" />
          <div className="flex items-center gap-1">{extraChildren}</div>
        </>
      )}

      {/* 5. Duplicate Action */}
      {canDuplicate && (
        <>
          <div className="w-[1px] h-4 bg-white/20 my-auto" />
          <button
            type="button"
            data-testid="block-action-duplicate"
            onClick={handleDuplicate}
            aria-label={vi.eb13a.duplicate}
            title={vi.eb13a.duplicate}
            className="min-h-[32px] min-w-[32px] px-2 py-1 rounded inline-flex items-center justify-center transition text-xs font-ui text-white hover:bg-white/15 active:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </>
      )}

      {/* 6. Delete Action */}
      {canDelete && (
        <button
          type="button"
          data-testid="block-action-delete"
          onClick={handleDelete}
          aria-label={vi.eb13a.delete}
          title={vi.eb13a.delete}
          className="min-h-[32px] min-w-[32px] px-2 py-1 rounded inline-flex items-center justify-center transition text-xs font-ui text-white/90 hover:bg-accent-pink/30 hover:text-white active:bg-accent-pink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
