import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BlockContextMenu } from '@/puck/editor/context-menu/BlockContextMenu'
import {
  ContextMenuProvider,
  useContextMenu,
} from '@/puck/editor/context-menu/context-menu-context'
import type { Data, ComponentData } from '@puckeditor/core'

const mockDispatch = vi.fn()
const mockGetPermissions = vi.fn()
const mockGetItemById = vi.fn()
const mockGetSelectorForId = vi.fn()
const mockGetParentById = vi.fn()

vi.mock('@puckeditor/core', async () => {
  const actual = await vi.importActual('@puckeditor/core')
  return {
    ...actual,
    usePuck: () => ({
      appState: { data: { content: [] }, ui: {} },
      config: { components: { HeadingWidget: { label: 'Tiêu đề' } } },
      dispatch: mockDispatch,
      getPermissions: mockGetPermissions,
      getItemById: mockGetItemById,
      getSelectorForId: mockGetSelectorForId,
      getParentById: mockGetParentById,
    }),
  }
})

function MenuOpener({ componentId }: { componentId: string }) {
  const { openMenu } = useContextMenu()
  return (
    <button
      type="button"
      data-testid="open-menu-btn"
      onClick={() => openMenu({ componentId, x: 100, y: 150 })}
    >
      Open Menu
    </button>
  )
}

describe('EB-07: BlockContextMenu rendering and interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetItemById.mockReturnValue({
      type: 'HeadingWidget',
      props: { id: 'h-1', text: 'Heading' },
    })
    mockGetSelectorForId.mockReturnValue({
      index: 0,
      zone: 'root:default-zone',
    })
    mockGetParentById.mockReturnValue(null)
    mockGetPermissions.mockReturnValue({
      delete: true,
      duplicate: true,
    })
  })

  it('renders WAI-ARIA role="menu" and menu items when opened', () => {
    render(
      <ContextMenuProvider>
        <MenuOpener componentId="h-1" />
        <BlockContextMenu />
      </ContextMenuProvider>,
    )

    // Initially closed
    expect(screen.queryByRole('menu')).toBeNull()

    // Open menu
    fireEvent.click(screen.getByTestId('open-menu-btn'))
    const menu = screen.getByRole('menu')
    expect(menu).not.toBeNull()

    // All 7 items
    expect(screen.getByRole('menuitem', { name: /^Đổi tên$/ })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: /^Nhân bản$/ })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: /^Sao chép$/ })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: /^Dán$/ })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: /^Dán kiểu$/ })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: /^Đặt lại kiểu$/ })).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: /^Xoá$/ })).not.toBeNull()
  })

  it('disables duplicate and delete for locked blocks', () => {
    mockGetPermissions.mockReturnValue({
      delete: false,
      duplicate: false,
    })

    render(
      <ContextMenuProvider>
        <MenuOpener componentId="h-1" />
        <BlockContextMenu />
      </ContextMenuProvider>,
    )

    fireEvent.click(screen.getByTestId('open-menu-btn'))

    const duplicateBtn = screen.getByRole('menuitem', { name: /^Nhân bản$/ })
    const deleteBtn = screen.getByRole('menuitem', { name: /^Xoá$/ })

    expect(duplicateBtn.getAttribute('aria-disabled')).toBe('true')
    expect(deleteBtn.getAttribute('aria-disabled')).toBe('true')
  })

  it('closes menu when Escape is pressed', () => {
    render(
      <ContextMenuProvider>
        <MenuOpener componentId="h-1" />
        <BlockContextMenu />
      </ContextMenuProvider>,
    )

    fireEvent.click(screen.getByTestId('open-menu-btn'))
    expect(screen.getByRole('menu')).not.toBeNull()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('navigates menu items with arrow keys', () => {
    render(
      <ContextMenuProvider>
        <MenuOpener componentId="h-1" />
        <BlockContextMenu />
      </ContextMenuProvider>,
    )

    fireEvent.click(screen.getByTestId('open-menu-btn'))
    const renameItem = screen.getByRole('menuitem', { name: /^Đổi tên$/ })
    expect(renameItem.getAttribute('tabindex')).toBe('0')

    // Press ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    const duplicateItem = screen.getByRole('menuitem', { name: /^Nhân bản$/ })
    expect(duplicateItem.getAttribute('tabindex')).toBe('0')
  })
})
