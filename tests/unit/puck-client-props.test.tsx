import { describe, expect, it } from 'vitest'
import type { ReactElement } from 'react'
import { puckConfig } from '@/puck/config'

// Puck passes a `puck` object holding functions to every block render. Blocks rendered by a client
// component must not forward it: a function prop crashes the public (server-rendered) page.
const hasFunction = (value: unknown, depth = 0): boolean => {
  if (typeof value === 'function') return true
  if (!value || typeof value !== 'object' || depth > 3) return false
  return Object.values(value as Record<string, unknown>).some((v) => hasFunction(v, depth + 1))
}

describe('Puck block renders do not forward functions', () => {
  it.each(['ImageText'])('%s', (name) => {
    const component = (
      puckConfig.components as Record<
        string,
        { render: (p: unknown) => ReactElement; defaultProps?: object }
      >
    )[name]
    const element = component.render({
      ...component.defaultProps,
      id: 'x',
      puck: { renderDropZone: () => null, isEditing: false, dragRef: null },
    })
    expect(hasFunction(element.props)).toBe(false)
  })
})
