import { describe, expect, it } from 'vitest'
import { cleanDesignSystem, type CleanDesignSystem } from '@/lib/design/design-system'
import { resolveDevice } from '@/puck/style/style-schema'
import {
  cleanImageUrl,
  sanitizeContainer,
  type ContainerLayout,
} from '@/puck/style/container-schema'

const locked = cleanDesignSystem(null)
const open: CleanDesignSystem = {
  ...locked,
  lock: { ...locked.lock, colors: 'open', fonts: 'open', sizes: 'open' },
}

describe('EB-05: cleanImageUrl (REVIEW-REQUIRED)', () => {
  it('accepts safe relative media file URLs', () => {
    expect(cleanImageUrl('/api/media/file/hero-background.webp')).toBe(
      '/api/media/file/hero-background.webp',
    )
  })

  it('rejects URLs containing injection characters: quotes, parentheses, semicolons, backslashes', () => {
    expect(cleanImageUrl('/api/media/file/img.jpg") ; body { display:none }')).toBeUndefined()
    expect(cleanImageUrl('/api/media/file/img.jpg"')).toBeUndefined()
    expect(cleanImageUrl('/api/media/file/img.jpg\n')).toBeUndefined()
    expect(cleanImageUrl('/api/media/file/img.jpg\\')).toBeUndefined()
  })

  it('rejects javascript: and data: pseudo-protocols', () => {
    expect(cleanImageUrl('javascript:alert(1)')).toBeUndefined()
    expect(cleanImageUrl('JAVASCRIPT:alert(1)')).toBeUndefined()
    expect(cleanImageUrl('data:image/svg+xml,...')).toBeUndefined()
  })

  it('rejects random external domains not in local media path', () => {
    expect(cleanImageUrl('https://evil.com/malicious.png')).toBeUndefined()
    expect(cleanImageUrl('ftp://example.com/test.jpg')).toBeUndefined()
  })

  it('rejects empty and non-string values', () => {
    expect(cleanImageUrl('')).toBeUndefined()
    expect(cleanImageUrl(null)).toBeUndefined()
    expect(cleanImageUrl(123)).toBeUndefined()
  })
})

describe('EB-05: sanitizeContainer', () => {
  it('drops unrecognized values and sets safe defaults', () => {
    const raw = {
      tag: 'h1', // invalid tag -> fallback to 'div'
      width: 'stretch', // invalid -> fallback to 'boxed'
      contentWidth: 'xxl', // invalid -> fallback to 'lg'
      minHeight: 'huge', // invalid -> fallback to 'none'
      layout: {
        direction: { desktop: 'diagonal' }, // invalid -> fallback desktop: 'column'
        justify: { desktop: 'random' },
        align: { desktop: 'super' },
        gap: { desktop: 'bad' },
        wrap: { desktop: 'maybe' },
      },
      background: {
        type: 'video', // invalid -> fallback 'none'
      },
    }

    const res = sanitizeContainer(raw, locked)
    expect(res.tag).toBe('div')
    expect(res.width).toBe('boxed')
    expect(res.contentWidth).toBe('lg')
    expect(res.minHeight).toBe('none')
    expect(res.layout.direction?.desktop).toBe('column')
    expect(res.layout.justify?.desktop).toBeUndefined()
    expect(res.layout.gap?.desktop).toBeUndefined()
    expect(res.background.type).toBe('none')
  })

  it('drops free gap values when sizes are locked, but accepts them when open', () => {
    const raw = {
      layout: {
        gap: { desktop: '28px' },
      },
    }

    const lockedRes = sanitizeContainer(raw, locked)
    expect(lockedRes.layout.gap?.desktop).toBeUndefined()

    const openRes = sanitizeContainer(raw, open)
    expect(openRes.layout.gap?.desktop).toBe('28px')
  })

  it('drops hex gradient colors when colors are locked, but accepts them when open', () => {
    const raw = {
      background: {
        type: 'gradient',
        from: '#FF0055',
        to: '#00FF99',
        angle: 45,
      },
    }

    const lockedRes = sanitizeContainer(raw, locked)
    expect(lockedRes.background.from).toBeUndefined()
    expect(lockedRes.background.to).toBeUndefined()

    const openRes = sanitizeContainer(raw, open)
    expect(openRes.background.from).toBe('#FF0055')
    expect(openRes.background.to).toBe('#00FF99')
    expect(openRes.background.angle).toBe(45)
  })

  it('accepts brand token colors in gradients even when colors are locked', () => {
    const raw = {
      background: {
        type: 'gradient',
        from: 'bright-magenta',
        to: 'deep-navy',
        angle: 90,
      },
    }

    const lockedRes = sanitizeContainer(raw, locked)
    expect(lockedRes.background.from).toBe('bright-magenta')
    expect(lockedRes.background.to).toBe('deep-navy')
    expect(lockedRes.background.angle).toBe(90)
  })

  it('inherits responsive layout mobile ← tablet ← desktop when intermediate values are omitted', () => {
    const layout: ContainerLayout = {
      direction: { desktop: 'row' },
      gap: { desktop: 'lg', mobile: 'sm' },
    }

    expect(resolveDevice(layout.direction, 'desktop')).toBe('row')
    expect(resolveDevice(layout.direction, 'tablet')).toBe('row') // inherits desktop
    expect(resolveDevice(layout.direction, 'mobile')).toBe('row') // inherits tablet (desktop)

    expect(resolveDevice(layout.gap, 'desktop')).toBe('lg')
    expect(resolveDevice(layout.gap, 'tablet')).toBe('lg')
    expect(resolveDevice(layout.gap, 'mobile')).toBe('sm')
  })
})

