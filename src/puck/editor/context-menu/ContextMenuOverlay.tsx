'use client'

import React, { useEffect } from 'react'
import { useContextMenu } from './context-menu-context'

export function ContextMenuOverlay({
  componentId,
  componentType: _componentType,
  hover: _hover,
  isSelected,
  children,
}: {
  componentId: string
  componentType: string
  hover: boolean
  isSelected: boolean
  children: React.ReactNode
}) {
  const { openMenu } = useContextMenu()

  useEffect(() => {
    if (!isSelected) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
        e.preventDefault()
        e.stopPropagation()

        let clientX = window.innerWidth / 2
        let clientY = window.innerHeight / 3

        try {
          const iframe = window.parent?.document.querySelector('iframe')
          if (iframe) {
            const rect = iframe.getBoundingClientRect()
            clientX += rect.left
            clientY += rect.top
          }
        } catch {}

        openMenu({
          componentId,
          x: clientX,
          y: clientY,
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelected, componentId, openMenu])

  return (
    // Right-click is handled once for the whole canvas (StylePreview), which picks the innermost
    // block under the pointer; a handler here would answer for the outer block (Container) first.
    <div className="w-full h-full pointer-events-auto" data-eb-overlay-id={componentId}>
      {children}
    </div>
  )
}
