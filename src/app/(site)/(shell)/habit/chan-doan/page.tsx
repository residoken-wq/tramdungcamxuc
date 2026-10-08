import React from 'react'
import type { Metadata } from 'next'
import { getDiagnosticQuestions } from '@/lib/diagnostic.server'
import { DiagnosticQuizClient } from '@/components/site/diagnostic/DiagnosticQuizClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Chẩn đoán thói quen 5 phút',
  description:
    'Bài trắc nghiệm chẩn đoán vòng lặp thói quen 5 phút giúp bạn nhận diện chính xác điểm nghẽn tại Cue, Craving, Response hay Reward để bứt phá bền bỉ.',
  openGraph: {
    title: 'Chẩn đoán thói quen 5 phút | Trạm Dừng Cảm Xúc',
    description:
      'Nhận diện điểm nghẽn trong vòng lặp thói quen của bạn và nhận cẩm nang gỡ rối cá nhân hóa từ Hana Lương.',
  },
}

export default async function DiagnosticPage() {
  const questions = await getDiagnosticQuestions()

  return <DiagnosticQuizClient questions={questions} />
}
