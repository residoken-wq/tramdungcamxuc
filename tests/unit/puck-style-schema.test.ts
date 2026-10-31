import { describe, expect, it } from 'vitest'
import { cleanDesignSystem, type CleanDesignSystem } from '../../src/lib/design/design-system'
import {
  cleanAnchorId,
  hasStyleKeys,
  resolveDevice,
  sanitizeBlockStyle,
} from '../../src/puck/style/style-schema'

const locked = cleanDesignSystem(null)
const open: CleanDesignSystem = {
  ...locked,
  lock: { ...locked.lock, colors: 'open', fonts: 'open', sizes: 'open' },
}

describe('EB-04: resolveDevice', () => {
  it('inherits mobile ← tablet ← desktop', () => {
    const v = { desktop: 'a', tablet: 'b' }
    expect(resolveDevice(v, 'desktop')).toBe('a')
    expect(resolveDevice(v, 'tablet')).toBe('b')
    expect(resolveDevice(v, 'mobile')).toBe('b')
    expect(resolveDevice({ desktop: 'a' }, 'mobile')).toBe('a')
    expect(resolveDevice(undefined, 'mobile')).toBeUndefined()
  })
})

describe('EB-04: sanitizeBlockStyle', () => {
  it('returns null for empty or non-object input', () => {
    expect(sanitizeBlockStyle(undefined, locked)).toBeNull()
    expect(sanitizeBlockStyle({}, locked)).toBeNull()
    expect(sanitizeBlockStyle('color:red', locked)).toBeNull()
    expect(sanitizeBlockStyle([], locked)).toBeNull()
  })

  it('keeps palette tokens and presets while locked', () => {
    expect(
      sanitizeBlockStyle(
        {
          background: 'soft-pink',
          textColor: 'deep-navy',
          padding: { desktop: { top: 'lg', bottom: 'lg' }, mobile: { top: 'sm' } },
          fontSize: { desktop: 'xl' },
          radius: 'card',
          shadow: 'soft',
          fontWeight: 700,
        },
        locked,
      ),
    ).toEqual({
      background: 'soft-pink',
      textColor: 'deep-navy',
      padding: { desktop: { top: 'lg', bottom: 'lg' }, mobile: { top: 'sm' } },
      fontSize: { desktop: 'xl' },
      radius: 'card',
      shadow: 'soft',
      fontWeight: 700,
    })
  })

  it('drops free values while locked (even if stored), keeps them when open', () => {
    const raw = {
      background: '#123456',
      fontFamily: 'Lora',
      padding: { desktop: { top: '12px' } },
      fontSize: { mobile: '1.5rem' },
    }
    expect(sanitizeBlockStyle(raw, locked)).toBeNull()
    expect(sanitizeBlockStyle(raw, open)).toEqual({
      background: '#123456',
      fontFamily: 'Lora',
      padding: { desktop: { top: '12px' } },
      fontSize: { mobile: '1.5rem' },
    })
  })

  it('drops malformed values, unknown tokens, units and out-of-range numbers', () => {
    expect(
      sanitizeBlockStyle(
        {
          background: 'not-a-token',
          borderColor: '#12345',
          fontFamily: 'Comic Sans',
          padding: { desktop: { top: '12vh', left: '999px', right: '10px;}body{x' } },
          margin: { desktop: { top: '-300px' } },
          fontSize: { desktop: '200px' },
          fontWeight: 500,
          shadow: 'huge',
          borderWidth: 99,
          textAlign: { desktop: 'middle' },
          hideOn: ['phone'],
          anchorId: 'Có Dấu',
        },
        open,
      ),
    ).toBeNull()
  })

  it('accepts negative margins within range when open, and valid extras', () => {
    expect(
      sanitizeBlockStyle(
        {
          margin: { desktop: { top: '-24px' } },
          borderWidth: 2,
          hideOn: ['mobile', 'mobile', 'tablet'],
          anchorId: 'dang-ky',
        },
        open,
      ),
    ).toEqual({
      margin: { desktop: { top: '-24px' } },
      borderWidth: 2,
      hideOn: ['mobile', 'tablet'],
      anchorId: 'dang-ky',
    })
  })

  it('accepts extra palette colours added in the designSystem', () => {
    const ds = {
      ...locked,
      colors: [...locked.colors, { token: 'xanh-la', label: 'x', hex: '#00AA00' }],
    }
    expect(sanitizeBlockStyle({ background: 'xanh-la' }, ds)).toEqual({ background: 'xanh-la' })
  })
})

describe('EB-04: helpers', () => {
  it('cleanAnchorId and hasStyleKeys', () => {
    expect(cleanAnchorId('lien-he')).toBe('lien-he')
    expect(cleanAnchorId('lien he')).toBeUndefined()
    expect(hasStyleKeys({ a: 1 })).toBe(true)
    expect(hasStyleKeys({})).toBe(false)
    expect(hasStyleKeys(null)).toBe(false)
  })
})
