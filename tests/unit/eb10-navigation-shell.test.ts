import { describe, it, expect, vi as vitest } from 'vitest'

vitest.mock('server-only', () => ({}))

import { Navigation } from '@/globals/Navigation'
import { buildSiteShellFromPayloadData, DEFAULT_SITE_SHELL_DATA } from '@/lib/site-shell.server'
import { vi as i18nVi } from '@/lib/i18n/vi'
import { isOwnerUser } from '@/lib/auth/access'

describe('EB-10: navigation theme builder fields and site shell data', () => {
  it('defines themeBuilder fields with default code and isOwner access', () => {
    const fields = Navigation.fields as any[]
    const themeBuilder = fields.find((f) => f.type === 'collapsible' && f.label === i18nVi.eb10.navigationThemeBuilder)
    expect(themeBuilder).toBeDefined()

    const subfields = themeBuilder.fields as any[]
    const headerSource = subfields.find((f) => f.name === 'headerSource')
    const headerPage = subfields.find((f) => f.name === 'headerPage')
    const footerSource = subfields.find((f) => f.name === 'footerSource')
    const footerPage = subfields.find((f) => f.name === 'footerPage')

    expect(headerSource).toBeDefined()
    expect(headerSource.defaultValue).toBe('code')
    expect(headerSource.options).toEqual([
      { label: i18nVi.eb10.sourceCode, value: 'code' },
      { label: i18nVi.eb10.sourceBuilder, value: 'builder' },
    ])
    expect(headerPage).toBeDefined()
    expect(headerPage.relationTo).toBe('pages')
    expect(headerPage.filterOptions).toEqual({ kind: { equals: 'header' } })

    expect(footerSource).toBeDefined()
    expect(footerSource.defaultValue).toBe('code')
    expect(footerPage).toBeDefined()
    expect(footerPage.relationTo).toBe('pages')
    expect(footerPage.filterOptions).toEqual({ kind: { equals: 'footer' } })

    // Check that access.update is restricted to owner
    const ownerUser = { collection: 'users', role: 'owner' } as any
    const editorUser = { collection: 'users', role: 'editor' } as any

    expect(headerSource.access?.update?.({ req: { user: ownerUser } })).toBe(true)
    expect(headerSource.access?.update?.({ req: { user: editorUser } })).toBe(false)

    expect(headerPage.access?.update?.({ req: { user: ownerUser } })).toBe(true)
    expect(headerPage.access?.update?.({ req: { user: editorUser } })).toBe(false)

    expect(footerSource.access?.update?.({ req: { user: ownerUser } })).toBe(true)
    expect(footerSource.access?.update?.({ req: { user: editorUser } })).toBe(false)

    expect(footerPage.access?.update?.({ req: { user: ownerUser } })).toBe(true)
    expect(footerPage.access?.update?.({ req: { user: editorUser } })).toBe(false)
  })

  it('buildSiteShellFromPayloadData defaults to code and null builder data', () => {
    const shell = buildSiteShellFromPayloadData({
      navigation: {
        mainMenu: [],
      } as any,
    })

    expect(shell.headerSource).toBe('code')
    expect(shell.headerData).toBeNull()
    expect(shell.footerSource).toBe('code')
    expect(shell.footerData).toBeNull()
    expect(shell.footerHasLegal).toBe(false)
  })

  it('buildSiteShellFromPayloadData respects provided builder data', () => {
    const dummyHeaderData = { content: [], root: { props: { title: 'Header' } } }
    const dummyFooterData = { content: [{ type: 'LegalFooter', props: {} }], root: { props: { title: 'Footer' } } }

    const shell = buildSiteShellFromPayloadData({
      navigation: {
        mainMenu: [],
      } as any,
      headerSource: 'builder',
      headerData: dummyHeaderData as any,
      headerSticky: true,
      footerSource: 'builder',
      footerData: dummyFooterData as any,
      footerHasLegal: true,
    })

    expect(shell.headerSource).toBe('builder')
    expect(shell.headerData).toEqual(dummyHeaderData)
    expect(shell.headerSticky).toBe(true)
    expect(shell.footerSource).toBe('builder')
    expect(shell.footerData).toEqual(dummyFooterData)
    expect(shell.footerHasLegal).toBe(true)
  })
})
