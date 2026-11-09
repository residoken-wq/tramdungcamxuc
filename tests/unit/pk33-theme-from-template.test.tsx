import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi as vitest } from 'vitest'
import { Render } from '@puckeditor/core'

vitest.mock('server-only', () => ({}))

import { Pages } from '@/collections/Pages'
import { Navigation } from '@/globals/Navigation'
import { footerDefaultTemplate, headerDefaultTemplate } from '@/puck/templates'
import { footerPuckConfig, headerPuckConfig } from '@/puck/config'
import {
  validatePageKindBlocks,
  isLegalFooterHidden,
  SITE_FOOTER_BLOCKS,
  SITE_HEADER_BLOCKS,
  COMMON_THEME_BLOCKS,
} from '@/puck/locks'
import { vi } from '@/lib/i18n/vi'

describe('PK-33: Create Header / Footer from Template', () => {
  const collectBlockTypes = (data: any): string[] => {
    const types: string[] = []
    const walk = (items?: any[]) => {
      if (!items || !Array.isArray(items)) return
      for (const item of items) {
        if (item?.type) types.push(item.type)
        if (item?.props?.items) walk(item.props.items)
      }
    }
    walk(data?.content)
    return types
  }

  describe('1. Endpoint /create-from-template', () => {
    const endpoints = (Pages as any).endpoints || []
    const endpoint = endpoints.find(
      (e: any) => e.path === '/create-from-template' && e.method === 'post',
    )

    it('defines /create-from-template endpoint on Pages collection', () => {
      expect(endpoint).toBeDefined()
      expect(endpoint.handler).toBeInstanceOf(Function)
    })

    it('rejects unauthenticated requests with 403', async () => {
      const req = {
        user: null,
        json: async () => ({ kind: 'footer' }),
      } as any

      const res = await endpoint.handler(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.message).toBe(vi.pk33.errorOnlyOwner)
    })

    it('rejects non-owner users (editor) with 403', async () => {
      const req = {
        user: { collection: 'users', role: 'editor', id: 2 },
        json: async () => ({ kind: 'footer' }),
      } as any

      const res = await endpoint.handler(req)
      expect(res.status).toBe(403)
    })

    it('rejects customers with 403', async () => {
      const req = {
        user: { collection: 'customers', id: 99 },
        json: async () => ({ kind: 'footer' }),
      } as any

      const res = await endpoint.handler(req)
      expect(res.status).toBe(403)
    })

    it('rejects invalid kinds with 400', async () => {
      const req = {
        user: { collection: 'users', role: 'owner', id: 1 },
        json: async () => ({ kind: 'page' }),
      } as any

      const res = await endpoint.handler(req)
      expect(res.status).toBe(400)
    })

    it('allows owner to create header page from template as draft', async () => {
      const createMock = vitest.fn().mockResolvedValue({ id: 101 })
      const req = {
        user: { collection: 'users', role: 'owner', id: 1 },
        payload: { create: createMock },
        json: async () => ({ kind: 'header' }),
      } as any

      const res = await endpoint.handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({ id: 101 })

      expect(createMock).toHaveBeenCalledWith({
        collection: 'pages',
        data: {
          title: vi.pk33.headerTitle,
          kind: 'header',
        },
        draft: true,
        req,
      })
    })

    it('allows owner to create footer page from template as draft', async () => {
      const createMock = vitest.fn().mockResolvedValue({ id: 102 })
      const req = {
        user: { collection: 'users', role: 'owner', id: 1 },
        payload: { create: createMock },
        json: async () => ({ kind: 'footer' }),
      } as any

      const res = await endpoint.handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({ id: 102 })

      expect(createMock).toHaveBeenCalledWith({
        collection: 'pages',
        data: {
          title: vi.pk33.footerTitle,
          kind: 'footer',
        },
        draft: true,
        req,
      })
    })

    it('calling again creates another page document (does not overwrite)', async () => {
      let counter = 200
      const createMock = vitest.fn().mockImplementation(() => Promise.resolve({ id: ++counter }))
      const req = {
        user: { collection: 'users', role: 'owner', id: 1 },
        payload: { create: createMock },
        json: async () => ({ kind: 'footer' }),
      } as any

      const res1 = await endpoint.handler(req)
      const res2 = await endpoint.handler(req)

      const json1 = await res1.json()
      const json2 = await res2.json()

      expect(json1.id).toBe(201)
      expect(json2.id).toBe(202)
      expect(createMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('2. Navigation schema protection and kind description', () => {
    it('disables create drawer button on headerPage and footerPage', () => {
      const fields = Navigation.fields as any[]
      const themeCollapsible = fields.find((f) => f.type === 'collapsible')
      const subfields = themeCollapsible?.fields as any[]

      const headerPage = subfields.find((f) => f.name === 'headerPage')
      const footerPage = subfields.find((f) => f.name === 'footerPage')

      expect(headerPage?.admin?.allowCreate).toBe(false)
      expect(footerPage?.admin?.allowCreate).toBe(false)
    })

    it('updates kind description in Pages to mention creation via Navigation', () => {
      const pagesFields = (Pages as any).fields as any[]
      const kindField = pagesFields.find((f) => f.name === 'kind')

      expect(kindField?.admin?.description).toBe(vi.eb10.kindDesc)
      expect(vi.eb10.kindDesc).toContain('Tạo … từ mẫu')
    })
  })

  describe('3. Footer default template matches code layout and passes locks', () => {
    it('passes kind validation and contains exactly 1 LegalFooter', () => {
      const validation = validatePageKindBlocks('footer', footerDefaultTemplate)
      expect(validation.valid).toBe(true)

      const types = collectBlockTypes(footerDefaultTemplate)
      const legalFooterCount = types.filter((t) => t === 'LegalFooter').length
      expect(legalFooterCount).toBe(1)
    })

    it('is not hidden on any device', () => {
      expect(isLegalFooterHidden(footerDefaultTemplate)).toBe(false)
    })

    it('only contains allowed blocks for footer', () => {
      const allowed = new Set<string>([...COMMON_THEME_BLOCKS, ...SITE_FOOTER_BLOCKS])
      const types = collectBlockTypes(footerDefaultTemplate)
      for (const t of types) {
        expect(allowed.has(t)).toBe(true)
      }
    })

    it('contains brand blocks: SiteLogo, Tagline, SocialLinks, LegalFooter', () => {
      const types = collectBlockTypes(footerDefaultTemplate)
      expect(types).toContain('SiteLogo')
      expect(types).toContain('Tagline')
      expect(types).toContain('SocialLinks')
      expect(types).toContain('LegalFooter')
    })

    it('splits into 2 columns on desktop via nested Containers', () => {
      const rootContainer = footerDefaultTemplate.content?.[0]
      expect(rootContainer?.type).toBe('Container')
      expect(rootContainer?.props?.layout?.direction?.desktop).toBe('row')
      expect(rootContainer?.props?.layout?.direction?.mobile).toBe('column')

      const cols = rootContainer?.props?.items as any[]
      expect(cols).toHaveLength(2)
      expect(cols[0].type).toBe('Container')
      expect(cols[1].type).toBe('Container')

      const leftTypes = (cols[0].props?.items || []).map((i: any) => i.type)
      expect(leftTypes).toEqual(['SiteLogo', 'Tagline', 'SocialLinks'])

      const rightTypes = (cols[1].props?.items || []).map((i: any) => i.type)
      expect(rightTypes).toEqual(['LegalFooter'])
    })
  })

  describe('4. Header default template matches code layout and passes locks', () => {
    it('passes kind validation and only contains allowed blocks', () => {
      const validation = validatePageKindBlocks('header', headerDefaultTemplate)
      expect(validation.valid).toBe(true)

      const allowed = new Set<string>([...COMMON_THEME_BLOCKS, ...SITE_HEADER_BLOCKS])
      const types = collectBlockTypes(headerDefaultTemplate)
      for (const t of types) {
        expect(allowed.has(t)).toBe(true)
      }
    })

    it('contains SiteLogo, NavMenu, AccountLink, HeaderCTA', () => {
      const types = collectBlockTypes(headerDefaultTemplate)
      expect(types).toContain('SiteLogo')
      expect(types).toContain('NavMenu')
      expect(types).toContain('AccountLink')
      expect(types).toContain('HeaderCTA')
    })

    it('hides desktop account and CTA on tablet and mobile to preserve mobile header bar', () => {
      const rootContainer = headerDefaultTemplate.content?.[0]
      const items = rootContainer?.props?.items as any[]

      const account = items.find((i) => i.type === 'AccountLink')
      const cta = items.find((i) => i.type === 'HeaderCTA')

      expect(account?.props?._style?.hideOn).toContain('mobile')
      expect(account?.props?._style?.hideOn).toContain('tablet')
      expect(cta?.props?._style?.hideOn).toContain('mobile')
      expect(cta?.props?._style?.hideOn).toContain('tablet')
    })
  })

  describe('5. Snapshot rendering of header & footer templates', () => {
    it('renders footerDefaultTemplate markup consistently', () => {
      const markup = renderToStaticMarkup(
        <Render config={footerPuckConfig} data={footerDefaultTemplate} />,
      )
      expect(markup).toMatchSnapshot()
    })

    it('renders headerDefaultTemplate markup consistently', () => {
      const markup = renderToStaticMarkup(
        <Render config={headerPuckConfig} data={headerDefaultTemplate} />,
      )
      expect(markup).toMatchSnapshot()
    })
  })
})
