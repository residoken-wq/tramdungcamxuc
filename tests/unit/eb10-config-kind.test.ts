import { describe, it, expect, vi as vitest } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getPuckConfig, headerPuckConfig, footerPuckConfig } from '@/puck/config'
import { vi } from '@/lib/i18n/vi'
import { sanitizePageCustomCss, HEADER_ATTR, FOOTER_ATTR } from '@/puck/style/custom-css'

vitest.mock('server-only', () => ({}))

describe('EB-10 Step 5: Puck Config by Kind & CSS Scoping', () => {
  describe('getPuckConfig for kind = header', () => {
    it('configures header root, fields, and allowed categories', () => {
      const config = getPuckConfig({ kind: 'header' })
      expect(config.root?.label).toBe(vi.eb10.headerRootLabel)
      expect(config.root?.fields?.sticky).toBeDefined()
      expect(config.categories?.site?.components).toEqual([
        'SiteLogo',
        'NavMenu',
        'HeaderCTA',
        'AccountLink',
      ])
      expect(config.categories?.basic).toBeDefined()
      expect(config.categories?.layout).toBeDefined()
      // Disallowed categories should not be in header config
      expect(config.categories?.sales).toBeUndefined()
      expect(config.categories?.intro).toBeUndefined()
      expect(config.categories?.trust).toBeUndefined()
      // LegalFooter is not in header components
      expect(config.components.LegalFooter).toBeUndefined()
      expect(config.components.SiteLogo).toBeDefined()
    })

    it('renders header root with sticky class and dummy page canvas only in editing mode', () => {
      const config = getPuckConfig({ kind: 'header' })
      const Root = config.root?.render as React.ComponentType<Record<string, unknown>>

      // Public render (not editing)
      const publicHtml = renderToStaticMarkup(
        React.createElement(
          Root,
          { sticky: 'sticky' },
          React.createElement('div', { id: 'test-header' }, 'Header Content'),
        ),
      )
      expect(publicHtml).toContain('data-eb-header')
      expect(publicHtml).toContain('sticky top-0 z-30')
      expect(publicHtml).toContain('Header Content')
      expect(publicHtml).not.toContain(vi.eb10.dummyPageCanvas)

      // Editor render (isEditing: true)
      const editorHtml = renderToStaticMarkup(
        React.createElement(
          Root,
          { puck: { isEditing: true }, sticky: 'none' },
          React.createElement('div', { id: 'test-header' }, 'Header Content'),
        ),
      )
      expect(editorHtml).toContain('data-eb-header')
      expect(editorHtml).not.toContain('sticky top-0 z-30')
      expect(editorHtml).toContain(vi.eb10.dummyPageCanvas)
      expect(editorHtml).toContain('aria-hidden="true"')
    })
  })

  describe('getPuckConfig for kind = footer', () => {
    it('configures footer root, allowed categories and LegalFooter locks', () => {
      const config = getPuckConfig({ kind: 'footer' })
      expect(config.root?.label).toBe(vi.eb10.footerRootLabel)
      expect(config.root?.fields?.sticky).toBeUndefined()
      expect(config.categories?.site?.components).toEqual([
        'SiteLogo',
        'Tagline',
        'SocialLinks',
        'LegalFooter',
      ])
      expect(config.components.LegalFooter).toBeDefined()
      expect(config.components.LegalFooter?.permissions).toEqual({
        delete: false,
        duplicate: false,
      })
      // Header-only blocks are not in footer components
      expect(config.components.NavMenu).toBeUndefined()
      expect(config.components.HeaderCTA).toBeUndefined()
    })

    it('renders footer root with data-eb-footer and dummy canvas above only in editing mode', () => {
      const config = getPuckConfig({ kind: 'footer' })
      const Root = config.root?.render as React.ComponentType<Record<string, unknown>>

      // Public render
      const publicHtml = renderToStaticMarkup(
        React.createElement(
          Root,
          {},
          React.createElement('div', { id: 'test-footer' }, 'Footer Content'),
        ),
      )
      expect(publicHtml).toContain('data-eb-footer')
      expect(publicHtml).toContain('Footer Content')
      expect(publicHtml).not.toContain(vi.eb10.dummyPageCanvas)

      // Editor render
      const editorHtml = renderToStaticMarkup(
        React.createElement(
          Root,
          { puck: { isEditing: true } },
          React.createElement('div', { id: 'test-footer' }, 'Footer Content'),
        ),
      )
      expect(editorHtml).toContain('data-eb-footer')
      expect(editorHtml).toContain(vi.eb10.dummyPageCanvas)
      expect(editorHtml).toContain('aria-hidden="true"')
    })
  })

  describe('getPuckConfig for kind = page', () => {
    it('strips site components from regular page config', () => {
      const config = getPuckConfig({ kind: 'page' })
      expect(config.root?.label).toBe(vi.builder.pageLabel)
      expect(config.categories?.site).toBeUndefined()
      expect(config.components.SiteLogo).toBeUndefined()
      expect(config.components.NavMenu).toBeUndefined()
      expect(config.components.LegalFooter).toBeUndefined()
      expect(config.components.SocialLinks).toBeUndefined()
      expect(config.components.Tagline).toBeUndefined()
    })
  })

  describe('CSS scoping for header and footer', () => {
    it('scopes page custom CSS under data-eb-header and data-eb-footer', () => {
      const rawCss = 'h1 { color: #bc039e; } .test-class { font-weight: bold; }'
      const headerCss = sanitizePageCustomCss(rawCss, HEADER_ATTR)
      expect(headerCss).toContain(`[${HEADER_ATTR}] h1`)
      expect(headerCss).toContain(`[${HEADER_ATTR}] .test-class`)

      const footerCss = sanitizePageCustomCss(rawCss, FOOTER_ATTR)
      expect(footerCss).toContain(`[${FOOTER_ATTR}] h1`)
      expect(footerCss).toContain(`[${FOOTER_ATTR}] .test-class`)
    })
  })

  describe('Static exports headerPuckConfig and footerPuckConfig', () => {
    it('exports configured header and footer puck configs', () => {
      expect(headerPuckConfig.root?.label).toBe(vi.eb10.headerRootLabel)
      expect(footerPuckConfig.root?.label).toBe(vi.eb10.footerRootLabel)
    })
  })
})
