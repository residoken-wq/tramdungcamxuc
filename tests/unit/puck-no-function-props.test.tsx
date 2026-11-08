import React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { puckConfig } from '@/puck/config'

// QA 08/11: a block that hands Puck's `puck` object (it holds renderDropZone, a function) to a
// client component crashes the whole public page ("Functions cannot be passed directly to Client
// Components"). The home page went down because of the "Ảnh" (ImageWidget) block. Every block
// must pass on only plain data, e.g. `puck={{ isEditing }}`.
function renderDropZone() {
  return null
}

// Exports of 'use client' files: only these must not receive functions (server components may).
const sources = import.meta.glob('/src/components/{site,ui,brand}/**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>
const modules = import.meta.glob('/src/components/{site,ui,brand}/**/*.tsx', {
  eager: true,
}) as Record<string, Record<string, unknown>>
const CLIENT_COMPONENTS = new Set<unknown>()
for (const [file, src] of Object.entries(sources)) {
  if (!/^\s*['"]use client['"]/.test(src)) continue
  for (const exp of Object.values(modules[file] || {})) {
    if (typeof exp === 'function') CLIENT_COMPONENTS.add(exp)
  }
}

function findFunctionProp(node: unknown, path: string, depth = 0): string | null {
  if (depth > 3 || !node || typeof node !== 'object') return null
  if (React.isValidElement(node)) {
    const props = (node.props ?? {}) as Record<string, unknown>
    const puck = props.puck as Record<string, unknown> | undefined
    if (CLIENT_COMPONENTS.has(node.type) && puck && typeof puck === 'object') {
      for (const [k, v] of Object.entries(puck)) {
        if (typeof v === 'function') return `${path}.props.puck.${k}`
      }
    }
    return findFunctionProp(props.children, `${path}>child`, depth + 1)
  }
  if (Array.isArray(node)) {
    for (const [i, c] of node.entries()) {
      const hit = findFunctionProp(c, `${path}[${i}]`, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

describe('QA 08/11: no block passes the raw `puck` object (with functions) to a child', () => {
  const components = puckConfig.components as unknown as Record<
    string,
    { render?: (p: Record<string, unknown>) => unknown; defaultProps?: Record<string, unknown> }
  >
  for (const [name, comp] of Object.entries(components)) {
    it(name, () => {
      if (typeof comp.render !== 'function') return
      let out: unknown
      try {
        out = comp.render({
          ...(comp.defaultProps || {}),
          id: `${name}-test`,
          puck: { renderDropZone, isEditing: false, metadata: {}, dragRef: null },
        })
      } catch {
        return // blocks that need hooks / context are covered by their own tests
      }
      expect(findFunctionProp(out, name)).toBeNull()
    })
  }
})
