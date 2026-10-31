/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeftPanel, loadLeftPanelStorage, saveLeftPanelStorage } from '@/puck/editor/LeftPanel'

// Mock minimal Puck context
const mockDispatch = vi.fn()
const mockGetPermissions = vi.fn(() => ({ insert: true }))

const mockPuckState = {
  config: {
    categories: {
      intro: {
        title: 'Mở đầu',
        components: ['HeroTwoEntries', 'HeroImage'],
      },
      content: {
        title: 'Nội dung',
        components: ['RichText', 'QuoteBlock'],
      },
    },
    components: {
      HeroTwoEntries: { label: 'Hero Hai lối vào' },
      HeroImage: { label: 'Hero Ảnh biểu tượng' },
      RichText: { label: 'Văn bản phong phú' },
      QuoteBlock: { label: 'Khối trích dẫn' },
    },
  },
  appState: {
    ui: {
      leftSideBarVisible: true,
    },
  },
  dispatch: mockDispatch,
  getPermissions: mockGetPermissions,
}

vi.mock('@puckeditor/core', () => {
  return {
    usePuck: () => mockPuckState,
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

describe('LeftPanel component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders with tabs and has correct aria-selected attributes', () => {
    render(<LeftPanel />)

    const blocksTab = screen.getByRole('tab', { name: /Khối/i })
    const outlineTab = screen.getByRole('tab', { name: /Cấu trúc/i })

    expect(blocksTab).toBeDefined()
    expect(outlineTab).toBeDefined()
    expect(blocksTab.getAttribute('aria-selected')).toBe('true')
    expect(outlineTab.getAttribute('aria-selected')).toBe('false')
  })

  it('switches between "Khối" and "Cấu trúc" tabs on click', () => {
    render(<LeftPanel />)

    const outlineTab = screen.getByRole('tab', { name: /Cấu trúc/i })
    fireEvent.click(outlineTab)

    expect(outlineTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('puck-outline-view')).toBeDefined()

    const blocksTab = screen.getByRole('tab', { name: /Khối/i })
    fireEvent.click(blocksTab)

    expect(blocksTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.queryByTestId('puck-outline-view')).toBeNull()
  })

  it('filters blocks as user types in search input', () => {
    render(<LeftPanel />)

    const searchInput = screen.getByPlaceholderText(/Tìm khối/i)
    expect(screen.getByText('Hero Hai lối vào')).toBeDefined()
    expect(screen.getByText('Văn bản phong phú')).toBeDefined()

    // Type "trich dan" -> only QuoteBlock matches
    fireEvent.change(searchInput, { target: { value: 'trich dan' } })

    expect(screen.getByText('Khối trích dẫn')).toBeDefined()
    expect(screen.queryByText('Hero Hai lối vào')).toBeNull()
    expect(screen.queryByText('Hero Ảnh biểu tượng')).toBeNull()
    expect(screen.queryByText('Văn bản phong phú')).toBeNull()
  })

  it('shows empty state when no blocks match query', () => {
    render(<LeftPanel />)

    const searchInput = screen.getByPlaceholderText(/Tìm khối/i)
    fireEvent.change(searchInput, { target: { value: 'nonexistent-block' } })

    expect(screen.getByText(/Không tìm thấy khối/i)).toBeDefined()
  })

  it('toggles category expansion when clicking category header', () => {
    render(<LeftPanel />)

    const introHeader = screen.getByRole('button', { name: /Mở đầu/i })
    expect(introHeader.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Hero Hai lối vào')).toBeDefined()

    // Collapse
    fireEvent.click(introHeader)
    expect(introHeader.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Hero Hai lối vào')).toBeNull()

    // Expand again
    fireEvent.click(introHeader)
    expect(introHeader.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Hero Hai lối vào')).toBeDefined()
  })

  it('gracefully handles localStorage failures without throwing', () => {
    // Simulate private window localStorage exception
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceeded / SecurityError')
    })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded / SecurityError')
    })

    expect(() => loadLeftPanelStorage()).not.toThrow()
    expect(() => saveLeftPanelStorage({ activeTab: 'blocks', collapsedCategories: [] })).not.toThrow()

    // Render should still work completely fine
    expect(() => render(<LeftPanel />)).not.toThrow()
    expect(screen.getByRole('tab', { name: /Khối/i })).toBeDefined()

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })
})

