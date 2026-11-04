import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { cleanDesignSystem } from '@/lib/design/design-system'
import { sanitizeBlockStyle } from '@/puck/style/style-schema'
import { collectPageStyles } from '@/puck/style/style-css'
import { textTarget, TEXT_TARGET_ATTR } from '@/puck/style/text-target'
import { HanaStory } from '@/components/site/HanaStory'

const lockedDs = cleanDesignSystem(null)
const openDs = {
  ...lockedDs,
  lock: { ...lockedDs.lock, colors: 'open' as const, sizes: 'open' as const },
}

describe('EB-15a: textTarget helper & contract', () => {
  it('exports exact TEXT_TARGET_ATTR data-eb-text', () => {
    expect(TEXT_TARGET_ATTR).toBe('data-eb-text')
  })

  it('generates correct attribute when blockId and key are provided', () => {
    expect(textTarget('block-123', 'titleLine1')).toEqual({
      'data-eb-text': 'block-123:titleLine1',
    })
  })

  it('returns empty object when blockId is missing', () => {
    expect(textTarget(undefined, 'titleLine1')).toEqual({})
    expect(textTarget('', 'titleLine1')).toEqual({})
  })
})

describe('EB-15a: sanitizeBlockStyle texts validation', () => {
  it('strips keys not declared in TEXT_TARGETS for that blockType', () => {
    const raw = {
      texts: {
        titleLine1: { color: 'accent-pink' },
        unknownField: { color: 'bright-magenta' },
        hackKey: { weight: 700 },
      },
    }
    const clean = sanitizeBlockStyle(raw, lockedDs, 'HeroTwoEntries')
    expect(clean?.texts).toBeDefined()
    expect(clean?.texts?.titleLine1).toEqual({ color: 'accent-pink' })
    expect(clean?.texts?.unknownField).toBeUndefined()
    expect(clean?.texts?.hackKey).toBeUndefined()
  })

  it('drops invalid color tokens when locked', () => {
    const raw = {
      texts: {
        titleLine1: { color: 'not-a-brand-color' },
        titleLine2: { color: 'bright-magenta' },
      },
    }
    const clean = sanitizeBlockStyle(raw, lockedDs, 'HeroTwoEntries')
    expect(clean?.texts?.titleLine1?.color).toBeUndefined()
    expect(clean?.texts?.titleLine2?.color).toBe('bright-magenta')
  })

  it('accepts custom hex/rgb colors only when colors lock is open', () => {
    const raw = {
      texts: {
        titleLine1: { color: '#ff0055' },
      },
    }
    const cleanLocked = sanitizeBlockStyle(raw, lockedDs, 'HeroTwoEntries')
    expect(cleanLocked?.texts?.titleLine1?.color).toBeUndefined()

    const cleanOpen = sanitizeBlockStyle(raw, openDs, 'HeroTwoEntries')
    expect(cleanOpen?.texts?.titleLine1?.color).toBe('#FF0055')
  })

  it('validates font sizes according to lock', () => {
    const raw = {
      texts: {
        titleLine1: {
          size: {
            desktop: '2xl',
            tablet: 'invalid-size',
            mobile: 'sm',
          },
        },
      },
    }
    const clean = sanitizeBlockStyle(raw, lockedDs, 'HeroTwoEntries')
    expect(clean?.texts?.titleLine1?.size).toEqual({
      desktop: '2xl',
      mobile: 'sm',
    })
  })

  it('limits max 20 target keys to prevent bloat', () => {
    const fakeTargets: Record<string, { color: string }> = {}
    for (let i = 0; i < 25; i++) {
      fakeTargets[`key_${i}`] = { color: 'deep-navy' }
    }
    const raw = { texts: fakeTargets }
    // Pass undefined blockType so all keys pass the allowedTarget check, but limit to 20
    const clean = sanitizeBlockStyle(raw, lockedDs)
    expect(Object.keys(clean?.texts || {}).length).toBeLessThanOrEqual(20)
  })
})

describe('EB-15a: CSS generation and security', () => {
  it('generates double-attribute selector [data-eb-text="id:key"][data-eb-text]', () => {
    const items = [
      {
        type: 'HanaStory',
        props: {
          id: 'story-1',
          _style: {
            texts: {
              titleLine2: {
                color: 'accent-pink',
                weight: 700,
                align: 'center',
                size: { desktop: 'xl', mobile: 'sm' },
              },
            },
          },
        },
      },
    ]

    const { css } = collectPageStyles({ content: items }, lockedDs)
    expect(css).toContain('[data-eb-text="story-1:titleLine2"][data-eb-text]')
    expect(css).toContain('color:rgb(var(--color-accent-pink-rgb));')
    expect(css).toContain('font-weight:700;')
    // Desktop size
    expect(css).toContain('font-size:1.5rem')
    // Mobile media query
    expect(css).toContain('@media (max-width: 767px)')
  })

  it('rejects unsafe id and key from generating malicious CSS rules', () => {
    const items = [
      {
        type: 'HanaStory',
        props: {
          id: 'bad"id</style><script>',
          _style: {
            texts: {
              'bad;key}': { color: 'deep-navy' },
            },
          },
        },
      },
    ]

    const { css } = collectPageStyles({ content: items }, lockedDs)
    expect(css).not.toContain('bad"id')
    expect(css).not.toContain('<script>')
  })
})

describe('EB-15a: Component rendering with textTarget', () => {
  it('renders HanaStory with data-eb-text on targeted text elements', () => {
    const { container } = render(
      <HanaStory
        id="hana-test-1"
        seriesLabel="NHÃN CHUYÊN MỤC"
        titleLine1="DÒNG TIÊU ĐỀ 1"
        titleLine2="DÒNG TIÊU ĐỀ 2"
        quoteLine="Cảm xúc là la bàn"
        storyContent="Đoạn văn tự sự."
      />,
    )

    const seriesEl = container.querySelector("[data-eb-text='hana-test-1:seriesLabel']")
    expect(seriesEl).not.toBeNull()
    expect(seriesEl?.textContent).toBe('NHÃN CHUYÊN MỤC')

    const title1El = container.querySelector("[data-eb-text='hana-test-1:titleLine1']")
    expect(title1El).not.toBeNull()
    expect(title1El?.textContent).toBe('DÒNG TIÊU ĐỀ 1')

    const title2El = container.querySelector("[data-eb-text='hana-test-1:titleLine2']")
    expect(title2El).not.toBeNull()
    expect(title2El?.textContent).toBe('DÒNG TIÊU ĐỀ 2')

    const quoteEl = container.querySelector("[data-eb-text='hana-test-1:quoteLine']")
    expect(quoteEl).not.toBeNull()
    expect(quoteEl?.textContent).toContain('Cảm xúc là la bàn')
  })

  it('renders blocks without id cleanly without throwing or adding undefined attributes', () => {
    const { container } = render(
      <HanaStory
        seriesLabel="NHÃN CHUYÊN MỤC"
        titleLine1="DÒNG TIÊU ĐỀ 1"
        titleLine2="DÒNG TIÊU ĐỀ 2"
      />,
    )

    const textTargets = container.querySelectorAll('[data-eb-text]')
    expect(textTargets.length).toBe(0)
  })
})
