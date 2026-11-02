import { describe, expect, it } from 'vitest'
import { cleanDesignSystem, type CleanDesignSystem } from '@/lib/design/design-system'
import {
  cleanCssClasses,
  cleanCustomCss,
  cleanEntrance,
  cleanEntranceDelay,
  cleanZIndex,
  sanitizeBlockStyle,
} from '@/puck/style/style-schema'
import { blockStyleCss, collectPageStyles } from '@/puck/style/style-css'

const locked = cleanDesignSystem(null)
const customCssOpen: CleanDesignSystem = {
  ...locked,
  lock: { ...locked.lock, customCss: 'open' },
}

describe('EB-09: style-schema extensions', () => {
  describe('cleanCssClasses', () => {
    it('accepts valid class names matching ^[a-z][a-z0-9-]{0,39}$', () => {
      expect(cleanCssClasses(['card', 'hero-section', 'nav-item-1'])).toEqual([
        'card',
        'hero-section',
        'nav-item-1',
      ])
      expect(cleanCssClasses('card hero-section nav-item-1')).toEqual([
        'card',
        'hero-section',
        'nav-item-1',
      ])
    })

    it('deduplicates and limits to at most 5 classes', () => {
      const classes = ['c-1', 'c-2', 'c-1', 'c-3', 'c-4', 'c-5', 'c-6']
      expect(cleanCssClasses(classes)).toEqual(['c-1', 'c-2', 'c-3', 'c-4', 'c-5'])
    })

    it('drops invalid class names (numbers at start, special characters, uppercase converted)', () => {
      expect(cleanCssClasses(['1invalid', '<script>', 'UPPER-CASE', 'valid-one'])).toEqual([
        'upper-case',
        'valid-one',
      ])
      expect(cleanCssClasses('1invalid <img-src>')).toBeUndefined()
    })
  })

  describe('cleanZIndex', () => {
    it('accepts integers between -10 and 100', () => {
      expect(cleanZIndex(0)).toBe(0)
      expect(cleanZIndex(10)).toBe(10)
      expect(cleanZIndex(-10)).toBe(-10)
      expect(cleanZIndex(100)).toBe(100)
      expect(cleanZIndex('25')).toBe(25)
    })

    it('rejects numbers outside [-10, 100] and non-integers', () => {
      expect(cleanZIndex(-11)).toBeUndefined()
      expect(cleanZIndex(101)).toBeUndefined()
      expect(cleanZIndex(5.5)).toBeUndefined()
      expect(cleanZIndex('abc')).toBeUndefined()
    })
  })

  describe('cleanEntrance & cleanEntranceDelay', () => {
    it('accepts valid presets and drops none', () => {
      expect(cleanEntrance('fade-up')).toBe('fade-up')
      expect(cleanEntrance('fade-in')).toBe('fade-in')
      expect(cleanEntrance('zoom-in')).toBe('zoom-in')
      expect(cleanEntrance('none')).toBeUndefined()
      expect(cleanEntrance('invalid-preset')).toBeUndefined()
    })

    it('accepts valid delays and drops 0', () => {
      expect(cleanEntranceDelay(150)).toBe(150)
      expect(cleanEntranceDelay('300')).toBe(300)
      expect(cleanEntranceDelay(500)).toBe(500)
      expect(cleanEntranceDelay(0)).toBeUndefined()
      expect(cleanEntranceDelay(999)).toBeUndefined()
    })
  })

  describe('cleanCustomCss & sanitizeBlockStyle locking', () => {
    it('drops customCss when lock.customCss is locked', () => {
      expect(cleanCustomCss('selector { color: red; }', locked)).toBeUndefined()
      const sanitized = sanitizeBlockStyle(
        {
          textColor: 'deep-navy',
          customCss: 'selector { color: red; }',
        },
        locked,
      )
      expect(sanitized?.customCss).toBeUndefined()
      expect(sanitized?.textColor).toBe('deep-navy')
    })

    it('preserves customCss when lock.customCss is open', () => {
      expect(cleanCustomCss('selector { color: red; }', customCssOpen)).toBe(
        'selector { color: red; }',
      )
      const sanitized = sanitizeBlockStyle(
        {
          textColor: 'deep-navy',
          customCss: 'selector { color: red; }',
        },
        customCssOpen,
      )
      expect(sanitized?.customCss).toBe('selector { color: red; }')
    })

    it('sanitizes cssClasses, zIndex, entrance in sanitizeBlockStyle', () => {
      const sanitized = sanitizeBlockStyle(
        {
          cssClasses: ['custom-box'],
          zIndex: 10,
          entrance: 'fade-up',
          entranceDelay: 150,
        },
        locked,
      )
      expect(sanitized).toEqual({
        cssClasses: ['custom-box'],
        zIndex: 10,
        entrance: 'fade-up',
        entranceDelay: 150,
      })
    })
  })
})

describe('EB-09: CSS generation extensions (style-css)', () => {
  it('adds z-index and position: relative to blockStyleCss', () => {
    const css = blockStyleCss('block-1', { zIndex: 5 })
    expect(css).toContain('z-index:5')
    expect(css).toContain('position:relative')
  })

  it('appends scoped block customCss after _style declarations', () => {
    const css = blockStyleCss('block-1', {
      background: 'soft-pink',
      customCss: 'selector { border: 2px solid green; }',
    })
    expect(css).toBe(
      '[data-eb-id="block-1"]{background-color:rgb(var(--color-soft-pink-rgb))}[data-eb-id="block-1"]{border: 2px solid green}',
    )
  })

  it('collectPageStyles handles page customCss only when open', () => {
    const data = {
      root: { props: { customCss: 'h1 { color: purple; }' } },
      content: [],
    }

    // Locked: no page CSS
    const lockedRes = collectPageStyles(data, locked)
    expect(lockedRes.css).toBe('')

    // Open: scoped under [data-eb-page]
    const openRes = collectPageStyles(data, customCssOpen)
    expect(openRes.css).toBe('[data-eb-page] h1{color: purple}')
  })
})
