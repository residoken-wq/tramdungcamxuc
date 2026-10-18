import { describe, expect, it } from 'vitest'
import * as seedData from '../../seed/data'
import { applyPuckMigrations } from '../../src/puck/migrations'

describe('five seed pages from real blocks (T1-16)', () => {
  const pagesBySlug = new Map(seedData.pages.map((p) => [p.slug, p]))

  it('contains the 5 specified pages (sitemap v2 slugs) + 2 placeholder pages (SM-02)', () => {
    expect(seedData.pages).toHaveLength(7)
    expect(Array.from(pagesBySlug.keys())).toEqual([
      '/',
      've-tram',
      'coaching',
      'lo-trinh-chuyen-minh',
      'doanh-nghiep',
      'lien-he',
      'cong-dong',
    ])
  })

  it('home page (/) has the 10 real blocks in the exact 8.1 order', () => {
    const home = pagesBySlug.get('/')
    expect(home).toBeDefined()
    const blockTypes = home!.blocks.map((b) => b.type)
    expect(blockTypes).toEqual([
      'HeroTwoEntries',
      'SectionHeader',
      'LibraryPreview',
      'ProductGrid',
      'HanaStory',
      'StatsBar',
      'TestimonialGrid',
      'LeadForm',
      'QuizCTA',
      'BookingCTA',
    ])
  })

  it('home page HeroTwoEntries has verbatim AGENTS 8.1 copy', () => {
    const home = pagesBySlug.get('/')!
    const hero = home.blocks.find((b) => b.type === 'HeroTwoEntries')
    expect(hero).toBeDefined()
    const props = hero!.props as Record<string, unknown>

    expect(props.titleLine1).toBe('Hiểu mình rõ. Hành động bền bỉ.')
    expect(props.titleLine2).toBe('Tỏa sáng bằng thế mạnh riêng.')

    const entry1 = props.entry1 as Record<string, unknown>
    expect(entry1.label).toBe('Cá nhân')
    expect(entry1.description).toBe('Tôi đang ở một bước chuyển trong sự nghiệp')
    expect(entry1.buttonText).toBe('Khám phá cách Hana đồng hành')
    expect(entry1.buttonLink).toBe('/coaching')

    const entry2 = props.entry2 as Record<string, unknown>
    expect(entry2.label).toBe('Doanh nghiệp')
    expect(entry2.description).toBe('Tôi muốn việc học tạo ra hành vi thực tế')
    expect(entry2.buttonText).toBe('Trao đổi về chương trình cho đội ngũ')
    expect(entry2.buttonLink).toBe('/doanh-nghiep')
  })

  it('/ve-tram has HeroImage + HanaStory + JourneySteps + QuoteBlock + CTAButton', () => {
    const page = pagesBySlug.get('ve-tram')
    expect(page).toBeDefined()
    const blockTypes = page!.blocks.map((b) => b.type)
    expect(blockTypes).toEqual([
      'HeroImage',
      'HanaStory',
      'JourneySteps',
      'QuoteBlock',
      'CTAButton',
    ])
  })

  it('/coaching has SectionHeader + ProductGrid + FAQ + BookingCTA', () => {
    const page = pagesBySlug.get('coaching')
    expect(page).toBeDefined()
    const blockTypes = page!.blocks.map((b) => b.type)
    expect(blockTypes).toEqual(['SectionHeader', 'ProductGrid', 'FAQ', 'BookingCTA'])
  })

  it('/lo-trinh-chuyen-minh has SectionHeader + PackageComparison + BookingCTA + FAQ + TestimonialSlider', () => {
    const page = pagesBySlug.get('lo-trinh-chuyen-minh')
    expect(page).toBeDefined()
    const blockTypes = page!.blocks.map((b) => b.type)
    expect(blockTypes).toEqual([
      'SectionHeader',
      'PackageComparison',
      'BookingCTA',
      'FAQ',
      'TestimonialSlider',
    ])
  })

  it('/doanh-nghiep has SectionHeader + ImageText + ProductGrid + LogoStrip + B2BBriefForm', () => {
    const page = pagesBySlug.get('doanh-nghiep')
    expect(page).toBeDefined()
    const blockTypes = page!.blocks.map((b) => b.type)
    expect(blockTypes).toEqual([
      'SectionHeader',
      'ImageText',
      'ProductGrid',
      'LogoStrip',
      'B2BBriefForm',
    ])
  })

  it('all blocks pass through puckMigrations without change (invariant)', () => {
    for (const page of seedData.pages) {
      const puckData = {
        content: JSON.parse(JSON.stringify(page.blocks)),
        root: { props: { title: page.title } },
        zones: {},
      }
      const migrated = applyPuckMigrations(puckData)
      expect(migrated).toEqual(puckData)
    }
  })

  it('does not contain hardcoded currency numbers in sample text (no /\\d{2,3}\\.000/)', () => {
    const priceRegex = /\d{2,3}\.000/
    for (const page of seedData.pages) {
      const jsonString = JSON.stringify(page.blocks)
      expect(jsonString).not.toMatch(priceRegex)
    }
  })

  it('does not contain "Hana Lương" in sample quotes, titles, cites, or roles', () => {
    for (const page of seedData.pages) {
      for (const b of page.blocks) {
        const props = b.props as Record<string, unknown>
        const textFields = [
          props.title,
          props.titleLine1,
          props.titleLine2,
          props.quote,
          props.cite,
          props.roleOrContext,
          props.quoteLine,
          props.seriesLabel,
        ]
        for (const text of textFields) {
          if (typeof text === 'string') {
            expect(text).not.toContain('Hana Lương')
          }
        }
      }
    }
  })

  it('sample copy invents no figures about the coach (e.g. "10+ năm", "500+ giờ")', () => {
    // AGENTS.md mục 2.2 / 14: stats are entered by Hana; samples stay neutral placeholders.
    const text = JSON.stringify(seedData.pages)
    expect(text).not.toMatch(/\d+\s*\+/)
  })
})
