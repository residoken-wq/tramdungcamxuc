'use client'

import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useContextMenu } from '@/puck/editor/context-menu/context-menu-context'
import { NavigatorRowContent } from './NavigatorRowContent'

type PortalTarget = {
  id: string
  el: HTMLElement
}

export function OutlineWrapper({ children }: { children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { openMenu, setRenamingId } = useContextMenu()
  const [targets, setTargets] = useState<PortalTarget[]>([])

  const updateTargets = useCallback(() => {
    if (!containerRef.current) return
    const root = containerRef.current
    const listItems = root.querySelectorAll<HTMLElement>('li[data-puck-layer-tree-id]')
    const newTargets: PortalTarget[] = []

    listItems.forEach((li) => {
      const id = li.getAttribute('data-puck-layer-tree-id')
      if (!id) return

      // Ensure right-click anywhere on the layer row opens context menu
      li.oncontextmenu = (e) => {
        e.preventDefault()
        e.stopPropagation()
        openMenu({ componentId: id, x: e.clientX, y: e.clientY })
      }

      // Ensure double-click anywhere on the layer row enters inline rename
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
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
