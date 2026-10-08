'use client'

import React from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'

export const HABIT_QUIZ_PATH = '/habit/chan-doan'

export interface QuizCTAProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  buttonText?: string
  bgColor?: string
  padding?: 'sm' | 'md' | 'lg'
  puck?: { isEditing?: boolean }
}

export function QuizCTA({
  seriesLabel = '[MẪU] Thấu hiểu bản thân',
  titleLine1 = '[MẪU] 5 PHÚT CHẨN ĐOÁN',
  titleLine2 = '[MẪU] ĐIỂM NGHẼN THÓI QUEN',
  emotionLine = '[MẪU] Nhận diện nguyên nhân gốc rễ và bức tranh cảm xúc đang chi phối hành động của bạn.',
  buttonText = 'Bắt đầu chẩn đoán 5 phút',
  bgColor = 'warm-ivory',
  padding = 'md',
}: QuizCTAProps) {
  const paddingClasses = {
    sm: 'py-8 px-4',
    md: 'py-14 px-4 sm:px-6',
    lg: 'py-20 px-4 sm:px-8',
  }[padding]

  return (
    <section className={`w-full bg-${bgColor} ${paddingClasses}`}>
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-8">
        <SectionHeader
          seriesLabel={seriesLabel}
          titleLine1={titleLine1}
          titleLine2={titleLine2}
          emotionLine={emotionLine}
          align="center"
        />

        <div className="pt-2">
          <Button
            href={HABIT_QUIZ_PATH}
            variant="primary"
            size="lg"
            className="px-8 py-3.5 text-base shadow-md hover:shadow-lg transition-all"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </section>
  )
}
