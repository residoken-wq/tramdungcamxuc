import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// QA PK-27b: the builder (no server resolve) asks the server action for the same cards.
const previewMock = vi.fn()
vi.mock('@/puck/lead-magnet-actions', () => ({
  previewLeadMagnetsAction: (...args: unknown[]) => previewMock(...args),
}))

import { LeadMagnetCarousel } from '@/components/site/LeadMagnetCarousel'

describe('QA PK-27b: LeadMagnetCarousel builder preview + list layout', () => {
  it('in the builder, loads cards through the preview action (manual ids passed on)', async () => {
    previewMock.mockResolvedValueOnce([
      {
        id: 1,
        name: '[MẪU] Công cụ chẩn đoán',
        slug: 'cong-cu',
        href: '/habit/chan-doan',
        isExternal: false,
        ctaLabel: '[MẪU] Nhận công cụ miễn phí',
      },
    ])
    render(
      <LeadMagnetCarousel
        display="list"
        titleLine1="[MẪU] Quà tặng"
        mode="manual"
        manualProducts={[{ productId: 1 }, { productId: 3 }]}
        puck={{ isEditing: true }}
      />,
    )
    expect(await screen.findByText('[MẪU] Công cụ chẩn đoán')).toBeTruthy()
    expect(previewMock).toHaveBeenCalledWith('manual', ['1', '3'])
    const link = screen.getByRole('link', { name: '[MẪU] Nhận công cụ miễn phí' })
    expect(link.getAttribute('href')).toBe('/habit/chan-doan')
    // link card: filled button; vertical list (not a 3-column grid)
    expect(link.className).toContain('bg-bright-magenta')
    expect(link.closest('[data-eb-card]')?.parentElement?.className).toContain('flex-col')
  })

  it('does not call the preview action on the public page (server-resolved items)', () => {
    previewMock.mockClear()
    render(
      <LeadMagnetCarousel
        display="list"
        titleLine1="[MẪU] Quà tặng"
        _resolved={{
          items: [{ id: 2, name: '[MẪU] Ebook', slug: 'ebook', href: '/tai-nguyen/ebook' }],
        }}
      />,
    )
    expect(previewMock).not.toHaveBeenCalled()
    const link = screen.getByRole('link', { name: 'Nhận tài liệu' })
    expect(link.className).toContain('border-deep-navy')
  })
})
