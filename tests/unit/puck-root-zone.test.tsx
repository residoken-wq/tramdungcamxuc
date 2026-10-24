import React from 'react'
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { puckConfig } from '@/puck/config'
import { CHILD_BLOCK_TYPES, ROOT_DROP_ZONE } from '@/puck/constants'

test('PK-07: CHILD_BLOCK_TYPES lists exactly the blocks hidden from the sidebar (insert: false)', () => {
  const childBlocks = Object.entries(puckConfig.components)
    .filter(([, component]) => component.permissions?.insert === false)
    .map(([type]) => type)
    .sort()
  expect([...CHILD_BLOCK_TYPES].sort()).toEqual(childBlocks)
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
  expect(zones).toEqual([{ zone: ROOT_DROP_ZONE, disallow: CHILD_BLOCK_TYPES }])
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
