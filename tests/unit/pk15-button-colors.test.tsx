import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  BUTTON_BG_COLORS,
  BUTTON_MIN_CONTRAST,
  allowedButtonTextColors,
  buttonColorStyle,
  buttonTextOptions,
  contrastRatio,
  defaultButtonTextColor,
} from '@/lib/brand/button-colors'
import { HanaStory } from '@/components/site/HanaStory'
import { ImageText } from '@/components/site/ImageText'
import { HanaStoryBlock } from '@/puck/blocks/HanaStory'
import { puckConfig } from '@/puck/config'

describe('PK-15: brand colours for CTA buttons', () => {
  it('every allowed label colour reaches 3:1 (large text) on its fill', () => {
    for (const bg of BUTTON_BG_COLORS) {
      const allowed = allowedButtonTextColors(bg)
      expect(allowed.length, bg).toBeGreaterThan(0)
      for (const t of allowed)
        expect(contrastRatio(bg, t), `${t} on ${bg}`).toBeGreaterThanOrEqual(BUTTON_MIN_CONTRAST)
    }
    expect(allowedButtonTextColors('deep-navy')).not.toContain('deep-navy')
    expect(allowedButtonTextColors('lavender-mist')).not.toContain('accent-pink')
  })

  it('automatic label is white when readable (site primary), else the best contrast', () => {
    expect(defaultButtonTextColor('accent-pink')).toBe('white')
    expect(defaultButtonTextColor('deep-navy')).toBe('white')
    expect(defaultButtonTextColor('soft-pink')).toBe('deep-navy')
  })

  it('style: none when automatic; CSS variables; stale label replaced; border when fill = section', () => {
    expect(buttonColorStyle('', 'white')).toBeUndefined()
    expect(buttonColorStyle('not-a-colour', 'white')).toBeUndefined()
    expect(buttonColorStyle('bright-magenta', 'white')).toEqual({
      backgroundColor: 'rgb(var(--color-bright-magenta-rgb))',
      color: '#FFFFFF',
    })
    // deep-navy text on a deep-navy fill is unreadable: falls back to white.
    expect(buttonColorStyle('deep-navy', 'deep-navy')?.color).toBe('#FFFFFF')
    expect(buttonColorStyle('deep-navy', 'white', 'deep-navy')?.boxShadow).toBe(
      'inset 0 0 0 2px #FFFFFF',
    )
  })

  it('label options follow the chosen fill', () => {
    expect(buttonTextOptions('').map((o) => o.value)).toEqual([''])
    expect(buttonTextOptions('lavender-mist').map((o) => o.value)).toEqual([
      '',
      'deep-navy',
      'bright-magenta',
    ])
  })
})

describe('PK-15: blocks', () => {
  it('HanaStory dark tone: default CTA is the pink primary, not navy on navy', () => {
    const { container } = render(
      <HanaStory tone="dark" titleLine1="[MẪU]" buttonText="Tìm hiểu thêm" buttonLink="/ve-tram" />,
    )
    const link = container.querySelector('a[href="/ve-tram"]') as HTMLElement
    expect(link.className).toContain('bg-accent-pink')
    expect(link.className).not.toContain('bg-deep-navy')
  })

  it('HanaStory: chosen colours become the inline style', () => {
    const { container } = render(
      <HanaStory
        tone="dark"
        titleLine1="[MẪU]"
        buttonText="Tìm hiểu thêm"
        buttonLink="/ve-tram"
        buttonBgColor="soft-pink"
        buttonTextColor="deep-navy"
      />,
    )
    const link = container.querySelector('a[href="/ve-tram"]') as HTMLElement
    expect(link.style.backgroundColor).toBe('rgb(var(--color-soft-pink-rgb))')
    expect(link.style.color).toBe('rgb(var(--color-deep-navy-rgb))')
  })

  it('ImageText on deep-navy: default CTA is the pink primary', () => {
    const { container } = render(
      <ImageText
        bgColor="deep-navy"
        titleLine1="[MẪU]"
        content="[MẪU]"
        buttonText="Đọc tiếp"
        buttonLink="/blog"
      />,
    )
    const link = container.querySelector('a[href="/blog"]') as HTMLElement
    expect(link.className).toContain('bg-accent-pink')
  })

  it('Puck: both blocks list label colours for the chosen fill only', () => {
    const fieldsOf = (cfg: unknown, props: Record<string, unknown>) =>
      (
        cfg as {
          resolveFields: (
            d: { props: Record<string, unknown> },
            p: { fields: Record<string, unknown> },
          ) => Record<string, { options?: Array<{ value: string }> }>
        }
      ).resolveFields({ props }, { fields: (cfg as { fields: Record<string, unknown> }).fields })

    const hana = fieldsOf(HanaStoryBlock, { buttonBgColor: 'deep-navy' })
    expect(hana.buttonTextColor.options?.map((o) => o.value)).toEqual([
      '',
      'white',
      'soft-pink',
      'accent-pink',
    ])
    const imageText = fieldsOf(puckConfig.components.ImageText, {
      bgColor: 'warm-ivory',
      buttonBgColor: 'bright-magenta',
    })
    expect(imageText.buttonTextColor.options?.map((o) => o.value)).toEqual([
      '',
      'white',
      'soft-pink',
    ])
  })
})
