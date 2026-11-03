'use client'

import { useEffect, useRef } from 'react'
import { usePuck, type ComponentData } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { useContextMenu } from '@/puck/editor/context-menu/context-menu-context'
import { canDoBlockAction, isLastRequiredBlock } from '@/puck/locks'
import { useLockContext } from '@/puck/editor/lock/lock-context'
import {
  getMoveStatus,
  getMoveUpIndex,
  getMoveDownIndex,
  shouldHandleBlockShortcut,
} from './actions-pure'

export function useBlockShortcuts() {
  const { appState, dispatch, selectedItem, getPermissions, getSelectorForId, getParentById } =
    usePuck()
  const { showToast } = useContextMenu()
  const { pageSlug, pageKind, getBlockInfo, isUnlocked } = useLockContext()

  // Keep latest references for event listener without re-attaching listeners
  const stateRef = useRef({
    appState,
    selectedItem,
    dispatch,
    getPermissions,
    getSelectorForId,
    getParentById,
    showToast,
    pageSlug,
    pageKind,
    getBlockInfo,
    isUnlocked,
  })

  useEffect(() => {
    stateRef.current = {
      appState,
      selectedItem,
      dispatch,
      getPermissions,
      getSelectorForId,
      getParentById,
      showToast,
      pageSlug,
      pageKind,
      getBlockInfo,
      isUnlocked,
    }
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        appState: currentAppState,
        selectedItem: currentItem,
        dispatch: currentDispatch,
        getPermissions: currentGetPermissions,
        getSelectorForId: currentGetSelectorForId,
        getParentById: currentGetParentById,
        showToast: currentShowToast,
        pageSlug: currentPageSlug,
        pageKind: currentPageKind,
        getBlockInfo: currentGetBlockInfo,
        isUnlocked: currentIsUnlocked,
      } = stateRef.current

      if (!currentItem) return

      // Determine active target and element
      const target = e.target
      const activeEl = (target as Element)?.ownerDocument?.activeElement || document.activeElement

      if (!shouldHandleBlockShortcut(target, activeEl)) {
        return
      }

      const itemId = String(currentItem.props?.id)
      let selector = currentGetSelectorForId ? currentGetSelectorForId(itemId) : null
      if (!selector && currentAppState.ui.itemSelector) {
        selector = {
          index: currentAppState.ui.itemSelector.index,
          zone: currentAppState.ui.itemSelector.zone || 'root:default-zone',
        }
      }

      const lockInfo = currentGetBlockInfo(currentItem.type)
      const unlocked = itemId ? currentIsUnlocked(itemId) : false
      const isLocked = Boolean(lockInfo.locked && !unlocked)

      const permissions =
        currentItem && currentGetPermissions
          ? currentGetPermissions({ item: currentItem })
          : undefined
      const canDrag = canDoBlockAction('drag', lockInfo, unlocked, permissions)
      const canDuplicate = canDoBlockAction('duplicate', lockInfo, unlocked, permissions)
      const canDelete = canDoBlockAction('delete', lockInfo, unlocked, permissions)

      const moveStatus = getMoveStatus(currentAppState.data, selector, canDrag)

      // 1. Alt+ArrowUp: Move Up
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()

        if (!canDrag) {
          currentShowToast(lockInfo.reason || vi.eb13a.alreadyAtTop)
          return
        }

        if (!selector || !moveStatus.canMoveUp) {
          currentShowToast(vi.eb13a.alreadyAtTop)
          return
        }

        const nextIndex = getMoveUpIndex(selector.index)
        if (nextIndex === null) return

        currentDispatch({
          type: 'move',
          sourceIndex: selector.index,
          sourceZone: moveStatus.zone,
          destinationIndex: nextIndex,
          destinationZone: moveStatus.zone,
        })
        currentDispatch({
          type: 'setUi',
          ui: {
            itemSelector: { index: nextIndex, zone: moveStatus.zone },
          },
        })
        currentShowToast(vi.eb13a.movedUp)
        return
      }

      // 2. Alt+ArrowDown: Move Down
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()

        if (!canDrag) {
          currentShowToast(lockInfo.reason || vi.eb13a.alreadyAtBottom)
          return
        }

        if (!selector || !moveStatus.canMoveDown) {
          currentShowToast(vi.eb13a.alreadyAtBottom)
          return
        }

        const nextIndex = getMoveDownIndex(selector.index, moveStatus.totalItems)
        if (nextIndex === null) return

        currentDispatch({
          type: 'move',
          sourceIndex: selector.index,
          sourceZone: moveStatus.zone,
          destinationIndex: nextIndex,
          destinationZone: moveStatus.zone,
        })
        currentDispatch({
          type: 'setUi',
          ui: {
            itemSelector: { index: nextIndex, zone: moveStatus.zone },
          },
        })
        currentShowToast(vi.eb13a.movedDown)
        return
      }

      // 3. Escape: Select Parent
      if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'Escape') {
        if (!currentGetParentById || !currentGetSelectorForId) return

        const parent = currentGetParentById(itemId) as ComponentData | undefined
        if (!parent || !parent.props?.id) return

        const parentSelector = currentGetSelectorForId(String(parent.props.id))
        if (!parentSelector) return

        e.preventDefault()
        e.stopPropagation()

        currentDispatch({
          type: 'setUi',
          ui: { itemSelector: parentSelector },
        })
        return
      }

      // 4. Ctrl+D / Cmd+D: Duplicate
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        (e.key === 'd' || e.key === 'D')
      ) {
        e.preventDefault()
        e.stopPropagation()

        if (!canDuplicate) {
          currentShowToast(lockInfo.reason || vi.eb13a.cannotDuplicateLocked)
          return
        }

        if (!selector) return

        currentDispatch({
          type: 'duplicate',
          sourceIndex: selector.index,
          sourceZone: selector.zone,
        })
        currentShowToast(vi.eb07.toast.duplicated)
        return
      }

      // 5. Delete: Delete Block
      if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'Delete') {
        e.preventDefault()
        e.stopPropagation()

        if (!canDelete) {
          currentShowToast(lockInfo.reason || vi.eb13a.cannotDeleteLocked)
          return
        }

        if (!selector) return

        // REVIEW-REQUIRED: Chặn xoá khối bắt buộc cuối cùng ngay ở editor
        if (
          isLastRequiredBlock(
            currentAppState.data,
            currentItem.type,
            currentPageSlug,
            currentPageKind,
          )
        ) {
          if (currentItem.type === 'HeroTwoEntries') {
            currentShowToast(vi.eb14b.cannotDeleteLastHero)
          } else if (currentItem.type === 'LegalFooter') {
            currentShowToast(vi.eb14b.cannotDeleteLastLegalFooter)
          } else {
            currentShowToast(vi.eb14b.cannotDeleteLastRequired)
          }
          return
        }

        currentDispatch({
          type: 'remove',
          index: selector.index,
          zone: selector.zone,
        })
        currentDispatch({
          type: 'setUi',
          ui: { itemSelector: null },
        })
        currentShowToast(vi.eb13a.deleted)
        return
      }
    }

    // Attach listeners to main window
    window.addEventListener('keydown', handleKeyDown, true)

    // Also attach to canvas iframe document / window if present
    const iframe = document.querySelector('iframe')
    const iframeDoc = iframe?.contentDocument
    const iframeWin = iframe?.contentWindow

    if (iframeDoc) {
      iframeDoc.addEventListener('keydown', handleKeyDown, true)
    }
    if (iframeWin && iframeWin !== window) {
      iframeWin.addEventListener('keydown', handleKeyDown, true)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      if (iframeDoc) {
        iframeDoc.removeEventListener('keydown', handleKeyDown, true)
      }
      if (iframeWin && iframeWin !== window) {
        iframeWin.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [])
}
