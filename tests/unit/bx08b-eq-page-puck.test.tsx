import React from 'react'
import { describe, expect, it, vi as vitest } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vitest.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }))

import { isReservedAppSlug } from '../../src/lib/pages/reserved-slugs'
import { buildEqIntroView, EQ_INTRO_CONTENT_KEYS } from '../../src/lib/eq/intro-view'
import { buildEqPageData, EQ_BUDDY_PAGE_SLUG } from '../../src/puck/templates/eq-page'
import { EqPageSection } from '../../src/components/eq/intro/EqPageSection'
import { EqIntroHeader } from '../../src/components/eq/intro/EqIntroSections'
import { isEqPageBlockType } from '../../src/puck/eq-page-types'
import { puckConfig } from '../../src/puck/config'
import { vi } from '../../src/lib/i18n/vi'

const filled = {
  useDefaultCopyIntro: false,
  useDefaultCopyIntro1: false,
  useDefaultCopyGuide: false,
  tagline: '[MẪU] Series EQ',
  quoteTop: '[MẪU] Châm ngôn',
  mainTitle: '[MẪU] Tiêu đề EQ',
  subtitle: '[MẪU] Dòng phụ',
  intro1Heading: '[MẪU] Bộ thẻ là gì',
  card1Title: '[MẪU] Ô 1',
  card1Desc: '[MẪU] Mô tả 1',
  card3Title: '[MẪU] Ô 3',
  step1Title: '[MẪU] Bước 1',
  shopeeUrl: 'https://shopee.vn/mau-bo-the',
}
const empty = {
  useDefaultCopyIntro: false,
  useDefaultCopyIntro1: false,
  useDefaultCopyGuide: false,
}

describe('BX-08b: /eq-buddy editable with the builder', () => {
  it('/eq-buddy can be a builder page; the draw and QR card screens cannot', () => {
    expect(EQ_BUDDY_PAGE_SLUG).toBe('eq-buddy')
    expect(isReservedAppSlug('eq-buddy')).toBe(false)
    expect(isReservedAppSlug('eq-buddy/rut-the')).toBe(true)
    expect(isReservedAppSlug('eq-buddy/the/tdcx-01')).toBe(true)
  })

  it('template keeps the coded order and stores no text', () => {
    const data = buildEqPageData('[MẪU] Trang EQ')
    expect(data.content.map((b) => b.type)).toEqual(['EqBuddyFrame', 'EqBuddyShopee'])
    const inner = (data.content[0].props.content as { type: string }[]).map((b) => b.type)
    expect(inner).toEqual(['EqBuddyWhatIs', 'EqBuddyDrawButton'])
    const json = JSON.stringify(data)
    for (const text of [vi.bx08.eq.defaultTagline, vi.au02.introTitle, 'shopee']) {
      expect(json).not.toContain(text)
    }
    for (const type of [
      'EqBuddyFrame',
      'EqBuddyWhatIs',
      'EqBuddyDrawButton',
      'EqBuddyGuide',
      'EqBuddyShopee',
    ]) {
      expect(isEqPageBlockType(type)).toBe(true)
      expect(puckConfig.components).toHaveProperty(type)
    }
    expect(puckConfig.categories?.eqBuddyPage?.components).toHaveLength(5)
  })

  it('view follows the BX-05 rules and adds UTM to the Shopee link', () => {
    const view = buildEqIntroView(filled)
    expect(view.hasIntro1).toBe(true)
    expect(view.cards.map((c) => c.title)).toEqual(['[MẪU] Ô 1', '', '[MẪU] Ô 3', ''])
    expect(view.shopeeUrl).toContain('utm_campaign=eq-buddy')
    const blank = buildEqIntroView(empty)
    expect(blank.mainTitle).toBeNull()
    expect(blank.hasIntro1).toBe(false)
    expect(blank.shopeeUrl).toBe('')
    expect(buildEqIntroView(null).mainTitle).toBe(vi.au02.introTitle)
  })

  it('frame renders the header from the global and the dropped blocks inside', () => {
    const html = renderToStaticMarkup(
      <EqPageSection section="frame" _resolved={{ eqContent: filled }} align="left" bg="white">
        <p>[MẪU] Khối con</p>
      </EqPageSection>,
    )
    expect(html).toContain('[MẪU] Tiêu đề EQ')
    expect(html).toContain('[MẪU] Series EQ')
    expect(html).toContain('[MẪU] Khối con')
    expect(html).toContain('bg-white')
    const noBar = renderToStaticMarkup(
      <EqPageSection section="frame" _resolved={{ eqContent: filled }} showSeriesBar={false} />,
    )
    expect(noBar).not.toContain('[MẪU] Series EQ')
    expect(
      renderToStaticMarkup(<EqIntroHeader view={buildEqIntroView(filled)} align="center" />),
    ).toContain('space-y-3 mb-6 text-center font-ui')
  })

  it('draw button goes to /eq-buddy/rut-the; auto size follows "Bộ thẻ là gì"', () => {
    const withIntro = renderToStaticMarkup(
      <EqPageSection section="draw" _resolved={{ eqContent: filled }} />,
    )
    expect(withIntro).toContain('href="/eq-buddy/rut-the"')
    expect(withIntro).toContain('px-7 py-3')
    const without = renderToStaticMarkup(
      <EqPageSection section="draw" _resolved={{ eqContent: empty }} showGuideButton={false} />,
    )
    expect(without).toContain('px-8 py-3.5')
    expect(without).not.toContain(vi.dp01eq.guide)
  })

  it('empty parts are hidden for visitors and explained in the editor', () => {
    expect(
      renderToStaticMarkup(<EqPageSection section="whatIs" _resolved={{ eqContent: empty }} />),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        <EqPageSection section="whatIs" _resolved={{ eqContent: empty }} isEditing />,
      ),
    ).toContain(vi.bx08.eq.sections.whatIs)
    expect(
      renderToStaticMarkup(<EqPageSection section="shopee" _resolved={{ eqContent: empty }} />),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        <EqPageSection section="shopee" _resolved={{ eqContent: empty }} isEditing />,
      ),
    ).toContain(vi.bx08.eq.noShopeeUrl)
    expect(
      renderToStaticMarkup(<EqPageSection section="guide" _resolved={{ eqContent: empty }} />),
    ).toBe('')

    const shopee = renderToStaticMarkup(
      <EqPageSection section="shopee" _resolved={{ eqContent: filled }} />,
    )
    expect(shopee).toContain('shopee.vn/mau-bo-the')
    const grid = renderToStaticMarkup(
      <EqPageSection
        section="whatIs"
        _resolved={{ eqContent: filled }}
        columns={4}
        showIcons={false}
        inCard
      />,
    )
    expect(grid).toContain('lg:grid-cols-4')
    expect(grid).toContain('rounded-2xl sm:rounded-3xl')
  })

  it('guide shows the steps inline or as a button', () => {
    const inline = renderToStaticMarkup(
      <EqPageSection section="guide" _resolved={{ eqContent: filled }} />,
    )
    expect(inline).toContain('[MẪU] Bước 1')
    const button = renderToStaticMarkup(
      <EqPageSection section="guide" _resolved={{ eqContent: filled }} mode="button" />,
    )
    expect(button).toContain(vi.dp01eq.guide)
    expect(button).not.toContain('[MẪU] Bước 1')
  })

  it('resolved data keys never collide with block field names (Puck walks nested props with them)', () => {
    const resolvedKeys = new Set<string>(['eqContent', ...EQ_INTRO_CONTENT_KEYS])
    for (const type of puckConfig.categories?.eqBuddyPage?.components ?? []) {
      const fields = Object.keys(puckConfig.components[type]?.fields ?? {})
      expect(
        fields.filter((f) => resolvedKeys.has(f)),
        type,
      ).toEqual([])
    }
  })
})
