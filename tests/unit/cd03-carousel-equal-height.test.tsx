import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { IconCard } from '@/components/site/IconCard'

describe('CD-03: Equal height cards in carousel and grid', () => {
  describe('equalHeight: false (default)', () => {
    it('grid columns row classes remain identical to legacy string (no equalHeight rules)', () => {
      const { container } = render(
        <IconCardGrid
          titleLine1="Tiêu đề mẫu"
          columns={3}
          equalHeight={false}
          items={[{ title: 'Thẻ 1', text: 'Nội dung 1' }]}
        />,
      )

      const row = container.querySelector('.grid')
      expect(row).toBeTruthy()
      expect(row?.className).toBe(
        'mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl gap-6 sm:gap-8 [counter-reset:card-counter]',
      )
      expect(row?.className).not.toContain('self-stretch')
      expect(row?.className).not.toContain('flex-1')
      expect(row?.className).not.toContain('h-full')
    })

    it('carousel row classes remain identical to legacy string when equalHeight is false or undefined', () => {
      const { container } = render(
        <IconCardGrid
          titleLine1="Tiêu đề mẫu"
          columns="carousel"
          items={[{ title: 'Thẻ 1', text: 'Nội dung 1' }]}
        />,
      )

      const row = container.querySelector('.flex.w-max')
      expect(row).toBeTruthy()
      expect(row?.className).toBe(
        'flex w-max gap-6 sm:gap-8 [counter-reset:card-counter] [&>*]:w-[80vw] [&>*]:max-w-[320px] [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:w-[340px]',
      )
      expect(row?.className).not.toContain('self-stretch')
      expect(row?.className).not.toContain('flex-1')
      expect(row?.className).not.toContain('h-full')
    })
  })

  describe('equalHeight: true', () => {
    it('applies rules for both direct cards and wrapped cards in carousel', () => {
      const { container } = render(
        <IconCardGrid
          titleLine1="Tiêu đề mẫu"
          columns="carousel"
          equalHeight={true}
          items={[{ title: 'Thẻ 1', text: 'Nội dung 1' }]}
        />,
      )

      const row = container.querySelector('.flex.w-max')
      expect(row).toBeTruthy()
      const cls = row?.className || ''

      // Direct card rule: stretches without h-full so flex auto-height does not collapse
      expect(cls).toContain('[&>[data-eb-card]]:self-stretch')
      // Wrapped card wrapper rule: becomes flex column
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex')
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex-col')
      // Wrapped card inner card rule: expands to fill wrapper height
      expect(cls).toContain('[&>*>[data-eb-card]]:flex-1')

      // Buggy descendant selector h-full is NOT present
      expect(cls).not.toContain('[&_[data-eb-card]]:h-full')
    })

    it('applies rules for both direct cards and wrapped cards in standard grid', () => {
      const { container } = render(
        <IconCardGrid
          titleLine1="Tiêu đề mẫu"
          columns={3}
          equalHeight={true}
          items={[{ title: 'Thẻ 1', text: 'Nội dung 1' }]}
        />,
      )

      const row = container.querySelector('.grid')
      expect(row).toBeTruthy()
      const cls = row?.className || ''

      expect(cls).toContain('[&>[data-eb-card]]:self-stretch')
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex')
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex-col')
      expect(cls).toContain('[&>*>[data-eb-card]]:flex-1')
      expect(cls).not.toContain('[&_[data-eb-card]]:h-full')
    })

    it('renders mixed direct card and wrapped card within carousel track', () => {
      const { container } = render(
        <IconCardGrid
          titleLine1="Chọn không gian của bạn"
          columns="carousel"
          equalHeight={true}
          cards={
            <>
              {/* Wrapped card (with _style wrapper) */}
              <div data-eb-id="wrapped-space-card">
                <IconCard title="Me Time" linkText="Khám phá →" linkHref="#me-time" />
              </div>
              {/* Direct card (no wrapper) */}
              <IconCard title="Không gian mới" highlight="coming-soon" />
            </>
          }
        />,
      )

      const row = container.querySelector('.flex.w-max')
      expect(row).toBeTruthy()

      // Wrapped card structure
      const wrapper = container.querySelector('[data-eb-id="wrapped-space-card"]')
      expect(wrapper).toBeTruthy()
      expect(wrapper?.hasAttribute('data-eb-card')).toBe(false)
      const innerCard = wrapper?.querySelector('[data-eb-card]')
      expect(innerCard).toBeTruthy()

      // Direct card structure
      const directCards = row?.querySelectorAll(':scope > [data-eb-card]')
      expect(directCards?.length).toBe(1)
      expect(directCards?.[0].textContent).toContain('Không gian mới')
    })
  })
})
