import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CarouselTrack } from '@/components/ui/CarouselTrack'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { PhotoGallery } from '@/components/site/PhotoGallery'
import { ImageText } from '@/components/site/ImageText'
import { IconCard } from '@/components/site/IconCard'
import { Columns } from '@/components/site/Columns'
import { blockStyleCss } from '@/puck/style/style-css'
import { sanitizeBlockStyle } from '@/puck/style/style-schema'
import { DEFAULT_DESIGN_SYSTEM } from '@/lib/design/design-system'

describe('CD-04 §1: Mũi tên trượt nằm 2 bên (sides)', () => {
  it('CarouselTrack default (top): renders top navigation and no side buttons', () => {
    const { container } = render(
      <CarouselTrack
        ariaLabel="Danh sách thử nghiệm"
        prevLabel="Thẻ trước"
        nextLabel="Thẻ tiếp theo"
      >
        <div>Item 1</div>
      </CarouselTrack>,
    )

    // Top nav exists
    const topNav = container.querySelector('.mb-4.hidden.justify-end')
    expect(topNav).toBeTruthy()
    // Side buttons with absolute positioning do not exist
    const sideButtons = container.querySelectorAll('button.absolute')
    expect(sideButtons.length).toBe(0)
  })

  it('CarouselTrack sides: does not render top nav, renders side buttons with aria-label', () => {
    const { container } = render(
      <CarouselTrack
        ariaLabel="Danh sách thử nghiệm"
        prevLabel="Thẻ trước"
        nextLabel="Thẻ tiếp theo"
        arrowPosition="sides"
      >
        <div>Item 1</div>
      </CarouselTrack>,
    )

    // Top nav is hidden/not rendered
    const topNav = container.querySelector('.mb-4.hidden.justify-end')
    expect(topNav).toBeNull()

    // Side buttons exist with aria-labels
    const prevBtn = container.querySelector('button[aria-label="Thẻ trước"]')
    const nextBtn = container.querySelector('button[aria-label="Thẻ tiếp theo"]')
    expect(prevBtn).toBeTruthy()
    expect(nextBtn).toBeTruthy()
    expect(prevBtn?.className).toContain('absolute')
    expect(prevBtn?.className).toContain('-left-')
    expect(nextBtn?.className).toContain('absolute')
    expect(nextBtn?.className).toContain('-right-')
  })

  it('PhotoGallery with <= 4 items does not render navigation arrows even with arrowPosition="sides"', () => {
    const { container } = render(
      <PhotoGallery
        titleLine1="Khoảnh khắc"
        layout="mosaic"
        arrowPosition="sides"
        items={[
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 1' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 2' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 3' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 4' },
        ]}
      />,
    )

    // With 4 items, hasCarousel is false -> no nav buttons
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(0)
  })

  it('PhotoGallery with > 4 items renders side navigation buttons with aria-label when arrowPosition="sides"', () => {
    const { container } = render(
      <PhotoGallery
        titleLine1="Khoảnh khắc"
        layout="mosaic"
        arrowPosition="sides"
        items={[
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 1' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 2' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 3' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 4' },
          { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 5' },
        ]}
      />,
    )

    const prevBtn = container.querySelector('button.absolute[aria-label="Nhóm ảnh trước"]')
    const nextBtn = container.querySelector('button.absolute[aria-label="Nhóm ảnh tiếp theo"]')
    expect(prevBtn).toBeTruthy()
    expect(nextBtn).toBeTruthy()
  })
})

describe('CD-04 §2: Ảnh Yoga Buddy tràn hết chiều cao section (imageBleedFullHeight)', () => {
  it('default (imageBleedFullHeight: false): section keeps vertical padding and items-center', () => {
    const { container } = render(
      <ImageText
        titleLine1="Yoga Buddy"
        content="Nội dung thử nghiệm"
        imageBleed={true}
        imageBleedFullHeight={false}
        imageUrl="/brand/sample-cover.svg"
        imageAlt="Ảnh mẫu"
        padding="lg"
      />,
    )

    const section = container.querySelector('section')
    expect(section?.className).toContain('py-20')
    expect(section?.className).not.toContain('p-0')

    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('items-center')
    expect(grid?.className).not.toContain('items-stretch')
  })

  it('when enabled (imageBleedFullHeight: true): section has p-0 (no vertical padding) and items-stretch', () => {
    const { container } = render(
      <ImageText
        titleLine1="Yoga Buddy"
        content="Nội dung thử nghiệm"
        imageBleed={true}
        imageBleedFullHeight={true}
        imageUrl="/brand/sample-cover.svg"
        imageAlt="Ảnh mẫu"
        padding="lg"
      />,
    )

    const section = container.querySelector('section')
    expect(section?.className).toContain('p-0')
    expect(section?.className).not.toContain('py-20')

    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('items-stretch')
  })
})

describe('CD-04 §3: Vạch màu đỉnh thẻ dạng thẳng (cardAccentShape: flat)', () => {
  it('default (cardAccentShape: rounded or omitted): generates standard CSS without border-radius override', () => {
    const css = blockStyleCss('block-test', { cardAccent: 'bright-magenta' })
    expect(css).toContain('border-top-width:6px')
    expect(css).not.toContain('border-top-left-radius')
  })

  it('when cardAccentShape is flat: generates CSS removing top border radii', () => {
    const cssSingle = blockStyleCss('card-test', {
      cardAccent: 'accent-pink',
      cardAccentShape: 'flat',
    })
    expect(cssSingle).toContain('border-top-left-radius:0;border-top-right-radius:0')

    const cssCycle = blockStyleCss('grid-test', {
      cardAccent: 'cycle',
      cardAccentShape: 'flat',
    })
    expect(cssCycle).toContain('border-top-left-radius:0;border-top-right-radius:0')
  })

  it('sanitizeBlockStyle preserves flat and strips invalid values or default rounded', () => {
    const sanitizedFlat = sanitizeBlockStyle(
      { cardAccentShape: 'flat' },
      DEFAULT_DESIGN_SYSTEM,
    )
    expect(sanitizedFlat?.cardAccentShape).toBe('flat')

    const sanitizedRounded = sanitizeBlockStyle(
      { cardAccentShape: 'rounded' },
      DEFAULT_DESIGN_SYSTEM,
    )
    expect(sanitizedRounded?.cardAccentShape).toBeUndefined()

    const sanitizedInvalid = sanitizeBlockStyle(
      { cardAccentShape: 'invalid-shape' as any },
      DEFAULT_DESIGN_SYSTEM,
    )
    expect(sanitizedInvalid?.cardAccentShape).toBeUndefined()
  })
})

describe('CD-04 §4: Giờ ở slide 51 màu xám (eyebrowColor: muted)', () => {
  it('default (eyebrowColor: accent): eyebrow has text-bright-magenta on light card', () => {
    const { container } = render(
      <IconCard title="We Time" eyebrow="5:00 - 5:10" eyebrowColor="accent" />,
    )

    const eyebrow = container.querySelector('.tracking-wider')
    expect(eyebrow?.className).toContain('text-bright-magenta')
    expect(eyebrow?.className).not.toContain('text-deep-navy/70')
  })

  it('when eyebrowColor is muted: eyebrow has text-deep-navy/70', () => {
    const { container } = render(
      <IconCard title="We Time" eyebrow="5:00 - 5:10" eyebrowColor="muted" />,
    )

    const eyebrow = container.querySelector('.tracking-wider')
    expect(eyebrow?.className).toContain('text-deep-navy/70')
    expect(eyebrow?.className).not.toContain('text-bright-magenta')
  })
})

describe('CD-04 §5: Hai thẻ slide 55 cao bằng nhau (Columns equalHeight)', () => {
  it('default (equalHeight: false): grid has items-start and columns do not have equalHeight classes', () => {
    const { container } = render(
      <Columns
        numColumns="2"
        equalHeight={false}
        col1={<div>Cột 1</div>}
        col2={<div>Cột 2</div>}
      />,
    )

    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('items-start')
    expect(grid?.className).not.toContain('items-stretch')
    expect(grid?.innerHTML).not.toContain('self-stretch')
  })

  it('when equalHeight is true: grid has items-stretch and columns stretch without using h-full on direct card', () => {
    const { container } = render(
      <Columns numColumns="2" equalHeight={true} col1={<div>Cột 1</div>} col2={<div>Cột 2</div>} />,
    )

    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('items-stretch')
    expect(grid?.className).not.toContain('items-start')

    const cols = container.querySelectorAll('.grid > div')
    expect(cols.length).toBe(2)
    for (const col of cols) {
      const cls = col.className
      expect(cls).toContain('[&>[data-eb-card]]:self-stretch')
      expect(cls).toContain('[&>[data-eb-card]]:flex-1')
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex')
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex-col')
      expect(cls).toContain('[&>*:not([data-eb-card])]:flex-1')
      expect(cls).toContain('[&>*>[data-eb-card]]:flex-1')

      // Must NOT use buggy h-full on direct card
      expect(cls).not.toContain('[&>[data-eb-card]]:h-full')
    }
  })
})
