import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import type { Data } from '@puckeditor/core'
import {
  heroBackdropColors,
  heroOverlayClass,
  heroMinHeightClass,
  heroImageBlurStyle,
} from '@/lib/brand/hero-backdrop'
import { migrateHeroTwoEntriesV3ToV4 } from '@/puck/migrations/v4-hero-two-entries'
import { migrateHeroImageV2ToV3 } from '@/puck/migrations/v3-hero-image'
import { HeroTwoEntries } from '@/components/site/HeroTwoEntries'
import { HeroImage } from '@/components/site/HeroImage'
import { HeroTwoEntriesBlock } from '@/puck/blocks/HeroTwoEntries'
import { HeroImageBlock } from '@/puck/blocks/HeroImage'

describe('EB-14a: Hero Backdrop Unit Tests', () => {
  describe('1. heroBackdropColors and color tokens', () => {
    it('returns exact classes according to table 1.2 for dark tone', () => {
      const dark = heroBackdropColors('dark')
      expect(dark.seriesLabel).toBe('text-soft-pink')
      expect(dark.titleLine1).toBe('text-white')
      expect(dark.titleLine2).toBe('text-soft-pink')
      expect(dark.titleLine2).not.toContain('bright-magenta')
      expect(dark.emotionLine).toBe('text-white/90')
      expect(dark.description).toBe('text-white/90')
      expect(dark.chip).toBe('bg-white/10 text-white border border-white/20')
      expect(dark.secondaryButton).toBe('text-white border-white/40 hover:bg-white/10')
      expect(dark.overlayBg).toBe('bg-deep-navy')
      expect(dark.bgToken).toBe('deep-navy')
    })

    it('returns exact classes according to table 1.2 for light tone', () => {
      const light = heroBackdropColors('light')
      expect(light.seriesLabel).toBe('text-bright-magenta')
      expect(light.titleLine1).toBe('text-deep-navy')
      expect(light.titleLine2).toBe('text-bright-magenta')
      expect(light.emotionLine).toBe('text-deep-navy/85')
      expect(light.description).toBe('text-deep-navy/85')
      expect(light.chip).toBe('bg-soft-pink text-deep-navy border border-soft-pink')
      expect(light.secondaryButton).toBe('')
      expect(light.overlayBg).toBe('bg-warm-ivory')
      expect(light.bgToken).toBe('warm-ivory')
    })

    it('heroOverlayClass outputs correct opacity classes', () => {
      expect(heroOverlayClass('dark', 'md')).toBe('bg-deep-navy/60')
      expect(heroOverlayClass('dark', 'lg')).toBe('bg-deep-navy/75')
      expect(heroOverlayClass('dark', 'xl')).toBe('bg-deep-navy/85')
      expect(heroOverlayClass('light', 'md')).toBe('bg-warm-ivory/60')
      expect(heroOverlayClass('light', 'lg')).toBe('bg-warm-ivory/75')
      expect(heroOverlayClass('light', 'xl')).toBe('bg-warm-ivory/85')
    })

    it('heroMinHeightClass and heroImageBlurStyle return correct values', () => {
      expect(heroMinHeightClass('md')).toBe('min-h-[480px]')
      expect(heroMinHeightClass('lg')).toBe('min-h-[640px]')
      expect(heroMinHeightClass('screen')).toBe('min-h-[100svh]')

      expect(heroImageBlurStyle('none')).toEqual({})
      expect(heroImageBlurStyle('sm')).toEqual({ filter: 'blur(4px)', transform: 'scale(1.05)' })
      expect(heroImageBlurStyle('md')).toEqual({ filter: 'blur(8px)', transform: 'scale(1.05)' })
    })
  })

  describe('2. Migrations for HeroTwoEntries and HeroImage', () => {
    it('migrateHeroTwoEntriesV3ToV4 updates v3 to v4 with split layout and default backdrop props', () => {
      const oldData: Data = {
        root: { props: {} },
        content: [
          {
            type: 'HeroTwoEntries',
            props: {
              id: 'hero-1',
              version: 3,
              titleLine1: 'Dòng 1',
              titleLine2: 'Dòng 2',
              bgColor: 'warm-ivory',
            },
          },
        ],
        zones: {},
      }

      const migrated = migrateHeroTwoEntriesV3ToV4(oldData)
      const props = migrated.content[0].props as Record<string, unknown>
      expect(props.version).toBe(4)
      expect(props.layout).toBe('split')
      expect(props.overlayTone).toBe('dark')
      expect(props.overlayStrength).toBe('lg')
      expect(props.imageBlur).toBe('none')
      expect(props.imagePosition).toBe('center')
      expect(props.contentAlign).toBe('center')
      expect(props.minHeight).toBe('lg')
      expect(props.titleLine1).toBe('Dòng 1')
      expect(props.titleLine2).toBe('Dòng 2')
      expect(props.bgColor).toBe('warm-ivory')
      expect(props.entriesLayout).toBe('columns')
      expect(props.entriesPlacement).toBe('below')

      // Idempotency: run twice
      const migratedAgain = migrateHeroTwoEntriesV3ToV4(migrated)
      expect(migratedAgain).toEqual(migrated)
    })

    it('migrateHeroImageV2ToV3 updates v2 to v3 with split layout and default backdrop props', () => {
      const oldData: Data = {
        root: { props: {} },
        content: [
          {
            type: 'HeroImage',
            props: {
              id: 'heroimg-1',
              version: 2,
              titleLine1: 'Tiêu đề ảnh',
              titleLine2: 'Dòng 2',
              bgColor: 'warm-ivory',
            },
          },
        ],
        zones: {},
      }

      const migrated = migrateHeroImageV2ToV3(oldData)
      const props = migrated.content[0].props as Record<string, unknown>
      expect(props.version).toBe(3)
      expect(props.layout).toBe('split')
      expect(props.overlayTone).toBe('dark')
      expect(props.overlayStrength).toBe('lg')
      expect(props.imageBlur).toBe('none')
      expect(props.imagePosition).toBe('center')
      expect(props.contentAlign).toBe('center')
      expect(props.minHeight).toBe('lg')
      expect(props.titleLine1).toBe('Tiêu đề ảnh')

      // Idempotency: run twice
      const migratedAgain = migrateHeroImageV2ToV3(migrated)
      expect(migratedAgain).toEqual(migrated)
    })

    it('migrates nested hero blocks inside containers or slots', () => {
      const nestedData: Data = {
        root: { props: {} },
        content: [
          {
            type: 'Container',
            props: {
              id: 'con-1',
              items: [
                {
                  type: 'HeroTwoEntries',
                  props: {
                    id: 'nested-hero',
                    version: 3,
                    titleLine1: 'Lồng trong container',
                    titleLine2: 'Dòng 2',
                  },
                },
              ],
            },
          },
        ],
        zones: {
          'zone-1': [
            {
              type: 'HeroImage',
              props: {
                id: 'zoned-heroimg',
                version: 2,
                titleLine1: 'Trong zone',
                titleLine2: 'Dòng 2',
              },
            },
          ],
        },
      }

      const m1 = migrateHeroTwoEntriesV3ToV4(nestedData)
      const con = m1.content[0].props as { items: Array<{ props: Record<string, unknown> }> }
      expect(con.items[0].props.version).toBe(4)
      expect(con.items[0].props.layout).toBe('split')

      const m2 = migrateHeroImageV2ToV3(m1)
      const zoned = (m2.zones?.['zone-1']?.[0]?.props ?? {}) as Record<string, unknown>
      expect(zoned.version).toBe(3)
      expect(zoned.layout).toBe('split')
    })
  })

  describe('3. Render split layout preserves exact behavior of legacy data', () => {
    it('HeroTwoEntries in split mode renders text and side image container', () => {
      const { container } = render(
        <HeroTwoEntries
          layout="split"
          titleLine1="HIỂU MÌNH"
          titleLine2="RÕ HƠN"
          imageUrl="/test.jpg"
          imageAlt="[MẪU] Ảnh mô tả"
        />,
      )
      expect(container.querySelector('.lg\\:grid-cols-12')).toBeTruthy()
      expect(container.querySelector('img[alt="[MẪU] Ảnh mô tả"]')).toBeTruthy()
      expect(container.querySelector('.bg-deep-navy\\/75')).toBeNull()
    })

    it('HeroImage in split mode renders centered content and banner below', () => {
      const { container } = render(
        <HeroImage
          layout="split"
          titleLine1="TIÊU ĐỀ ẢNH"
          titleLine2="DÒNG 2"
          imageUrl="/test-banner.jpg"
          imageAlt="[MẪU] Ảnh banner"
        />,
      )
      expect(container.querySelector('.aspect-\\[16\\/9\\]')).toBeTruthy()
      expect(container.querySelector('img[alt="[MẪU] Ảnh banner"]')).toBeTruthy()
      expect(container.querySelector('.bg-deep-navy\\/75')).toBeNull()
    })
  })

  describe('4. Render backdrop with valid image', () => {
    it('HeroTwoEntries renders img with alt, correct overlay strength, and white title', () => {
      const { container } = render(
        <HeroTwoEntries
          layout="backdrop"
          overlayTone="dark"
          overlayStrength="lg"
          imageBlur="sm"
          imageUrl="/sample-hero.jpg"
          imageAlt="[MẪU] Chân dung Hana"
          titleLine1="TRẠM DỪNG"
          titleLine2="CẢM XÚC"
          emotionLine="Dòng cảm xúc dịu êm"
        />,
      )

      const img = container.querySelector('img[alt="[MẪU] Chân dung Hana"]')
      expect(img).toBeTruthy()

      // Overlay div has bg-deep-navy/75 and aria-hidden
      const overlay = container.querySelector('div.bg-deep-navy\\/75[aria-hidden="true"]')
      expect(overlay).toBeTruthy()

      // Title line 1 is white, title line 2 is soft-pink (dark backdrop)
      const h1 = container.querySelector('h1')
      expect(h1).toBeTruthy()
      const spans = h1?.querySelectorAll('span')
      expect(spans?.[0].className).toContain('text-white')
      expect(spans?.[1].className).toContain('text-soft-pink')
      expect(spans?.[1].className).not.toContain('text-bright-magenta')
    })

    it('HeroImage in backdrop mode renders image backdrop, overlay, and correct light tone colors', () => {
      const { container } = render(
        <HeroImage
          layout="backdrop"
          overlayTone="light"
          overlayStrength="md"
          imageUrl="/sample-hero.jpg"
          imageAlt="[MẪU] Ảnh nền sáng"
          titleLine1="DÒNG SÁNG 1"
          titleLine2="DÒNG SÁNG 2"
          badges={[{ text: 'Huy hiệu 1' }]}
        />,
      )

      const img = container.querySelector('img[alt="[MẪU] Ảnh nền sáng"]')
      expect(img).toBeTruthy()

      // Overlay div has bg-warm-ivory/60
      const overlay = container.querySelector('div.bg-warm-ivory\\/60[aria-hidden="true"]')
      expect(overlay).toBeTruthy()

      // Title line 1 is deep-navy, title line 2 is bright-magenta
      const h1 = container.querySelector('h1')
      const spans = h1?.querySelectorAll('span')
      expect(spans?.[0].className).toContain('text-deep-navy')
      expect(spans?.[1].className).toContain('text-bright-magenta')

      // Chip has soft-pink background and deep-navy text
      const chip = container.querySelector('span.bg-soft-pink')
      expect(chip).toBeTruthy()
    })
  })

  describe('5. Backdrop without image gracefully falls back to bgColor with no overlay', () => {
    it('HeroTwoEntries in backdrop without image renders no img, no overlay, and uses bgColor', () => {
      const { container } = render(
        <HeroTwoEntries
          layout="backdrop"
          bgColor="soft-pink"
          titleLine1="KHÔNG ẢNH"
          titleLine2="VẪN ĐẸP"
        />,
      )

      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('[aria-hidden="true"].bg-deep-navy\\/75')).toBeNull()
      expect(container.querySelector('[aria-hidden="true"].bg-warm-ivory\\/75')).toBeNull()
      expect(container.querySelector('section')?.className).toContain('bg-soft-pink')
    })

    it('HeroImage in backdrop without image renders no img, no overlay, and uses bgColor', () => {
      const { container } = render(
        <HeroImage
          layout="backdrop"
          bgColor="butter-cream"
          titleLine1="KHÔNG ẢNH"
          titleLine2="VẪN ĐẸP"
        />,
      )

      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('[aria-hidden="true"].bg-deep-navy\\/75')).toBeNull()
      expect(container.querySelector('section')?.className).toContain('bg-butter-cream')
    })
  })

  describe('6. resolveFields logic', () => {
    it('HeroTwoEntriesBlock hides overlay fields when layout is not backdrop', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params = { fields: { ...HeroTwoEntriesBlock.fields } } as any
      const resolvedSplit = HeroTwoEntriesBlock.resolveFields?.(
        { props: { id: 'test-hero', layout: 'split', titleLine1: 'Test', titleLine2: 'Test' } },
        params,
      ) as Record<string, unknown> | undefined
      expect(resolvedSplit?.overlayTone).toBeUndefined()
      expect(resolvedSplit?.overlayStrength).toBeUndefined()
      expect(resolvedSplit?.imageBlur).toBeUndefined()
      expect(resolvedSplit?.imagePosition).toBeUndefined()
      expect(resolvedSplit?.contentAlign).toBeUndefined()
      expect(resolvedSplit?.minHeight).toBeUndefined()

      const resolvedBackdrop = HeroTwoEntriesBlock.resolveFields?.(
        { props: { id: 'test-hero', layout: 'backdrop', titleLine1: 'Test', titleLine2: 'Test' } },
        params,
      ) as Record<string, unknown> | undefined
      expect(resolvedBackdrop?.overlayTone).toBeDefined()
      expect(resolvedBackdrop?.overlayStrength).toBeDefined()
      expect(resolvedBackdrop?.imageBlur).toBeDefined()
      expect(resolvedBackdrop?.imagePosition).toBeDefined()
      expect(resolvedBackdrop?.contentAlign).toBeDefined()
      expect(resolvedBackdrop?.minHeight).toBeDefined()
      // entriesPlacement is hidden in backdrop mode
      expect(resolvedBackdrop?.entriesPlacement).toBeUndefined()
      expect(resolvedSplit?.entriesPlacement).toBeDefined()
    })

    it('HeroImageBlock adapts statColor options based on overlay tone when in backdrop mode', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params = { fields: { ...HeroImageBlock.fields } } as any
      const resolvedDark = HeroImageBlock.resolveFields?.(
        {
          props: {
            id: 'test-heroimg',
            layout: 'backdrop',
            overlayTone: 'dark',
            titleLine1: '',
            titleLine2: '',
          },
        },
        params,
      ) as Record<string, unknown> | undefined
      const darkOptions = (
        resolvedDark?.statValueColor as { options: Array<{ value: string }> }
      )?.options.map((o) => o.value)
      // deep-navy only allows white and soft-pink
      expect(darkOptions).toEqual(['white', 'soft-pink'])

      const resolvedLight = HeroImageBlock.resolveFields?.(
        {
          props: {
            id: 'test-heroimg',
            layout: 'backdrop',
            overlayTone: 'light',
            titleLine1: '',
            titleLine2: '',
          },
        },
        params,
      ) as Record<string, unknown> | undefined
      const lightOptions = (
        resolvedLight?.statValueColor as { options: Array<{ value: string }> }
      )?.options.map((o) => o.value)
      // warm-ivory allows deep-navy, bright-magenta, accent-pink
      expect(lightOptions).toContain('deep-navy')
      expect(lightOptions).toContain('bright-magenta')
    })
  })

  describe('7. Section 1.6: entriesLayout and entriesPlacement in HeroTwoEntries', () => {
    it('renders with data-entries-layout="rows" when entriesLayout is rows', () => {
      const { container } = render(
        <HeroTwoEntries
          titleLine1="TIÊU ĐỀ 1"
          titleLine2="TIÊU ĐỀ 2"
          entriesLayout="rows"
          entriesPlacement="below"
          entry1={{ label: 'Cá nhân', description: 'Mô tả 1', buttonText: 'Xem', buttonLink: '#' }}
          entry2={{
            label: 'Doanh nghiệp',
            description: 'Mô tả 2',
            buttonText: 'Xem',
            buttonLink: '#',
          }}
        />,
      )

      const wrapper = container.querySelector('[data-entries-layout]')
      expect(wrapper).not.toBeNull()
      expect(wrapper?.getAttribute('data-entries-layout')).toBe('rows')
    })

    it('renders with data-entries-layout="columns" by default', () => {
      const { container } = render(
        <HeroTwoEntries
          titleLine1="TIÊU ĐỀ 1"
          titleLine2="TIÊU ĐỀ 2"
          entry1={{ label: 'Cá nhân', description: 'Mô tả 1', buttonText: 'Xem', buttonLink: '#' }}
          entry2={{
            label: 'Doanh nghiệp',
            description: 'Mô tả 2',
            buttonText: 'Xem',
            buttonLink: '#',
          }}
        />,
      )

      const wrapper = container.querySelector('[data-entries-layout]')
      expect(wrapper).not.toBeNull()
      expect(wrapper?.getAttribute('data-entries-layout')).toBe('columns')
    })

    it('renders entries inside text column when layout=split, has image, and entriesPlacement=textColumn', () => {
      const { container } = render(
        <HeroTwoEntries
          layout="split"
          imageUrl="https://example.com/hero.jpg"
          imageAlt="[MẪU] Hero"
          titleLine1="TIÊU ĐỀ 1"
          titleLine2="TIÊU ĐỀ 2"
          entriesLayout="rows"
          entriesPlacement="textColumn"
          entry1={{ label: 'Cá nhân', description: 'Mô tả 1', buttonText: 'Xem', buttonLink: '#' }}
          entry2={{
            label: 'Doanh nghiệp',
            description: 'Mô tả 2',
            buttonText: 'Xem',
            buttonLink: '#',
          }}
        />,
      )

      // The left column has order-1 lg:col-span-7
      const leftCol = container.querySelector('.order-1.lg\\:col-span-7')
      expect(leftCol).not.toBeNull()

      const entriesWrapper = leftCol?.querySelector('[data-entries-layout="rows"]')
      expect(entriesWrapper).not.toBeNull()
    })
  })
})
