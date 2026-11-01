'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { createUsePuck } from '@puckeditor/core'
import { designSystemGoogleFonts, googleFontsHrefFor } from '@/lib/design/design-css'
import { collectPageStyles } from '@/puck/style/style-css'
import { useStylePanel } from './style-context'

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
  const data = usePuckSelector((s) => s.appState.data)
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
