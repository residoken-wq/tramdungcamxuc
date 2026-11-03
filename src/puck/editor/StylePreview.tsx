'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createUsePuck } from '@puckeditor/core'
import { designSystemGoogleFonts, googleFontsHrefFor } from '@/lib/design/design-css'
import { collectPageStyles } from '@/puck/style/style-css'
import { useStylePanel } from './style-context'
import { useContextMenu } from './context-menu/context-menu-context'

const usePuckSelector = createUsePuck()

/**
 * EB-04b `overrides.iframe`: puts the page's block styles (same `collectPageStyles` as the public
 * page) into the head of the preview iframe, so edits in the Style / Advanced tabs show at once.
 */
export function StylePreview({
  children,
  document: frameDocument,
}: {
  children: React.ReactNode
  document?: Document
}) {
  const { ds } = useStylePanel()
  const { openMenu } = useContextMenu()
  const data = usePuckSelector((s) => s.appState.data)
  const selectedId = usePuckSelector((s) => {
    if (s.selectedItem?.props?.id) return String(s.selectedItem.props.id)
    const sel = s.appState.ui.itemSelector
    if (sel && s.getItemBySelector) {
      const item = s.getItemBySelector(sel)
      if (item?.props?.id) return String(item.props.id)
    }
    return null
  })

  useEffect(() => {
    if (!frameDocument) return
    const handleContextMenu = (e: MouseEvent) => {
      // Collect all blocks under the pointer
      const blocks = new Set<HTMLElement>()
      for (const el of frameDocument.elementsFromPoint(e.clientX, e.clientY)) {
        const block = (el as HTMLElement).closest<HTMLElement>('[data-puck-component]')
        if (block) blocks.add(block)
      }

      // EB-13a: Right-click anywhere in the currently selected block (even over child widgets)
      // targets the selected block itself, not the innermost child under the pointer.
      let compEl: HTMLElement | undefined
      if (selectedId) {
        compEl = [...blocks].find(
          (block) => block.getAttribute('data-puck-component') === selectedId,
        )
      }

      // Fallback: pick the innermost block under the pointer
      if (!compEl) {
        compEl = [...blocks].find(
          (block) => ![...blocks].some((other) => other !== block && block.contains(other)),
        )
      }

      if (!compEl) return
      const id = compEl.getAttribute('data-puck-component')
      if (!id) return
      e.preventDefault()
      e.stopPropagation()
      const iframe = window.document.querySelector('iframe')
      const rect = iframe?.getBoundingClientRect() ?? { left: 0, top: 0 }
      openMenu({
        componentId: id,
        x: e.clientX + rect.left,
        y: e.clientY + rect.top,
      })
    }
    frameDocument.addEventListener('contextmenu', handleContextMenu)
    return () => frameDocument.removeEventListener('contextmenu', handleContextMenu)
  }, [frameDocument, openMenu, selectedId])
  const { css, fonts } = collectPageStyles(data, ds)
  const loaded = new Set(designSystemGoogleFonts(ds))
  const fontsHref = googleFontsHrefFor(
    new Map(fonts.filter((f) => !loaded.has(f)).map((f) => [f, { italic: false }])),
  )
  return (
    <>
      {children}
      {frameDocument
        ? createPortal(
            <>
              {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
              {/* Built only from sanitized presets, numbers, palette tokens and hex values. */}
              <style
                data-design-system="blocks-preview"
                dangerouslySetInnerHTML={{ __html: css }}
              />
            </>,
            frameDocument.head,
          )
        : null}
    </>
  )
}
