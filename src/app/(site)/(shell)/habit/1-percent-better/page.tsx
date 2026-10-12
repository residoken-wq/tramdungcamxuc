import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHabitProduct } from '@/lib/habit.server'
import { HabitOfferClient } from '@/components/habit/HabitOfferClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Habit Hack – 1% Better Mỗi Ngày | Habit Tracker số',
  description:
    'Bộ công cụ và khóa học Habit Hack 1% Better: bài giảng video, kỹ thuật thực chiến, tracker 21 ngày với 10 cảm xúc. Dùng thử miễn phí 21 ngày.',
  openGraph: {
    title: 'Habit Hack – 1% Better Mỗi Ngày | Trạm Dừng Cảm Xúc',
    description:
      'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng. Trải nghiệm 21 ngày dùng thử miễn phí cùng Hana Lương.',
  },
}

export default async function HabitOfferPage() {
  const product = await getHabitProduct()

  if (!product) {
    notFound()
  }

  return <HabitOfferClient product={product} />
}
