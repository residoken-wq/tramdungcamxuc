import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { BRAND_ICONS } from '@/lib/brand/icons'

describe('BrandIcon (SM-03)', () => {
  it('renders an SVG for all 16 BRAND_ICONS keys', () => {
    for (const { value, label } of BRAND_ICONS) {
      const { container } = render(<BrandIcon name={value} title={label} />)
      const svg = container.querySelector('svg')
      expect(svg, `Expected <svg> for icon key "${value}"`).not.toBeNull()
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
      expect(container.querySelector('title')?.textContent).toBe(label)
    }
  })

  it('renders default aria-hidden="true" when no title is provided', () => {
    const { container } = render(<BrandIcon name="heart" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders null for unknown or empty icon keys', () => {
    const { container: cEmpty } = render(<BrandIcon name="" />)
    expect(cEmpty.firstChild).toBeNull()

    const { container: cUnknown } = render(<BrandIcon name="unknown-icon" />)
    expect(cUnknown.firstChild).toBeNull()

    const { container: cNull } = render(<BrandIcon name={null} />)
    expect(cNull.firstChild).toBeNull()
  })
})
