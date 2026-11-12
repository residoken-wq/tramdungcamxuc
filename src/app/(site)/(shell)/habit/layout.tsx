import React from 'react'
import { TrialBanner } from '@/components/habit/TrialBanner'
import { vi } from '@/lib/i18n/vi'

export default function HabitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrialBanner buyButtonLabel={vi.dp01.vipMemberButton} />
      {children}
    </>
  )
}
