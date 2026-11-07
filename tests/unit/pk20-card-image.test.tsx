import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { blockStyleCss } from '@/puck/style/style-css'
import { sanitizeBlockStyle } from '@/puck/style/style-schema'
import { DEFAULT_DESIGN_SYSTEM } from '@/lib/design/design-system'
import { IconCard } from '@/components/site/IconCard'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { BrandImage } from '@/components/ui/BrandImage'
import { ImageText } from '@/components/site/ImageText'

describe('PK-20: cardAccent and glass cardFrame CSS', () => {
  it('generates border-top 6px rule for single color cardAccent', () => {
    const css = blockStyleCss('block-1', { cardAccent: 'bright-magenta' })
    expect(css).toContain(
      '[data-eb-id="block-1"] [data-eb-card]{border-top-width:6px;border-top-style:solid;border-top-color:rgb(var(--color-bright-magenta-rgb))}',
    )
    // QA PK-20c: no overflow:hidden (it clipped badges sitting above a card).
    expect(css).not.toContain('overflow:hidden')
  })

  it('generates cycling nth-child border-top 6px rules for cycle cardAccent', () => {
    const css = blockStyleCss('block-2', { cardAccent: 'cycle' })
    const sel = '[data-eb-id="block-2"]'
    expect(css).toContain(
      `${sel} [data-eb-card]:nth-child(3n+1),${sel} :nth-child(3n+1) > [data-eb-card]:only-child{border-top-width:6px;border-top-style:solid;border-top-color:rgb(var(--color-bright-magenta-rgb))}`,
    )
    expect(css).toContain('border-top-color:rgb(var(--color-accent-pink-rgb))')
    expect(css).toContain('border-top-color:rgb(var(--color-deep-navy-rgb))')
    // QA PK-20c: an ancestor's position must never colour every card (all cards came out navy).
    expect(css).not.toMatch(/:nth-child\([^)]*\) > \[data-eb-card\](?!:only-child)/)
  })

  it('generates glass cardFrame with backdrop-blur, fallback and dark theme support', () => {
    const css = blockStyleCss('block-glass', { cardFrame: 'glass' })
    expect(css).toContain('backdrop-filter:blur(12px)')
    expect(css).toContain('background:rgb(255 255 255/.7)')
    expect(css).toContain('border-color:rgb(255 255 255/.6)')
    expect(css).toContain('@supports not (backdrop-filter:blur(12px))')
    expect(css).toContain('background:rgb(255 255 255/.9)')
    expect(css).toContain('background:rgb(255 255 255/.12)')
  })

  it('sanitizes invalid cardAccent and cardFrame values', () => {
    const sanitized = sanitizeBlockStyle(
      { cardAccent: 'invalid-accent', cardFrame: 'invalid-frame' },
      DEFAULT_DESIGN_SYSTEM,
    )
    expect(sanitized?.cardAccent).toBeUndefined()
    expect(sanitized?.cardFrame).toBeUndefined()
  })
})

describe('PK-20: IconCard and IconCardGrid highlight classes', () => {
  it('renders outline highlight with accent-pink border', () => {
    const { container } = render(
      <IconCard title="[MẪU] Thẻ Viền" text="[MẪU] Mô tả" highlight="outline" />,
    )
    const card = container.querySelector('[data-eb-card]')
    expect(card).toBeTruthy()
    expect(card?.className).toContain('!border-2')
    expect(card?.className).toContain('!border-accent-pink')
  })

  it('renders navy highlight with deep-navy background, white text and solid attribute', () => {
    const { container } = render(
      <IconCard
        title="[MẪU] Thẻ Navy"
        text="[MẪU] Mô tả"
        highlight="navy"
        marker="number"
        index={0}
      />,
    )
    const card = container.querySelector('[data-eb-card]')
    expect(card).toBeTruthy()
    expect(card?.className).toContain('!bg-deep-navy')
    expect(card?.className).toContain('!text-white')
    expect(card?.hasAttribute('data-eb-card-solid')).toBe(true)

    const title = container.querySelector('h3')
    expect(title?.className).toContain('!text-white')

    const numberMarker = container.querySelector('span.font-display')
    expect(numberMarker?.className).toContain('!text-accent-pink')
  })

  it('IconCardGrid renders cards with their individual highlight styles', () => {
    const { container } = render(
      <IconCardGrid
        items={[
          { title: '[MẪU] Thẻ 1', text: '[MẪU] Thường', highlight: 'none' },
          { title: '[MẪU] Thẻ 2', text: '[MẪU] Viền', highlight: 'outline' },
          { title: '[MẪU] Thẻ 3', text: '[MẪU] Navy', highlight: 'navy' },
        ]}
      />,
    )
    const cards = container.querySelectorAll('[data-eb-card]')
    expect(cards.length).toBe(3)
    expect(cards[1].className).toContain('!border-accent-pink')
    expect(cards[2].className).toContain('!bg-deep-navy')
  })
})

describe('PK-20: BrandImage shapes, badge, caption and avatars', () => {
  it('renders default rounded shape', () => {
    const { container } = render(
      <BrandImage
        src="/brand/sample.jpg"
        alt="[MẪU] Ảnh"
        width={400}
        height={300}
        shape="rounded"
      />,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('rounded-card')
  })

  it('renders arch-left and arch-right shapes with custom border radii', () => {
    const { container: leftContainer } = render(
      <BrandImage
        src="/brand/sample.jpg"
        alt="[MẪU] Vòm trái"
        width={400}
        height={300}
        shape="arch-left"
      />,
    )
    expect(leftContainer.firstElementChild?.className).toContain('rounded-l-[64px]')
    expect(leftContainer.firstElementChild?.className).toContain('sm:rounded-l-[120px]')

    const { container: rightContainer } = render(
      <BrandImage
        src="/brand/sample.jpg"
        alt="[MẪU] Vòm phải"
        width={400}
        height={300}
        shape="arch-right"
      />,
    )
    expect(rightContainer.firstElementChild?.className).toContain('rounded-r-[64px]')
    expect(rightContainer.firstElementChild?.className).toContain('sm:rounded-r-[120px]')
  })

  it('renders wave shape with clip-path and WaveClipPath def', () => {
    const { container } = render(
      <BrandImage src="/brand/sample.jpg" alt="[MẪU] Sóng" width={400} height={300} shape="wave" />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper?.style.clipPath).toContain('url(#tdcx-brand-image-wave)')
    expect(container.querySelector('#tdcx-brand-image-wave')).toBeTruthy()
  })

  it('renders badge on top left', () => {
    const { container } = render(
      <BrandImage
        src="/brand/sample.jpg"
        alt="[MẪU] Ảnh"
        width={400}
        height={300}
        badge="[MẪU] TIÊU CHUẨN"
      />,
    )
    const badge = container.querySelector('[data-brand-image-badge]')
    expect(badge).toBeTruthy()
    expect(badge?.textContent).toContain('[MẪU] TIÊU CHUẨN')
    expect(badge?.className).toContain('bg-deep-navy')
    expect(badge?.className).toContain('text-white')
  })

  it('renders floating caption with title, subtitle, and decorative avatars', () => {
    const { container } = render(
      <BrandImage
        src="/brand/sample.jpg"
        alt="[MẪU] Ảnh chính"
        width={400}
        height={300}
        caption={{
          title: '[MẪU] Tiêu đề nổi',
          subtitle: '[MẪU] Dòng phụ',
          avatars: ['/avatar1.jpg', '/avatar2.jpg'],
        }}
        captionPosition="bottom-left"
      />,
    )
    const caption = container.querySelector('[data-brand-image-caption]')
    expect(caption).toBeTruthy()
    expect(caption?.textContent).toContain('[MẪU] Tiêu đề nổi')
    expect(caption?.textContent).toContain('[MẪU] Dòng phụ')

    const avatarImgs = caption?.querySelectorAll('img')
    expect(avatarImgs?.length).toBe(2)
    // Decorative avatars have alt=""
    avatarImgs?.forEach((img) => expect(img.getAttribute('alt')).toBe(''))
  })
})

describe('PK-20: ImageText compatibility when new fields are empty', () => {
  it('ImageText without new fields renders the exact expected HTML structure', () => {
    const { container } = render(
      <ImageText
        titleLine1="[MẪU] TIÊU ĐỀ 1"
        titleLine2="[MẪU] TIÊU ĐỀ 2"
        content="[MẪU] Nội dung đoạn văn bản."
        imageUrl="/sample.jpg"
        imageAlt="[MẪU] Ảnh minh họa"
      />,
    )
    // Main image wrapper has rounded-card, border-deep-navy/10, shadow-soft, bg-white
    const imageWrapper = container.querySelector(
      '.rounded-card.border-deep-navy\\/10.shadow-soft.bg-white',
    )
    expect(imageWrapper).toBeTruthy()

    const img = container.querySelector('img[alt="[MẪU] Ảnh minh họa"]')
    expect(img).toBeTruthy()

    // No badge or floating caption rendered
    expect(container.querySelector('[data-brand-image-badge]')).toBeNull()
    expect(container.querySelector('[data-brand-image-caption]')).toBeNull()
  })
})

describe('QA PK-20c: BrandImage fixes', () => {
  it('keeps the badge and caption clear of the arch curve', () => {
    const { container } = render(
      <BrandImage
        src="/test.jpg"
        alt="[MẪU] Ảnh"
        width={400}
        height={300}
        shape="arch-left"
        badge="[MẪU] Nhãn"
        caption={{ title: '[MẪU] Chú thích' }}
      />,
    )
    const badge = container.querySelector('[data-brand-image-badge]')!
    const caption = container.querySelector('[data-brand-image-caption]')!
    expect(badge.className).toContain('sm:left-16')
    expect(caption.className).toContain('sm:left-16')
  })

  it('does not stretch a fill image the caller already sized (IconCard icon stays 48px)', () => {
    const { container } = render(
      <BrandImage src="/test.jpg" alt="[MẪU] Ảnh" fill className="h-12 w-12 rounded-2xl" />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).not.toContain('h-full')
    expect(wrapper.className).toContain('h-12')
  })
})
