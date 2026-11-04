'use client'

import React from 'react'
import { Flag } from 'lucide-react'

interface TimelineProgressProps {
  currentDay?: number
  totalCompleted?: number
  startDateLabel?: string
  endDateLabel?: string
}

export function TimelineProgress({
  totalCompleted = 0,
  startDateLabel = 'Bắt đầu 10/10',
  endDateLabel = 'Về đích 06/11',
}: TimelineProgressProps) {
  const milestones = [
    { id: 1, label: 'Khởi hành', threshold: 7 },
    { id: 2, label: 'Tạo đà', threshold: 14 },
    { id: 3, label: 'Vượt dốc', threshold: 21 },
    { id: 4, label: 'Về đích', threshold: 28 },
  ]

  return (
    <div className="w-full bg-white rounded-2xl border border-lavender-mist/80 p-4 sm:p-5 shadow-soft-md mb-6">
      <div className="px-1 sm:px-4">
        {/* Row chứa các mốc + đường nối */}
        <div className="flex items-start">
          {milestones.map((m, idx) => {
            const isPassed = totalCompleted >= m.threshold
            const isCurrent =
              totalCompleted < m.threshold &&
              (idx === 0 || totalCompleted >= milestones[idx - 1].threshold)

            let circleClass =
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all '
            let textColor = ''

            if (isPassed) {
              circleClass += 'border-2 border-bright-magenta bg-bright-magenta'
              textColor = 'text-white'
            } else if (isCurrent) {
              circleClass +=
                'border-2 border-accent-pink bg-white ring-2 ring-accent-pink/20'
              textColor = 'text-accent-pink'
            } else {
              circleClass += 'border border-deep-navy/20 bg-white'
              textColor = 'text-deep-navy/40'
            }

            return (
              <React.Fragment key={m.id}>
                {/* Mốc: vòng tròn + label */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={circleClass}>
                    {m.id === 4 ? (
                      <Flag
                        className={`w-3 h-3 ${isPassed ? 'text-white' : isCurrent ? 'text-accent-pink' : 'text-deep-navy/40'}`}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <span className={textColor}>{m.id}</span>
                    )}
                  </div>
                  <span
                    className={`font-ui text-[10px] sm:text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                      isPassed || isCurrent ? 'text-deep-navy' : 'text-deep-navy/40'
                    }`}
                  >
                    {m.label}
                  </span>
                </div>

                {/* Đường nối (không vẽ sau mốc cuối) */}
                {idx < milestones.length - 1 && (
                  <div className="h-[2px] bg-deep-navy/10 flex-1 mx-2 relative top-3" />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Góc dưới trái và góc dưới phải */}
        <div className="flex justify-between items-center text-[11px] font-ui text-deep-navy/60 pt-3">
          <span>{startDateLabel}</span>
          <span>{endDateLabel}</span>
        </div>
      </div>
    </div>
  )
}
