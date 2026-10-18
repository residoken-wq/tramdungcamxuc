import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { applyPuckMigrations } from '@/puck/migrations'
import * as seedData from '../../seed/data'

describe('SM-03: Puck Migrations on Seed Pages and Blocks', () => {
  it('migrates seedData.pages: no legacy v1 blocks remain for blocks upgraded in SM-03', () => {
    for (const page of seedData.pages) {
      const puckData: Data = {
        root: { props: { title: page.title } },
        content: page.blocks as unknown as Data['content'],
      }
      if (!puckData.content || puckData.content.length === 0) continue

      const migrated = applyPuckMigrations(puckData)
      for (const block of migrated.content) {
        if (
          block.type === 'HeroTwoEntries' ||
          block.type === 'HeroImage' ||
          block.type === 'QuoteBlock' ||
          block.type === 'StatsBar' ||
          block.type === 'TestimonialGrid' ||
          block.type === 'FAQ'
        ) {
          expect((block.props as { version?: number }).version).toBe(2)
        }
        if (block.type === 'PackageComparison') {
          expect((block.props as { version?: number }).version).toBe(3)
        }
      }
    }
  })

  it('is idempotent: running applyPuckMigrations twice produces the exact same output', () => {
    for (const page of seedData.pages) {
      const puckData: Data = {
        root: { props: { title: page.title } },
        content: page.blocks as unknown as Data['content'],
      }
      if (!puckData.content || puckData.content.length === 0) continue

      const run1 = applyPuckMigrations(puckData)
      const run2 = applyPuckMigrations(run1)
      expect(run2).toEqual(run1)
    }
  })

  it('preserves custom props from Hana without overwriting existing non-default values', () => {
    const customData: Data = {
      root: { props: { title: 'Trang tùy chỉnh của Hana' } },
      content: [
        {
          type: 'QuoteBlock',
          props: {
            id: 'quote-custom',
            version: 1,
            quoteText: 'Câu nói tâm đắc của Hana',
            authorName: 'Hana Lương',
            authorTitle: 'Coach',
            tone: 'reflective',
          },
        },
        {
          type: 'StatsBar',
          props: {
            id: 'stats-custom',
            version: 1,
            stats: [
              {
                value: '100+',
                label: 'Khách hàng',
                description: 'Thân chủ khai vấn',
                icon: 'heart',
              },
            ],
          },
        },
        {
          type: 'HeroTwoEntries',
          props: {
            id: 'hero-custom',
            version: 1,
            entry1Title: 'Cá nhân tùy chỉnh',
            entryStyle: 'cards',
          },
        },
        {
          type: 'HeroImage',
          props: {
            id: 'hero-img-custom',
            version: 1,
            secondaryButtonText: 'Khám phá ngay',
            secondaryButtonLink: '/kham-pha',
            badges: [{ text: 'Mới' }],
            stats: [{ value: '5/5', label: 'Đánh giá' }],
          },
        },
        {
          type: 'PackageComparison',
          props: {
            id: 'pkg-custom',
            version: 2,
            highlightPackageId: 'build',
            highlightLabel: 'Gói vàng',
            showPackageButtons: true,
            packageButtonText: 'Chọn gói này',
          },
        },
        {
          type: 'TestimonialGrid',
          props: {
            id: 'test-custom',
            version: 1,
            variant: 'story',
          },
        },
        {
          type: 'FAQ',
          props: {
            id: 'faq-custom',
            version: 1,
            numbered: true,
            aside: 'booking',
            bookingAsideTitle: 'Cần hỗ trợ thêm?',
          },
        },
      ],
    }

    const migrated = applyPuckMigrations(customData)

    const quote = migrated.content.find((b) => b.props.id === 'quote-custom')
    expect(quote?.props.version).toBe(2)
    expect(quote?.props.tone).toBe('reflective')
    expect(quote?.props.quoteText).toBe('Câu nói tâm đắc của Hana')

    const stats = migrated.content.find((b) => b.props.id === 'stats-custom')
    expect(stats?.props.version).toBe(2)
    expect(
      (stats?.props.stats as Array<{ description?: string; icon?: string }>)[0].description,
    ).toBe('Thân chủ khai vấn')
    expect((stats?.props.stats as Array<{ description?: string; icon?: string }>)[0].icon).toBe(
      'heart',
    )

    const hero = migrated.content.find((b) => b.props.id === 'hero-custom')
    expect(hero?.props.version).toBe(2)
    expect(hero?.props.entryStyle).toBe('cards')
    expect(hero?.props.entry1Title).toBe('Cá nhân tùy chỉnh')

    const heroImg = migrated.content.find((b) => b.props.id === 'hero-img-custom')
    expect(heroImg?.props.version).toBe(2)
    expect(heroImg?.props.secondaryButtonText).toBe('Khám phá ngay')
    expect(heroImg?.props.secondaryButtonLink).toBe('/kham-pha')
    expect((heroImg?.props.badges as Array<{ text?: string }>)[0].text).toBe('Mới')
    expect((heroImg?.props.stats as Array<{ value?: string }>)[0].value).toBe('5/5')

    const pkg = migrated.content.find((b) => b.props.id === 'pkg-custom')
    expect(pkg?.props.version).toBe(3)
    expect(pkg?.props.highlightPackageId).toBe('build')
    expect(pkg?.props.highlightLabel).toBe('Gói vàng')
    expect(pkg?.props.showPackageButtons).toBe(true)

    const testimonial = migrated.content.find((b) => b.props.id === 'test-custom')
    expect(testimonial?.props.version).toBe(2)
    expect(testimonial?.props.variant).toBe('story')

    const faq = migrated.content.find((b) => b.props.id === 'faq-custom')
    expect(faq?.props.version).toBe(2)
    expect(faq?.props.numbered).toBe(true)
    expect(faq?.props.aside).toBe('booking')
    expect(faq?.props.bookingAsideTitle).toBe('Cần hỗ trợ thêm?')
  })
})
