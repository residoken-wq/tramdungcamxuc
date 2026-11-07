import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HeroImage } from '@/components/site/HeroImage'
import { HeroImageBlock } from '@/puck/blocks/HeroImage'
import { HeroTwoEntriesBlock } from '@/puck/blocks/HeroTwoEntries'
import {
  HERO_LAYOUT_OPTIONS,
  HERO_TWO_ENTRIES_LAYOUT_OPTIONS,
  HERO_IMAGE_SIDE_OPTIONS,
} from '@/lib/brand/hero-backdrop'
import { vi } from '@/lib/i18n/vi'

describe('PK-25: HeroImage "side" layout (Ảnh bên cạnh chữ)', () => {
  describe('1. Layout options and field resolution', () => {
    it('HERO_LAYOUT_OPTIONS has 3 options: side, split, backdrop', () => {
      expect(HERO_LAYOUT_OPTIONS).toHaveLength(3)
      expect(HERO_LAYOUT_OPTIONS[0]).toEqual({
        label: vi.pk25.layoutOptions.side,
        value: 'side',
      })
      expect(HERO_LAYOUT_OPTIONS[1]).toEqual({
        label: vi.pk25.layoutOptions.split,
        value: 'split',
      })
      expect(HERO_LAYOUT_OPTIONS[2]).toEqual({
        label: vi.eb14a.layoutOptions.backdrop,
        value: 'backdrop',
      })
      expect(HERO_LAYOUT_OPTIONS[0].label).toBe('Ảnh bên cạnh chữ')
      expect(HERO_LAYOUT_OPTIONS[1].label).toBe('Ảnh bên dưới chữ')
      expect(HERO_LAYOUT_OPTIONS[2].label).toBe('Ảnh làm nền, chữ nằm trên ảnh')
    })

    it('HERO_TWO_ENTRIES_LAYOUT_OPTIONS keeps 2 original options and labels', () => {
      expect(HERO_TWO_ENTRIES_LAYOUT_OPTIONS).toHaveLength(2)
      expect(HERO_TWO_ENTRIES_LAYOUT_OPTIONS[0]).toEqual({
        label: vi.eb14a.layoutOptions.split,
        value: 'split',
      })
      expect(HERO_TWO_ENTRIES_LAYOUT_OPTIONS[1]).toEqual({
        label: vi.eb14a.layoutOptions.backdrop,
        value: 'backdrop',
      })
      expect(HERO_TWO_ENTRIES_LAYOUT_OPTIONS[0].label).toBe('Ảnh bên cạnh chữ')
      expect(HERO_TWO_ENTRIES_LAYOUT_OPTIONS[1].label).toBe('Ảnh làm nền, chữ nằm trên ảnh')
      // HeroTwoEntriesBlock layout options remain unchanged
      expect((HeroTwoEntriesBlock.fields as any).layout.type).toBe('select')
    })

    it('HERO_IMAGE_SIDE_OPTIONS has right and left options', () => {
      expect(HERO_IMAGE_SIDE_OPTIONS).toEqual([
        { label: 'Bên phải chữ', value: 'right' },
        { label: 'Bên trái chữ', value: 'left' },
      ])
    })

    it('HeroImageBlock resolveFields shows imageSide only when layout = side', () => {
      const mockParams = { fields: { ...HeroImageBlock.fields } } as any

      // layout = 'side'
      const sideResolved = HeroImageBlock.resolveFields?.(
        { props: { ...HeroImageBlock.defaultProps, layout: 'side' } } as any,
        mockParams,
      ) as any
      expect(sideResolved?.imageSide).toBeDefined()
      expect(sideResolved?.overlayTone).toBeUndefined()

      // layout = 'split'
      const splitResolved = HeroImageBlock.resolveFields?.(
        { props: { ...HeroImageBlock.defaultProps, layout: 'split' } } as any,
        mockParams,
      ) as any
      expect(splitResolved?.imageSide).toBeUndefined()
      expect(splitResolved?.overlayTone).toBeUndefined()

      // layout = 'backdrop'
      const backdropResolved = HeroImageBlock.resolveFields?.(
        { props: { ...HeroImageBlock.defaultProps, layout: 'backdrop' } } as any,
        mockParams,
      ) as any
      expect(backdropResolved?.imageSide).toBeUndefined()
      expect(backdropResolved?.overlayTone).toBeDefined()
    })
  })

  describe('2. Render split layout (backward compatibility)', () => {
    it('split mode renders centered content and banner below with aspect-[16/9]', () => {
      const { container } = render(
        <HeroImage
          layout="split"
          titleLine1="TIÊU ĐỀ ẢNH"
          titleLine2="DÒNG 2"
          imageUrl="/test-banner.jpg"
          imageAlt="[MẪU] Ảnh banner"
        />,
      )

      expect(container.querySelector('.lg\\:grid-cols-12')).toBeNull()
      expect(container.querySelector('.aspect-\\[16\\/9\\]')).toBeTruthy()
      expect(container.querySelector('img[alt="[MẪU] Ảnh banner"]')).toBeTruthy()
      expect(container.querySelector('.text-center')).toBeTruthy()
    })
  })

  describe('3. Render side layout', () => {
    it('side mode has 2-column grid at lg, image after text when imageSide = right', () => {
      const { container } = render(
        <HeroImage
          layout="side"
          imageSide="right"
          titleLine1="KHAI VẤN CHUYÊN SÂU"
          titleLine2="1:1 COACHING"
          emotionLine="Không gian an toàn để chuyển mình"
          imageUrl="/test-coach.jpg"
          imageAlt="[MẪU] Chân dung Coach"
          badges={[{ text: 'Bảo mật tuyệt đối' }]}
          stats={[{ value: '1:1', label: 'Đồng hành' }]}
          buttonText="Đặt lịch ngay"
          buttonLink="#booking"
        />,
      )

      const grid = container.querySelector('.lg\\:grid-cols-12')
      expect(grid).toBeTruthy()

      // DOM order: text column is first child, image column is second child
      const children = grid?.children
      expect(children).toBeDefined()
      expect(children?.length).toBe(2)

      const firstChild = children?.[0] as HTMLElement
      const secondChild = children?.[1] as HTMLElement

      // First child is text column with order-1 lg:order-1
      expect(firstChild.className).toContain('lg:col-span-7')
      expect(firstChild.className).toContain('order-1')
      expect(firstChild.className).toContain('lg:order-1')
      expect(firstChild.className).toContain('text-left')
      expect(firstChild.textContent).toContain('KHAI VẤN CHUYÊN SÂU')

      // Second child is image column with order-2 lg:order-2
      expect(secondChild.className).toContain('lg:col-span-5')
      expect(secondChild.className).toContain('order-2')
      expect(secondChild.className).toContain('lg:order-2')
      expect(secondChild.querySelector('img[alt="[MẪU] Chân dung Coach"]')).toBeTruthy()

      // Aspect ratio for side image is aspect-[4/5]
      expect(secondChild.querySelector('.aspect-\\[4\\/5\\]')).toBeTruthy()
    })

    it('side mode has image before text in DOM and lg:order-1 on image when imageSide = left', () => {
      const { container } = render(
        <HeroImage
          layout="side"
          imageSide="left"
          titleLine1="VỀ TRẠM"
          titleLine2="CẢM XÚC"
          imageUrl="/test-about.jpg"
          imageAlt="[MẪU] Về Trạm"
        />,
      )

      const grid = container.querySelector('.lg\\:grid-cols-12')
      expect(grid).toBeTruthy()

      const children = grid?.children
      expect(children?.length).toBe(2)

      const firstChild = children?.[0] as HTMLElement
      const secondChild = children?.[1] as HTMLElement

      // First child in DOM is image column with order-2 lg:order-1
      expect(firstChild.className).toContain('lg:col-span-5')
      expect(firstChild.className).toContain('order-2')
      expect(firstChild.className).toContain('lg:order-1')
      expect(firstChild.querySelector('img[alt="[MẪU] Về Trạm"]')).toBeTruthy()

      // Second child in DOM is text column with order-1 lg:order-2
      expect(secondChild.className).toContain('lg:col-span-7')
      expect(secondChild.className).toContain('order-1')
      expect(secondChild.className).toContain('lg:order-2')
      expect(secondChild.textContent).toContain('VỀ TRẠM')
    })

    it('side mode passes BrandImage shape, badge, and caption correctly', () => {
      const { container } = render(
        <HeroImage
          layout="side"
          imageSide="right"
          titleLine1="TIÊU ĐỀ"
          titleLine2="DÒNG 2"
          imageUrl="/test.jpg"
          imageAlt="[MẪU] Ảnh test"
          imageShape="arch-left"
          imageBadge="TIÊU CHUẨN ICF"
          imageCaptionTitle="Không gian an toàn"
          imageCaptionSubtitle="Thấu cảm sâu sắc"
        />,
      )

      expect(container.textContent).toContain('TIÊU CHUẨN ICF')
      expect(container.textContent).toContain('Không gian an toàn')
      expect(container.textContent).toContain('Thấu cảm sâu sắc')
      const imgWrapper = container.querySelector('.rounded-l-\\[64px\\]')
      expect(imgWrapper).toBeTruthy()
    })

    it('side mode without valid image falls back to single centered text column without grid or img', () => {
      // Empty imageAlt
      const { container: c1 } = render(
        <HeroImage
          layout="side"
          titleLine1="TIÊU ĐỀ KHÔNG ẢNH"
          titleLine2="DÒNG 2"
          imageUrl="/test.jpg"
          imageAlt=""
        />,
      )
      expect(c1.querySelector('.lg\\:grid-cols-12')).toBeNull()
      expect(c1.querySelector('img')).toBeNull()
      expect(c1.querySelector('.text-center')).toBeTruthy()
      expect(c1.textContent).toContain('TIÊU ĐỀ KHÔNG ẢNH')

      // Whitespace imageAlt
      const { container: c2 } = render(
        <HeroImage
          layout="side"
          titleLine1="TIÊU ĐỀ KHOẢNG TRẮNG"
          titleLine2="DÒNG 2"
          imageUrl="/test.jpg"
          imageAlt="   "
        />,
      )
      expect(c2.querySelector('.lg\\:grid-cols-12')).toBeNull()
      expect(c2.querySelector('img')).toBeNull()

      // No imageUrl
      const { container: c3 } = render(
        <HeroImage
          layout="side"
          titleLine1="TIÊU ĐỀ THIẾU URL"
          titleLine2="DÒNG 2"
          imageUrl=""
          imageAlt="[MẪU] Có alt nhưng thiếu url"
        />,
      )
      expect(c3.querySelector('.lg\\:grid-cols-12')).toBeNull()
      expect(c3.querySelector('img')).toBeNull()
    })
  })
})
