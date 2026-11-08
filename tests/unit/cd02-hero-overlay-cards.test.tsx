import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import type { Data } from '@puckeditor/core'
import {
  OVERLAY_CLASSES,
  heroOverlayClass,
  type HeroOverlayStrength,
  type HeroOverlayTone,
} from '@/lib/brand/hero-backdrop'
import { fontSizeClass } from '@/lib/brand/format-classes'
import { HeroImage } from '@/components/site/HeroImage'
import { IconCard } from '@/components/site/IconCard'
import { sanitizeChildColors } from '@/puck/migrations/sanitize-child-colors'

describe('CD-02 §1: Hero backdrop overlay classes', () => {
  it('all 6 overlay classes exist literally in hero-backdrop.ts source for Tailwind scanner', () => {
    const sourcePath = path.resolve(process.cwd(), 'src/lib/brand/hero-backdrop.ts')
    const sourceCode = fs.readFileSync(sourcePath, 'utf-8')

    const tones: HeroOverlayTone[] = ['dark', 'light']
    const strengths: HeroOverlayStrength[] = ['md', 'lg', 'xl']

    for (const tone of tones) {
      for (const strength of strengths) {
        const cls = OVERLAY_CLASSES[tone][strength]
        expect(cls).toBeTruthy()
        // Must appear verbatim in the source file
        expect(sourceCode).toContain(`'${cls}'`)
        // heroOverlayClass returns this exact class
        expect(heroOverlayClass(tone, strength)).toBe(cls)
      }
    }
  })

  it('renders HeroImage with backdrop layout and image having correct overlay class', () => {
    const { container } = render(
      <HeroImage
        titleLine1="Tiêu đề thử nghiệm"
        titleLine2="Dòng 2"
        layout="backdrop"
        overlayTone="dark"
        overlayStrength="lg"
        imageUrl="/brand/sample-cover.svg"
        imageAlt="Ảnh bìa mẫu"
      />,
    )

    // Find overlay element with aria-hidden="true"
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).toBeTruthy()
    expect(overlay?.className).toContain('bg-deep-navy/75')
  })
})

describe('CD-02 §2: Slide 51 – Card titleSize xl and color sanitization', () => {
  it('fontSizeClass for card-title with xl returns text-2xl sm:text-3xl lg:text-4xl (all >= 24px)', () => {
    const xlClass = fontSizeClass('card-title', 'xl')
    expect(xlClass).toBe('text-2xl sm:text-3xl lg:text-4xl')
  })

  it('renders IconCard with titleSize xl and font-display correctly', () => {
    const { container } = render(
      <IconCard
        title="05:00 - 05:30"
        titleFont="display"
        titleSize="xl"
        titleColor="accent-pink"
      />,
    )

    const titleEl = container.querySelector('h3')
    expect(titleEl).toBeTruthy()
    expect(titleEl?.className).toContain('text-2xl')
    expect(titleEl?.className).toContain('sm:text-3xl')
    expect(titleEl?.className).toContain('lg:text-4xl')
    expect(titleEl?.className).toContain('text-accent-pink')
  })

  it('sanitizeChildColors keeps accent-pink on Card with titleSize xl and resets to deep-navy on titleSize md', () => {
    const testData: Data = {
      content: [
        {
          type: 'IconCardGrid',
          props: {
            id: 'grid-test',
            cardStyle: 'white',
            bgColor: 'warm-ivory',
            cards: [
              {
                type: 'Card',
                props: {
                  id: 'card-xl',
                  title: 'Thẻ XL',
                  titleSize: 'xl',
                  titleColor: 'accent-pink',
                },
              },
              {
                type: 'Card',
                props: {
                  id: 'card-md',
                  title: 'Thẻ MD',
                  titleSize: 'md',
                  titleColor: 'accent-pink',
                },
              },
            ],
          },
        },
      ],
      root: { props: { title: 'Test' } },
    }

    const sanitized = sanitizeChildColors(testData)
    const grid = sanitized.content[0]
    const cards = grid.props.cards as Array<{ props: { titleColor: string; titleSize: string } }>

    expect(cards[0].props.titleColor).toBe('accent-pink')
    expect(cards[1].props.titleColor).toBe('deep-navy')
  })
})
