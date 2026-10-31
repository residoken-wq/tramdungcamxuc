import React from 'react'
import { describe, it, expect } from 'vitest'
import { puckConfig } from '@/puck/config'
import { getBlockIcon } from '@/puck/editor/block-icons'

describe('getBlockIcon', () => {
  it('returns a valid React SVG element for every component in puckConfig', () => {
    const componentKeys = Object.keys(puckConfig.components)
    expect(componentKeys.length).toBeGreaterThan(0)

    for (const key of componentKeys) {
      const icon = getBlockIcon(key)
      expect(icon).toBeDefined()
      expect(React.isValidElement(icon)).toBe(true)
      const rendered =
        typeof icon.type === 'function'
          ? (icon.type as () => React.ReactElement<React.SVGProps<SVGSVGElement>>)()
          : (icon as React.ReactElement<React.SVGProps<SVGSVGElement>>)
      expect(React.isValidElement(rendered)).toBe(true)
      expect(rendered.props['aria-hidden']).toBe(true)
      expect(rendered.props.viewBox).toBe('0 0 24 24')
    }
  })

  it('returns a valid fallback icon for an unknown component type', () => {
    const fallbackIcon = getBlockIcon('NonExistentCustomBlock')
    expect(fallbackIcon).toBeDefined()
    expect(React.isValidElement(fallbackIcon)).toBe(true)
    const rendered =
      typeof fallbackIcon.type === 'function'
        ? (fallbackIcon.type as () => React.ReactElement<React.SVGProps<SVGSVGElement>>)()
        : (fallbackIcon as React.ReactElement<React.SVGProps<SVGSVGElement>>)
    expect(React.isValidElement(rendered)).toBe(true)
    expect(rendered.props['aria-hidden']).toBe(true)
  })
})
