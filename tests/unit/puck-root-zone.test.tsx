import React from 'react'
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { puckConfig } from '@/puck/config'
import { CHILD_BLOCK_TYPES, ROOT_DISALLOW, ROOT_DROP_ZONE } from '@/puck/constants'

test('PK-11: CHILD_BLOCK_TYPES is the child drawer group, and each child is allowed only in its parent slot', () => {
  const categories = puckConfig.categories as Record<string, { components?: string[] }>
  expect([...(categories.children?.components ?? [])].sort()).toEqual([...CHILD_BLOCK_TYPES].sort())

  // Every child block is draggable from the drawer (an empty parent slot can be filled)…
  for (const type of CHILD_BLOCK_TYPES) {
    const component = puckConfig.components[type as keyof typeof puckConfig.components]
    expect(component, type).toBeDefined()
    expect(component.permissions?.insert, type).not.toBe(false)
  }

  // …and is listed in exactly one parent slot's `allow`.
  const allowedBy = new Map<string, string[]>()
  for (const [parent, component] of Object.entries(puckConfig.components)) {
    for (const field of Object.values(component.fields ?? {})) {
      const slot = field as { type?: string; allow?: string[] }
      if (slot.type !== 'slot') continue
      for (const child of slot.allow ?? []) {
        allowedBy.set(child, [...(allowedBy.get(child) ?? []), parent])
      }
    }
  }
  for (const type of CHILD_BLOCK_TYPES) expect(allowedBy.get(type), type).toHaveLength(1)
})

test('PK-07: in the editor the page root zone refuses child blocks; public render keeps children', () => {
  const RootRender = puckConfig.root!.render! as unknown as React.ComponentType<
    Record<string, unknown>
  >
  const zones: Array<Record<string, unknown>> = []
  const RenderDropZone = (props: Record<string, unknown>) => {
    zones.push(props)
    return <div data-testid="zone" />
  }

  const editor = render(
    <RootRender puck={{ isEditing: true, renderDropZone: RenderDropZone }}>
      <p>children</p>
    </RootRender>,
  )
  expect(zones).toEqual([{ zone: ROOT_DROP_ZONE, disallow: ROOT_DISALLOW }])
  expect(editor.queryByText('children')).toBeNull()
  editor.unmount()

  const view = render(
    <RootRender puck={{ isEditing: false, renderDropZone: RenderDropZone }}>
      <p>children</p>
    </RootRender>,
  )
  expect(view.getByText('children')).toBeTruthy()
  expect(zones).toHaveLength(1)
})
