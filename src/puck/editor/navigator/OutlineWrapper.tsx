'use client'

import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePuck } from '@puckeditor/core'
import { useContextMenu } from '@/puck/editor/context-menu/context-menu-context'
import { vi } from '@/lib/i18n/vi'
import { NavigatorRowContent } from './NavigatorRowContent'

type PortalTarget = {
  id: string
  el: HTMLElement
}

export function OutlineWrapper({ children }: { children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { openMenu, setRenamingId } = useContextMenu()
  const puck = usePuck()
  const [targets, setTargets] = useState<PortalTarget[]>([])

  // Tracking for caret double click vs single click debounce
  const caretTimerRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; id: string | null }>({
    timer: null,
    id: null,
  })
  const isReplayingCaretRef = useRef(false)
  const lastRowClickRef = useRef<{ time: number; id: string | null }>({ time: 0, id: null })

  const updateTargets = useCallback(() => {
    if (!containerRef.current) return
    const root = containerRef.current
    const listItems = root.querySelectorAll<HTMLElement>('li[data-puck-layer-tree-id]')
    const newTargets: PortalTarget[] = []

    listItems.forEach((li) => {
      const id = li.getAttribute('data-puck-layer-tree-id')
      if (!id) return

      // EB-16 1.4: Add tooltip indicating double-click or F2 to rename
      li.setAttribute('title', vi.eb16.renameTooltip)

      // Ensure right-click anywhere on the layer row opens context menu
      li.oncontextmenu = (e) => {
        e.preventDefault()
        e.stopPropagation()
        openMenu({ componentId: id, x: e.clientX, y: e.clientY })
      }

      // Ensure native double-click anywhere on the layer row enters inline rename
      li.ondblclick = (e) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT') return
        e.preventDefault()
        e.stopPropagation()
        setRenamingId(id)
      }

      // Find the title element inside the clickable button
      const titleEl =
        li.querySelector<HTMLElement>('[class*="_Layer-title_"]') ||
        li.querySelector<HTMLElement>('[class*="Layer-title"]') ||
        li.querySelector<HTMLElement>('button')

      if (titleEl) {
        newTargets.push({ id, el: titleEl })
      }
    })

    setTargets((prev) => {
      if (
        prev.length === newTargets.length &&
        prev.every((p, idx) => p.id === newTargets[idx].id && p.el === newTargets[idx].el)
      ) {
        return prev
      }
      return newTargets
    })
  }, [openMenu, setRenamingId])

  useLayoutEffect(() => {
    updateTargets()
  })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new MutationObserver(() => {
      updateTargets()
    })

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [updateTargets])

  // EB-16 1.4: F2 key shortcut to rename the currently selected/focused block in the layer tree
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return
      const activeEl = document.activeElement as HTMLElement | null
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return

      // 1. Check if focus is inside a layer row
      const activeLi = activeEl?.closest<HTMLElement>('li[data-puck-layer-tree-id]')
      let idToRename = activeLi?.getAttribute('data-puck-layer-tree-id')

      // 2. If not focused on a row, check Puck's selected item
      if (!idToRename) {
        const selectedId = puck?.selectedItem?.props?.id
        if (typeof selectedId === 'string' && selectedId) {
          idToRename = selectedId
        }
      }

      // 3. If still not found, check if any li has aria-selected or active styling
      if (!idToRename && containerRef.current) {
        const selectedLi = containerRef.current.querySelector<HTMLElement>(
          'li[data-puck-layer-tree-id][aria-selected="true"], li[data-puck-layer-tree-id] button[aria-current="true"]',
        )
        if (selectedLi) {
          const parentLi = selectedLi.closest<HTMLElement>('li[data-puck-layer-tree-id]')
          idToRename = parentLi?.getAttribute('data-puck-layer-tree-id')
        }
      }

      if (idToRename) {
        e.preventDefault()
        e.stopPropagation()
        setRenamingId(idToRename)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      if (caretTimerRef.current.timer) {
        clearTimeout(caretTimerRef.current.timer)
      }
    }
  }, [puck?.selectedItem, setRenamingId])

  // Capture clicks on the outline container to handle caret double-click without toggling expand/collapse twice
  const handleClickCapture = useCallback(
    (e: React.MouseEvent) => {
      if (isReplayingCaretRef.current) {
        return
      }

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT') return

      const li = target.closest<HTMLElement>('li[data-puck-layer-tree-id]')
      if (!li) return
      const id = li.getAttribute('data-puck-layer-tree-id')
      if (!id) return

      const caretBtn = target.closest<HTMLElement>('button')
      const isCaret = Boolean(caretBtn && caretBtn.closest('[class*="caret"]'))

      if (isCaret && caretBtn) {
        // Intercept caret click to distinguish single-click (toggle) from double-click (rename)
        e.preventDefault()
        e.stopPropagation()

        if (caretTimerRef.current.timer && caretTimerRef.current.id === id) {
          // Second click on caret within window: cancel single click and trigger rename!
          clearTimeout(caretTimerRef.current.timer)
          caretTimerRef.current = { timer: null, id: null }
          setRenamingId(id)
        } else {
          // First click on caret: wait 250ms to check if a double-click arrives
          if (caretTimerRef.current.timer) {
            clearTimeout(caretTimerRef.current.timer)
          }
          caretTimerRef.current = {
            id,
            timer: setTimeout(() => {
              caretTimerRef.current = { timer: null, id: null }
              // Replay click onto caret button so Puck performs single expand/collapse toggle
              isReplayingCaretRef.current = true
              caretBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
              isReplayingCaretRef.current = false
            }, 250),
          }
        }
        return
      }

      // Fast double-click tracker for non-caret parts of the row
      const now = Date.now()
      if (now - lastRowClickRef.current.time < 300 && lastRowClickRef.current.id === id) {
        lastRowClickRef.current = { time: 0, id: null }
        setRenamingId(id)
      } else {
        lastRowClickRef.current = { time: now, id }
      }
    },
    [setRenamingId],
  )

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onClickCapture={handleClickCapture}
      onContextMenu={(e) => {
        const target = e.target as HTMLElement
        const li = target.closest<HTMLElement>('li[data-puck-layer-tree-id]')
        if (li) {
          const id = li.getAttribute('data-puck-layer-tree-id')
          if (id) {
            e.preventDefault()
            e.stopPropagation()
            openMenu({ componentId: id, x: e.clientX, y: e.clientY })
          }
        }
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT') return
        const li = target.closest<HTMLElement>('li[data-puck-layer-tree-id]')
        if (li) {
          const id = li.getAttribute('data-puck-layer-tree-id')
          if (id) {
            e.preventDefault()
            e.stopPropagation()
            setRenamingId(id)
          }
        }
      }}
    >
      {children}
      {targets.map(({ id, el }) => createPortal(<NavigatorRowContent componentId={id} />, el, id))}
    </div>
  )
}
