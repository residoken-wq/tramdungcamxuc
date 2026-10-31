import React from 'react'
import { buildDesignCss, googleFontsHref } from '@/lib/design/design-css'
import { getDesignSystem } from '@/lib/design/design-system.server'

/**
 * EB-02: renders, inside <head>, the overrides of the designSystem global: a Google Fonts
 * stylesheet for fonts that replace a self-hosted default, and one <style> with the changed
 * CSS variables. Renders nothing while the site keeps the Brand Book defaults.
 */
export async function DesignSystemStyle() {
  const ds = await getDesignSystem()
  const fontsHref = googleFontsHref(ds)
  const css = buildDesignCss(ds)
  if (!fontsHref && !css) return null
  return (
    <>
      {fontsHref ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fontsHref} data-design-system="fonts" />
        </>
      ) : null}
      {/* Values are built from validated tokens (hex, numbers, a fixed font list). */}
      {css ? <style data-design-system="vars" dangerouslySetInnerHTML={{ __html: css }} /> : null}
    </>
  )
}
