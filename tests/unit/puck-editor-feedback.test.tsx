import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { PuckEditorClient } from '@/app/(builder)/builder/[pageId]/PuckEditorClient'

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  save: vi.fn(),
  currentData: { content: [], root: { props: { title: 'Current editor data' } } },
}))
vi.mock('@/puck/actions', () => ({
  publishPageAction: mocks.publish,
  saveDraftAction: mocks.save,
  getVersionsAction: vi.fn().mockResolvedValue({ success: true, versions: [] }),
  restoreVersionAction: vi.fn().mockResolvedValue({ success: true }),
  duplicatePageAction: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('@/puck/config', () => ({ puckConfig: {}, getPuckConfig: () => ({}) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@puckeditor/core', () => ({
  usePuck: () => ({ appState: { data: mocks.currentData } }),
  Puck: ({ overrides }: { overrides: { headerActions: React.ComponentType } }) => {
    const Header = overrides.headerActions
    return <Header />
  },
}))

beforeEach(() => {
  mocks.publish.mockResolvedValue({ success: true, status: 'published' })
  mocks.save.mockResolvedValue({ success: true, status: 'draft' })
})

test('success feedback survives publication status changes and parent rerenders', async () => {
  const props = {
    initialData: { content: [], root: {} },
    pageId: '123',
    pageTitle: 'Test page',
    pageSlug: 'test-page',
    initialStatus: 'draft',
  }
  const { rerender } = render(<PuckEditorClient {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }))
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('Đã xuất bản thành công'),
  )
  expect(screen.getByText('Đã xuất bản')).toBeTruthy()
  expect(mocks.publish).toHaveBeenCalledWith('123', mocks.currentData)
  rerender(<PuckEditorClient {...props} pageTitle="Renamed page" />)
  expect(screen.getByRole('status').textContent).toContain('Đã xuất bản thành công')
  fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Đã lưu bản nháp'))
  expect(screen.getByText('Bản nháp')).toBeTruthy()
  expect(mocks.save).toHaveBeenCalledWith('123', mocks.currentData)
})

test('publish button meets WCAG AA contrast for small text per Q13 (deep-navy background with white text)', () => {
  const props = {
    initialData: { content: [], root: {} },
    pageId: '123',
    pageTitle: 'Test page',
    pageSlug: 'test-page',
    initialStatus: 'draft',
  }
  render(<PuckEditorClient {...props} />)
  const publishButton = screen.getByRole('button', { name: 'Xuất bản' })
  expect(publishButton.className).toContain('bg-deep-navy')
  expect(publishButton.className).toContain('text-white')
  expect(publishButton.className).not.toContain('bg-accent-pink')
})
