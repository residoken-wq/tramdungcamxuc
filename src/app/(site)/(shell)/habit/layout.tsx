import React from 'react'
import { TrialBanner } from '@/components/habit/TrialBanner'

export default function HabitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrialBanner />
      {children}
    </>
  )
}
