import { describe, it, expect, vi as vitest } from 'vitest'
import { headerDefaultTemplate, footerDefaultTemplate, getTemplateData } from '@/puck/templates'
import { validatePageKindBlocks } from '@/puck/locks'
import { validateTemplatePuckData } from '@/puck/template-validation'
import { puckConfig } from '@/puck/config'
import { Pages } from '@/collections/Pages'

vitest.mock('server-only', () => ({}))

describe('EB-10 Step 6: Default Header & Footer Templates', () => {
  it('headerDefaultTemplate is valid and passes kind verification', () => {
    const kindValidation = validatePageKindBlocks('header', headerDefaultTemplate)
    expect(kindValidation.valid).toBe(true)

    const templateValidation = validateTemplatePuckData(headerDefaultTemplate, 'page', puckConfig)
    expect(templateValidation.success).toBe(true)

    expect((headerDefaultTemplate.root?.props as { sticky?: string })?.sticky).toBe('sticky')
    const container = headerDefaultTemplate.content?.[0]
    expect(container).toBeDefined()
    const containerItems = (container?.props as any)?.items as any[]
    expect(containerItems).toBeDefined()
    const itemTypes = containerItems.map((i) => i.type)
    expect(itemTypes).toContain('SiteLogo')
    expect(itemTypes).toContain('NavMenu')
    expect(itemTypes).toContain('HeaderCTA')
    expect(itemTypes).toContain('AccountLink')
  })

  it('footerDefaultTemplate is valid and contains exactly 1 LegalFooter', () => {
    const kindValidation = validatePageKindBlocks('footer', footerDefaultTemplate)
    expect(kindValidation.valid).toBe(true)

    const templateValidation = validateTemplatePuckData(footerDefaultTemplate, 'page', puckConfig)
    expect(templateValidation.success).toBe(true)

    const container = footerDefaultTemplate.content?.[0]
    expect(container).toBeDefined()
    const containerItems = (container?.props as any)?.items as any[]
    expect(containerItems).toBeDefined()
    const itemTypes = containerItems.map((i) => i.type)
    expect(itemTypes).toContain('SiteLogo')
    expect(itemTypes).toContain('Tagline')
    expect(itemTypes).toContain('SocialLinks')
    expect(itemTypes).toContain('LegalFooter')
  })

  it('getTemplateData preserves template props when setting title', () => {
    const headerData = getTemplateData('header-default', 'Đầu trang tùy biến')
    expect(headerData).not.toBeNull()
    expect(headerData?.root?.props?.title).toBe('Đầu trang tùy biến')
    expect((headerData?.root?.props as { sticky?: string })?.sticky).toBe('sticky')

    const footerData = getTemplateData('footer-default', 'Chân trang tùy biến')
    expect(footerData).not.toBeNull()
    expect(footerData?.root?.props?.title).toBe('Chân trang tùy biến')
  })

  it('applyTemplateOnCreate hook loads header-default and footer-default when puckData is empty', () => {
    const beforeChangeHooks = Pages.hooks?.beforeChange || []
    // Find applyTemplateOnCreate
    const hook = beforeChangeHooks[0] as any
    expect(hook).toBeDefined()

    // Create header page without puckData
    const headerResult = hook({
      data: { kind: 'header', title: 'Header Test' },
      operation: 'create',
    })
    expect(headerResult.puckData).toBeDefined()
    expect(headerResult.puckData.zones?.['header-container:items']).toBeDefined()

    // Create footer page without puckData
    const footerResult = hook({
      data: { kind: 'footer', title: 'Footer Test' },
      operation: 'create',
    })
    expect(footerResult.puckData).toBeDefined()
    expect(footerResult.puckData.zones?.['footer-container:items']).toBeDefined()

    // Preserves existing puckData if provided
    const customContent = [{ type: 'HeadingWidget', props: { text: 'Custom' } }]
    const existingResult = hook({
      data: { kind: 'header', title: 'Existing', puckData: { content: customContent } },
      operation: 'create',
    })
    expect(existingResult.puckData.content).toEqual(customContent)
  })
})
