'use client'

import React from 'react'
import { JourneySteps } from '@/components/site/JourneySteps'
import { JourneyStep } from '@/components/site/JourneyStep'
import { HanaStory } from '@/components/site/HanaStory'
import { blockStyleCss } from '@/puck/style/style-css'

const STEPS = [
  ['Pause', '[MẪU] Dừng lại & Quan sát'],
  ['Feel', '[MẪU] Kết nối cảm xúc'],
  ['Name', '[MẪU] Gọi tên vấn đề'],
  ['Choose', '[MẪU] Lựa chọn chủ đích'],
  ['Practice', '[MẪU] Thực hành bền bỉ'],
] as const

function steps(highlight: number) {
  return STEPS.map(([name, subname], i) => (
    <JourneyStep
      key={name}
      index={i}
      name={name}
      subname={subname}
      description="[MẪU] Mô tả ngắn của bước."
      highlight={i === highlight}
    />
  ))
}

/** PK-17 demos (QA PK-17c): circles journey, Hana spotlight, "Không khung" card frame. */
export function Pk17Demo() {
  return (
    <div className="space-y-16">
      <div id="demo-pk17-circles">
        <JourneySteps
          seriesLabel="[MẪU] PHƯƠNG PHÁP"
          titleLine1="[MẪU] HÀNH TRÌNH CHUYỂN HÓA"
          variant="circles"
          steps={steps(4)}
        />
      </div>

      <div id="demo-pk17-spotlight">
        <HanaStory
          layout="spotlight"
          tone="dark"
          imagePosition="right"
          seriesLabel="[MẪU] NGƯỜI SÁNG LẬP"
          titleLine1="[MẪU] COACH"
          jobTitle="[MẪU] GROWTH MIRROR PARTNER"
          quoteLine={'"[MẪU] Câu trích dẫn có sẵn ngoặc kép."'}
          storyContent="[MẪU] Sứ mệnh của Trạm."
          chips={[{ text: '[MẪU] Dịu dàng' }]}
          imageUrl="/brand/sample-cover.svg"
          imageAlt="[MẪU] Ảnh minh họa"
        />
      </div>

      <div id="demo-pk17-frame-none" data-eb-id="demo-pk17-frame-none">
        <style>{blockStyleCss('demo-pk17-frame-none', { cardFrame: 'none' })}</style>
        <JourneySteps titleLine1="[MẪU] KHÔNG KHUNG" variant="cards" steps={steps(1)} />
      </div>
    </div>
  )
}
