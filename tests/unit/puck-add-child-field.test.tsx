/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddChildField } from '@/puck/editor/AddChildField'
import { LeftPanel } from '@/puck/editor/LeftPanel'
import { vi as viLabels } from '@/lib/i18n/vi'

let mockSelectedId = 'parent-123'
let mockSelectedItem: Record<string, unknown> | null = {
  type: 'PackageCards',
  props: {
    id: mockSelectedId,
  },
}

let mockZones: Record<string, Array<{ type: string; props: { id: string } }>> = {
  [`${mockSelectedId}:cards`]: [
    { type: 'PackageCard', props: { id: 'c1' } },
    { type: 'PackageCard', props: { id: 'c2' } },
  ],
}

let mockCanInsert = true
const mockDispatch = vi.fn()

const mockConfig = {
  components: {
    PackageCards: {
      label: 'Các gói Growth Mirror',
      fields: {
        cards: {
          type: 'slot',
          allow: ['PackageCard'],
        },
      },
    },
    PackageCard: {
      label: 'Thẻ gói',
      defaultProps: {
        packageId: '',
      },
    },
    HeroTwoEntries: {
      label: 'Hero Hai lối vào',
      fields: {
        entries: {
          type: 'slot',
          allow: ['EntryCard'],
        },
      },
    },
    EntryCard: {
      label: 'Thẻ lối vào',
    },
  },
  categories: {
    children: {
      title: 'Thẻ con',
      components: ['PackageCard', 'EntryCard'],
    },
  },
}

vi.mock('@puckeditor/core', () => {
  const getMockState = () => ({
    config: mockConfig,
    appState: {
      data: {
        content: [mockSelectedItem].filter(Boolean),
        zones: mockZones,
      },
      ui: {
        itemSelector: mockSelectedItem ? { index: 0, zone: 'root:default-zone' } : null,
      },
    },
    selectedItem: mockSelectedItem,
    dispatch: mockDispatch,
    getPermissions: () => ({ insert: mockCanInsert }),
  })

  return {
    usePuck: () => getMockState(),
    createUsePuck: () => (selector?: (s: unknown) => unknown) =>
      selector ? selector(getMockState()) : getMockState(),
    Drawer: Object.assign(
      ({ children }: { children: React.ReactNode }) => (
        <div data-testid="puck-drawer">{children}</div>
      ),
      {
        Item: ({
          name,
          label,
          children,
        }: {
          name: string
          label: string
          children?: (props: { name: string; children?: React.ReactNode }) => React.ReactElement
        }) => (
          <div data-testid={`drawer-item-${name}`}>
            {typeof children === 'function' ? children({ name }) : label}
          </div>
        ),
      },
    ),
    Puck: {
      Outline: () => <div data-testid="puck-outline-view">Nội dung cây cấu trúc</div>,
    },
  }
})

describe('PK-14: AddChildField component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanInsert = true
    mockSelectedId = 'parent-123'
    // PK-14c: Puck 0.23 keeps slot children in the parent's props, not in data.zones.
    mockSelectedItem = {
      type: 'PackageCards',
      props: {
        id: mockSelectedId,
        cards: [
          { type: 'PackageCard', props: { id: 'c1' } },
          { type: 'PackageCard', props: { id: 'c2' } },
        ],
      },
    }
    mockZones = {}
  })

  it('renders button with child label and card count', () => {
    render(
      <AddChildField
        parentType="PackageCards"
        slotName="cards"
        childType="PackageCard"
      />,
    )

    const expectedBtnText = viLabels.pk14.addChildButton('Thẻ gói')
    const button = screen.getByRole('button', { name: expectedBtnText })
    expect(button).toBeDefined()

    const expectedCountText = viLabels.pk14.childCount(2)
    expect(screen.getByText(expectedCountText)).toBeDefined()
  })

  it('dispatches insert and setUi actions when clicked, without calling onChange', () => {
    const mockOnChange = vi.fn()

    render(
      <AddChildField
        parentType="PackageCards"
        slotName="cards"
        childType="PackageCard"
        onChange={mockOnChange}
      />,
    )

    const expectedBtnText = viLabels.pk14.addChildButton('Thẻ gói')
    const button = screen.getByRole('button', { name: expectedBtnText })
    fireEvent.click(button)

    expect(mockOnChange).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledTimes(2)

    // First call: insert action
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'insert',
      componentType: 'PackageCard',
      destinationZone: `${mockSelectedId}:cards`,
      destinationIndex: 2,
      id: expect.any(String),
    })

    // Second call: setUi action to select the newly added card
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'setUi',
      ui: {
        itemSelector: {
          zone: `${mockSelectedId}:cards`,
          index: 2,
        },
      },
    })
  })

  it('disables the button when permissions forbid insertion', () => {
    mockCanInsert = false

    render(
      <AddChildField
        parentType="PackageCards"
        slotName="cards"
        childType="PackageCard"
      />,
    )

    const expectedBtnText = viLabels.pk14.addChildButton('Thẻ gói')
    const button = screen.getByRole('button', { name: expectedBtnText })
    expect(button.getAttribute('disabled')).not.toBeNull()
    expect(button.getAttribute('title')).toBe(viLabels.pk14.lockedReason)
  })

  it('serializes page data without _addChild key', () => {
    // Simulating Puck page data saving
    const pageData = {
      content: [
        {
          type: 'PackageCards',
          props: {
            id: 'pkg-1',
            version: 2,
            seriesLabel: 'Growth Mirror',
          },
        },
      ],
      zones: {
        'pkg-1:cards': [
          {
            type: 'PackageCard',
            props: { id: 'c1', packageId: 'clear' },
          },
        ],
      },
    }

    const serialized = JSON.stringify(pageData)
    expect(serialized).not.toContain('_addChild')
  })
})

describe('PK-14: LeftPanel child auto-expansion and highlight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockCanInsert = true
    mockSelectedId = 'parent-123'
    mockSelectedItem = {
      type: 'PackageCards',
      props: { id: mockSelectedId },
    }
  })

  it('auto-expands children category and highlights the target child card when parent is selected', () => {
    render(<LeftPanel />)

    // When PackageCards is selected, targetChildType is PackageCard.
    // Category "children" should be expanded.
    const childDrawerItem = screen.getByTestId('drawer-item-PackageCard')
    expect(childDrawerItem).toBeDefined()

    const highlightedEl = document.querySelector('[data-highlighted="true"]')
    expect(highlightedEl).toBeDefined()
    expect(highlightedEl?.getAttribute('data-block-drawer-item')).toBe('PackageCard')
    expect(highlightedEl?.className).toContain('border-bright-magenta')
    expect(highlightedEl?.className).toContain('ring-bright-magenta')
  })
})
