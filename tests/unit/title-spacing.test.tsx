import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import {
  cleanEmotionGap,
  cleanEyebrowGap,
  cleanTitleLineHeight,
  cleanTitleSpacing,
  DEFAULT_TITLE_SPACING,
  EMOTION_GAP_VALUES,
  EYEBROW_GAP_VALUES,
  TITLE_LINE_HEIGHT_VALUES,
} from '../../src/lib/design/title-spacing'
import { cleanDesignSystem, DEFAULT_DESIGN_SYSTEM } from '../../src/lib/design/design-system'
import { SectionHeader } from '../../src/components/ui/SectionHeader'
import { HeroImage } from '../../src/components/site/HeroImage'

describe('PK-13: title-spacing constants and sanitization', () => {
  it('default values match 1.3 line-height, 16px eyebrow gap, 14px emotion gap', () => {
    expect(DEFAULT_TITLE_SPACING.titleLineHeight).toBe('normal')
    expect(DEFAULT_TITLE_SPACING.eyebrowGap).toBe('normal')
    expect(DEFAULT_TITLE_SPACING.emotionGap).toBe('normal')

    expect(TITLE_LINE_HEIGHT_VALUES.normal).toBe('1.3')
    expect(TITLE_LINE_HEIGHT_VALUES.airy).toBe('1.45')
    expect(TITLE_LINE_HEIGHT_VALUES['very-airy']).toBe('1.6')

    expect(EYEBROW_GAP_VALUES.tight).toBe('8px')
    expect(EYEBROW_GAP_VALUES.normal).toBe('16px')
    expect(EYEBROW_GAP_VALUES.airy).toBe('24px')

    expect(EMOTION_GAP_VALUES.tight).toBe('8px')
    expect(EMOTION_GAP_VALUES.normal).toBe('14px')
    expect(EMOTION_GAP_VALUES.airy).toBe('24px')
  })

  it('cleans individual preset values and drops invalid / unknown inputs', () => {
    expect(cleanTitleLineHeight('airy')).toBe('airy')
    expect(cleanTitleLineHeight('very-airy')).toBe('very-airy')
    expect(cleanTitleLineHeight('normal')).toBe('normal')
    expect(cleanTitleLineHeight('unknown')).toBeUndefined()
    expect(cleanTitleLineHeight(1.5)).toBeUndefined()
    expect(cleanTitleLineHeight(null)).toBeUndefined()

    expect(cleanEyebrowGap('tight')).toBe('tight')
    expect(cleanEyebrowGap('normal')).toBe('normal')
    expect(cleanEyebrowGap('airy')).toBe('airy')
    expect(cleanEyebrowGap('huge')).toBeUndefined()

    expect(cleanEmotionGap('tight')).toBe('tight')
    expect(cleanEmotionGap('normal')).toBe('normal')
    expect(cleanEmotionGap('airy')).toBe('airy')
    expect(cleanEmotionGap(14)).toBeUndefined()
  })

  it('cleanTitleSpacing falls back to defaults when input is empty or invalid', () => {
    expect(cleanTitleSpacing(null)).toEqual(DEFAULT_TITLE_SPACING)
    expect(cleanTitleSpacing({})).toEqual(DEFAULT_TITLE_SPACING)
    expect(
      cleanTitleSpacing({
        titleLineHeight: 'invalid',
        eyebrowGap: 'invalid',
        emotionGap: 'invalid',
      }),
    ).toEqual(DEFAULT_TITLE_SPACING)

    expect(
      cleanTitleSpacing({
        titleLineHeight: 'airy',
        eyebrowGap: 'tight',
        emotionGap: 'airy',
      }),
    ).toEqual({
      titleLineHeight: 'airy',
      eyebrowGap: 'tight',
      emotionGap: 'airy',
    })
  })

  it('cleanDesignSystem preserves valid titleSpacing and sanitizes invalid', () => {
    expect(DEFAULT_DESIGN_SYSTEM.titleSpacing).toEqual(DEFAULT_TITLE_SPACING)

    const cleanDefault = cleanDesignSystem(null)
    expect(cleanDefault.titleSpacing).toEqual(DEFAULT_TITLE_SPACING)

    const cleanCustom = cleanDesignSystem({
      titleSpacing: {
        titleLineHeight: 'very-airy',
        eyebrowGap: 'airy',
        emotionGap: 'tight',
      },
    })
    expect(cleanCustom.titleSpacing).toEqual({
      titleLineHeight: 'very-airy',
      eyebrowGap: 'airy',
      emotionGap: 'tight',
    })
  })
})

describe('PK-13: Component render classes with CSS variable fallbacks', () => {
  it('SectionHeader renders title, eyebrow and emotion gaps with CSS variables and proper fallbacks', () => {
    const { container } = render(
      <SectionHeader
        seriesLabel="Nhãn series"
        titleLine1="Dòng 1"
        titleLine2="Dòng 2"
        emotionLine="Dòng cảm xúc"
      />,
    )

    const eyebrow = container.querySelector('span.font-ui')
    expect(eyebrow?.className).toContain('mb-[var(--tdcx-eyebrow-gap,1rem)]')

    const heading = container.querySelector('h2')
    expect(heading?.className).toContain('leading-[var(--tdcx-title-lh,1.3)]')

    const emotion = container.querySelector('p.font-quote')
    expect(emotion?.className).toContain('mt-[var(--tdcx-emotion-gap,0.875rem)]')
  })

  it('HeroImage renders title and gaps with CSS variables and fallback', () => {
    const { container } = render(
      <HeroImage
        seriesLabel="Khởi đầu"
        titleLine1="DÒNG 1"
        titleLine2="DÒNG 2"
        emotionLine="Cảm xúc"
      />,
    )

    const eyebrow = container.querySelector('span.font-ui')
    expect(eyebrow?.className).toContain('mb-[var(--tdcx-eyebrow-gap,0.75rem)]')

    const heading = container.querySelector('h1')
    expect(heading?.className).toContain('leading-[var(--tdcx-title-lh,1.3)]')

    const emotion = container.querySelector('p.font-quote')
    expect(emotion?.className).toContain('mt-[var(--tdcx-emotion-gap,1rem)]')
  })
})
