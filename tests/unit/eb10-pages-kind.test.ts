import { describe, it, expect } from 'vitest'
import { Pages, normalizePageSlug } from '@/collections/Pages'
import { buildPublishedPuckPageWhere } from '@/lib/detail-pages'
import { Navigation } from '@/globals/Navigation'
import { vi } from '@/lib/i18n/vi'
import type { CollectionBeforeValidateHook } from 'payload'

describe('EB-10: pages.kind and public query isolation', () => {
  it('defines kind field with default page, options, and access update false', () => {
    const fields = Pages.fields as Array<{
      name: string
      type: string
      defaultValue?: unknown
      options?: Array<{ label: string; value: string }>
      access?: { update?: () => boolean }
    }>
    const kindField = fields.find((f) => f.name === 'kind')
    expect(kindField).toBeDefined()
    expect(kindField?.type).toBe('select')
    expect(kindField?.defaultValue).toBe('page')
    expect(kindField?.options).toEqual([
      { label: vi.eb10.kindOptions.page, value: 'page' },
      { label: vi.eb10.kindOptions.header, value: 'header' },
      { label: vi.eb10.kindOptions.footer, value: 'footer' },
    ])
    expect(kindField?.access?.update?.()).toBe(false)
  })

  it('includes kind in defaultColumns and listSearchableFields', () => {
    expect(Pages.admin?.defaultColumns).toContain('kind')
    expect(Pages.admin?.listSearchableFields).toContain('kind')
  })

  it('prevents changing kind on update via guardKindImmutabilityHook', () => {
    const beforeValidateHooks = Pages.hooks?.beforeValidate as CollectionBeforeValidateHook[]
    const guardHook = beforeValidateHooks[0]
    expect(guardHook).toBeDefined()

    // Create operation should allow kind
    expect(() =>
      guardHook({
        data: { kind: 'header' },
        req: {} as any,
        operation: 'create',
      } as any),
    ).not.toThrow()

    // Update with same kind should pass
    expect(() =>
      guardHook({
        data: { kind: 'header' },
        originalDoc: { kind: 'header' },
        req: {} as any,
        operation: 'update',
      } as any),
    ).not.toThrow()

    // Update with different kind should throw ValidationError
    try {
      guardHook({
        data: { kind: 'page' },
        originalDoc: { kind: 'header' },
        req: {} as any,
        operation: 'update',
      } as any)
      expect.unreachable('Should have thrown ValidationError')
    } catch (err: any) {
      const msg = err.data?.errors?.[0]?.message || err.message
      expect(msg).toContain(vi.eb10.errorKindImmutable)
    }
  })

  it('auto-generates internal slug for header and footer while keeping page slug logic', () => {
    const beforeValidateHooks = Pages.hooks?.beforeValidate as CollectionBeforeValidateHook[]
    const normalizeHook = beforeValidateHooks[1]
    expect(normalizeHook).toBeDefined()

    // Header without slug gets __dau-trang- prefix
    const headerData = { kind: 'header' } as any
    normalizeHook({ data: headerData, req: {} as any, operation: 'create' } as any)
    expect(headerData.slug).toMatch(/^__dau-trang-[a-z0-9]+$/)

    // Footer without slug gets __chan-trang- prefix
    const footerData = { kind: 'footer' } as any
    normalizeHook({ data: footerData, req: {} as any, operation: 'create' } as any)
    expect(footerData.slug).toMatch(/^__chan-trang-[a-z0-9]+$/)

    // Regular page normalizes slug
    const pageData = { kind: 'page', slug: '/gioi-thieu/' } as any
    normalizeHook({ data: pageData, req: {} as any, operation: 'create' } as any)
    expect(pageData.slug).toBe('gioi-thieu')
  })

  it('ensures buildPublishedPuckPageWhere isolates to kind = page', () => {
    const where = buildPublishedPuckPageWhere('ve-chung-toi')
    expect(where).toEqual({
      and: [
        { slug: { equals: 've-chung-toi' } },
        { _status: { equals: 'published' } },
        { kind: { equals: 'page' } },
      ],
    })
  })

  it('ensures Navigation destination page relation filters only kind = page', () => {
    const mainMenuField = (Navigation.fields as any[]).find((f) => f.name === 'mainMenu')
    expect(mainMenuField).toBeDefined()
    const pageField = mainMenuField.fields.find((f: any) => f.name === 'page')
    expect(pageField).toBeDefined()
    expect(pageField.filterOptions).toEqual({
      kind: { equals: 'page' },
    })
  })
})
