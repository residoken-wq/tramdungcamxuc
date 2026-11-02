import React from 'react'
import { Render } from '@puckeditor/core'
import { designSystemGoogleFonts, googleFontsHrefFor } from '@/lib/design/design-css'
import { getDesignSystem } from '@/lib/design/design-system.server'
import { sanitizePageRichText } from '@/puck/rich-text-data'
import { collectPageStyles } from '@/puck/style/style-css'
import { EntranceAnimator } from './EntranceAnimator'

/**
 * EB-04: `<Render>` plus the page's block styles. Collects the CSS of every block with a valid
 * `_style` into one <style>, and loads the Google fonts those blocks use (minus the ones the
 * designSystem already loads). A page without `_style` renders exactly as `<Render>` alone.
 */
export async function StyledRender({ config, data: rawData }: React.ComponentProps<typeof Render>) {
  const ds = await getDesignSystem()
  // EB-06a / EB-09: rich text & custom HTML is cleaned before Puck renders it (see rich-text-data.ts).
  const data = sanitizePageRichText(rawData, ds)
  const { css, fonts } = collectPageStyles(data, ds)
  const alreadyLoaded = new Set(designSystemGoogleFonts(ds))
  const fontsHref = googleFontsHrefFor(
    new Map(fonts.filter((f) => !alreadyLoaded.has(f)).map((f) => [f, { italic: false }])),
  )
  return (
    <>
      <EntranceAnimator />
      {fontsHref ? (
        <link rel="stylesheet" href={fontsHref} data-design-system="block-fonts" />
      ) : null}
      {/* Built only from sanitized presets, numbers, palette tokens and hex values. */}
      {css ? <style data-design-system="blocks" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <Render config={config} data={data} />
    </>
  )
}
