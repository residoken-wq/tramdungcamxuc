import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { PuckEditorClient } from '@/app/(builder)/builder/[pageId]/PuckEditorClient'
import { campaignTemplate } from '@/puck/templates'
import type { Data } from '@puckeditor/core'

vi.mock('@/puck/actions', () => ({
  publishPageAction: vi.fn().mockResolvedValue({ success: true, status: 'published' }),
  saveDraftAction: vi.fn().mockResolvedValue({ success: true, status: 'draft' }),
  getVersionsAction: vi.fn().mockResolvedValue({ success: true, versions: [] }),
  restoreVersionAction: vi.fn().mockResolvedValue({ success: true }),
  duplicatePageAction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.matchMedia =
      window.matchMedia ||
      function () {
        return {
          matches: false,
          addListener: function () {},
          removeListener: function () {},
          addEventListener: function () {},
          removeEventListener: function () {},
          dispatchEvent: function () {
            return false
          },
        }
      }
    window.ResizeObserver =
      window.ResizeObserver ||
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
  }
})

describe('PuckEditorClient mounting stability (T1-04b)', () => {
  it('mounts cleanly with empty initialData without throwing and renders publish button', () => {
    const emptyData: Data = { content: [], root: { props: {} } }
    expect(() => {
      render(
        <PuckEditorClient
          initialData={emptyData}
          pageId="page-test-empty"
          pageTitle="Trang trống thử nghiệm"
          pageSlug="test-empty"
          initialStatus="draft"
        />,
      )
    }).not.toThrow()

    const publishBtn = screen.getByText('Xuất bản')
    expect(publishBtn).toBeDefined()
    expect(publishBtn.tagName.toLowerCase()).toBe('button')
    expect(screen.getByText('Bản nháp')).toBeDefined()
    expect(screen.getByText('Dùng mẫu...')).toBeDefined()
    expect(screen.getByText('Lịch sử')).toBeDefined()
  })

  it('mounts cleanly with initialData from campaign template without throwing', () => {
    expect(() => {
      render(
        <PuckEditorClient
          initialData={campaignTemplate}
          pageId="page-test-campaign"
          pageTitle="Trang chiến dịch"
          pageSlug="test-campaign"
          initialStatus="published"
        />,
      )
    }).not.toThrow()

    const publishBtn = screen.getByText('Xuất bản')
    expect(publishBtn).toBeDefined()
    expect(publishBtn.tagName.toLowerCase()).toBe('button')
    expect(screen.getByText('Đã xuất bản')).toBeDefined()
  })
})
