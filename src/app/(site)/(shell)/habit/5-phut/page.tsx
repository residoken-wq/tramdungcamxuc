import React from 'react'
import type { Metadata } from 'next'
import { getTechniques } from '@/lib/habit.server'
import { HabitLoopWizard } from '@/components/habit/HabitLoopWizard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Habit Loop 5 phút – Thiết kế vòng lặp thói quen',
  description:
    'Chỉ 5 phút để gọi tên, gỡ rối và thiết kế vòng lặp thói quen bền vững với 11 kỹ thuật Atomic Habits cá nhân hóa.',
  openGraph: {
    title: 'Habit Loop 5 phút | Trạm Dừng Cảm Xúc',
    description:
      'Chỉ 5 phút để gọi tên, gỡ rối và thiết kế vòng lặp thói quen bền vững cùng Hana Lương.',
  },
}

export default async function HabitLoopPage() {
  const techniques = await getTechniques()

  return <HabitLoopWizard techniques={techniques} />
}
