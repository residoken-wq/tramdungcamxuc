import React from 'react'
import { afterEach, describe, expect, it, vi as vitest } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

// T2-13: admin UI for an expired (failed) order. Replaces the e2e, which needs a DB
// time-travel (an order older than 24 h) that the Playwright runner cannot do.
const authState: { user: { role: string } | null } = { user: { role: 'owner' } }
const docState: { id: number; data: { paymentStatus: string } } = {
  id: 1,
  data: { paymentStatus: 'failed' },
}

vitest.mock('@payloadcms/ui', () => ({
  useAuth: () => authState,
  useDocumentInfo: () => docState,
}))
vitest.mock('@/lib/payments/actions', () => ({
  confirmManualPaymentAdminAction: vitest.fn(),
  cancelOrderAdminAction: vitest.fn(),
  getOrderPaymentLinkAction: vitest.fn(() => new Promise(() => {})),
}))

import { OrderActions } from '@/components/admin/OrderActions'
import { vi } from '@/lib/i18n/vi'

const warning = vi.payment.ui.adminActions.expiredOrderWarning

afterEach(() => {
  cleanup()
  authState.user = { role: 'owner' }
  docState.data = { paymentStatus: 'failed' }
})

describe('OrderActions – expired order (T2-13)', () => {
  it('owner sees the warning, a confirm button and no cancel button', () => {
    render(<OrderActions />)
    expect(screen.getByTestId('order-expired-warning').textContent).toContain(warning)
    expect(screen.getByTestId('order-confirm-button')).toBeTruthy()
    expect(screen.queryByTestId('order-cancel-button')).toBeNull()
  })

  it('the confirm dialog repeats the warning', () => {
    render(<OrderActions />)
    fireEvent.click(screen.getByTestId('order-confirm-button'))
    expect(screen.getAllByText((t) => t.includes(warning)).length).toBeGreaterThan(1)
  })

  it('editor sees nothing', () => {
    authState.user = { role: 'editor' }
    const { container } = render(<OrderActions />)
    expect(container.innerHTML).toBe('')
  })

  it('pending order keeps both buttons and shows no expiry warning', () => {
    docState.data = { paymentStatus: 'pending' }
    render(<OrderActions />)
    expect(screen.queryByTestId('order-expired-warning')).toBeNull()
    expect(screen.getByTestId('order-confirm-button')).toBeTruthy()
    expect(screen.getByTestId('order-cancel-button')).toBeTruthy()
  })
})
