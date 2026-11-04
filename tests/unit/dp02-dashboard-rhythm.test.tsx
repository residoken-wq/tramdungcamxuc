// @vitest-environment happy-dom
import React from 'react'
import { describe, expect, it, vi as vitest } from 'vitest'
import { render, screen } from '@testing-library/react'

vitest.mock('@/lib/habit/tracker-actions', () => ({
  checkInDay: vitest.fn(),
  deleteCheckInDay: vitest.fn(),
}))
vitest.mock('@/lib/habit/reflection-actions', () => ({ saveStationReflection: vitest.fn() }))
vitest.mock('@/lib/habit/my-data-actions', () => ({
  exportBackup: vitest.fn(),
  exportCsv: vitest.fn(),
  restoreBackup: vitest.fn(),
  restartJourney: vitest.fn(),
}))
vitest.mock('server-only', () => ({}))
vitest.mock('canvas-confetti', () => ({ default: vitest.fn() }))
vitest.mock('@/components/habit/CertificateShareButtons', () => ({
  CertificateShareButtons: () => null,
}))
vitest.mock('@/components/habit/CertificatePublicToggle', () => ({
  CertificatePublicToggle: () => null,
}))

import { Dashboard28Days } from '@/components/habit/zip/Result/Dashboard28Days'
import { vi } from '@/lib/i18n/vi'

// QA DP-02c: plans store rhythm days as weekday keys ("mon"…). 04/11/2026 is a Wednesday.
describe('Dashboard28Days rhythm days', () => {
  it('treats a Wednesday in a Mon–Fri rhythm as a voting day, not a rest day', () => {
    render(
      <Dashboard28Days
        planId={1}
        currentDay={1}
        initialCheckins={[]}
        startDate="2026-11-04T00:00:00.000Z"
        selectedDays={['mon', 'tue', 'wed', 'thu', 'fri']}
      />,
    )
    expect(screen.getByText(vi.dp01.todayVoteNotice(1))).toBeTruthy()
    expect(screen.queryByText(vi.dp01.todayRestNotice(1))).toBeNull()
  })

  it('treats a Sunday outside a Mon–Fri rhythm as a rest day', () => {
    render(
      <Dashboard28Days
        planId={1}
        currentDay={1}
        initialCheckins={[]}
        startDate="2026-11-08T00:00:00.000Z"
        selectedDays={['mon', 'tue', 'wed', 'thu', 'fri']}
      />,
    )
    expect(screen.getByText(vi.dp01.todayRestNotice(1))).toBeTruthy()
  })
})
