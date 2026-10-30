import { describe, expect, it } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import type { Data } from '@puckeditor/core'
import { normalizePuckData } from '@/puck/migrations'
import { CHILD_BLOCK_TYPES } from '@/puck/constants'
import { puckConfig } from '@/puck/config'
import { HeroImage } from '@/components/site/HeroImage'

function data(content: unknown[]): Data {
  return { root: { props: {} }, content, zones: {} } as unknown as Data
}

describe('PK-09: VisionMission v1 -> v2 (cards slot of VisionCard)', () => {
  const v1 = {
    type: 'VisionMission',
    props: {
      id: 'vm',
      version: 1,
      titleLine1: 'Tầm nhìn',
      visionTitle: 'TẦM NHÌN',
      visionContent: 'Đoạn 1\n\nĐoạn 2',
      visionIcon: 'star',
      missionTitle: 'SỨ MỆNH',
      missionContent: 'Nội dung sứ mệnh',
      bgColor: 'deep-navy',
    },
  }

  it('turns vision*/mission* into two VisionCard children, keeping text and icons', () => {
    const out = normalizePuckData(data([v1]))
    const props = out.content[0].props as Record<string, unknown>
    expect(props.version).toBe(2)
    expect(Object.keys(props).some((k) => /^(vision|mission)/.test(k))).toBe(false)
    const cards = props.cards as Array<{ type: string; props: Record<string, unknown> }>
    expect(cards.map((c) => c.type)).toEqual(['VisionCard', 'VisionCard'])
    expect(cards[0].props).toMatchObject({
      id: 'vm-card-0',
      icon: 'star',
      title: 'TẦM NHÌN',
      content: 'Đoạn 1\n\nĐoạn 2',
    })
    expect(cards[1].props).toMatchObject({ id: 'vm-card-1', icon: 'heart', title: 'SỨ MỆNH' })
    expect(normalizePuckData(out)).toEqual(out)
  })

  it('VisionCard is a child-only block allowed only in the cards slot', () => {
    expect(CHILD_BLOCK_TYPES).toContain('VisionCard')
    expect(puckConfig.components.VisionCard.permissions?.insert).toBe(false)
    const slot = puckConfig.components.VisionMission.fields?.cards as { allow?: string[] }
    expect(slot.allow).toEqual(['VisionCard'])
  })
})

describe('PK-09: HeroImage stats format presets', () => {
  const stats = [{ value: '500+', label: 'Giờ khai vấn' }]

  it('applies a chosen stat colour that passes contrast on the section background', () => {
    const { getByText } = render(
      <HeroImage titleLine1="A" titleLine2="B" stats={stats} statValueColor="bright-magenta" />,
    )
    expect(getByText('500+').className).toContain('text-bright-magenta')
  })

  it('falls back to automatic when the colour fails contrast on the current background', () => {
    const { getByText } = render(
      <HeroImage
        titleLine1="A"
        titleLine2="B"
        stats={stats}
        bgColor="deep-navy"
        statLabelColor="bright-magenta"
      />,
    )
    const label = getByText('Giờ khai vấn').className
    expect(label).not.toContain('text-bright-magenta')
    expect(label).toContain('group-data-[bg=deep-navy]/heroimg:text-white/80')
  })
})

describe('PK-09: VisionCard renders inline-edited (React element) props', () => {
  it('renders an element content prop without string operations', () => {
    const block = puckConfig.components.VisionCard
    const { getByText } = render(
      block.render({
        ...block.defaultProps,
        title: <span>Tiêu đề sửa trực tiếp</span>,
        content: <span>Nội dung sửa trực tiếp</span>,
        puck: {},
      } as never),
    )
    expect(getByText('Tiêu đề sửa trực tiếp')).toBeDefined()
    expect(getByText('Nội dung sửa trực tiếp')).toBeDefined()
  })
})
