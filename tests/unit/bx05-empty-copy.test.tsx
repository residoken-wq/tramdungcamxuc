import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { pickCopy, pickCopyList, hasCopy } from '@/lib/copy'
import { EQBuddyIntro } from '@/components/eq/zip/EQBuddyIntro'
import { EQDrawApp } from '@/components/eq/zip/EQDrawApp'
import { vi as viLocale } from '@/lib/i18n/vi'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))
vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))
vi.mock('@/lib/eq/actions', () => ({
  drawEqCardAction: vi.fn(),
  saveEqCardAction: vi.fn(),
}))

describe('BX-05: pickCopy & helper logic', () => {
  it('returns value when string is non-empty', () => {
    expect(pickCopy('Tiêu đề thực tế', 'Tiêu đề mặc định', false)).toBe('Tiêu đề thực tế')
    expect(pickCopy('Tiêu đề thực tế', 'Tiêu đề mặc định', true)).toBe('Tiêu đề thực tế')
    expect(pickCopy('  Có khoảng trắng  ', 'Tiêu đề mặc định', false)).toBe('  Có khoảng trắng  ')
  })

  it('returns null when value is empty/whitespace and useDefault is false/undefined', () => {
    expect(pickCopy('', 'Mặc định', false)).toBeNull()
    expect(pickCopy('   ', 'Mặc định', false)).toBeNull()
    expect(pickCopy(null, 'Mặc định', false)).toBeNull()
    expect(pickCopy(undefined, 'Mặc định', false)).toBeNull()
    expect(pickCopy('', 'Mặc định')).toBeNull()
    expect(pickCopy('   ', 'Mặc định')).toBeNull()
    expect(pickCopy(null, 'Mặc định')).toBeNull()
    expect(pickCopy(undefined, 'Mặc định')).toBeNull()
  })

  it('returns fallback when value is empty/whitespace and useDefault is true', () => {
    expect(pickCopy('', 'Mặc định', true)).toBe('Mặc định')
    expect(pickCopy('   ', 'Mặc định', true)).toBe('Mặc định')
    expect(pickCopy(null, 'Mặc định', true)).toBe('Mặc định')
    expect(pickCopy(undefined, 'Mặc định', true)).toBe('Mặc định')
  })

  it('preserves React element regardless of useDefault', () => {
    const el = <span>Sửa trực tiếp</span>
    expect(pickCopy(el, 'Mặc định', false)).toBe(el)
    expect(pickCopy(el, 'Mặc định', true)).toBe(el)
  })

  it('pickCopyList returns list when non-empty, fallback when empty + useDefault, empty list when empty + false', () => {
    const list = [{ id: 1, title: 'Item 1' }]
    const fallback = [{ id: 2, title: 'Fallback' }]

    expect(pickCopyList(list, fallback, false)).toEqual(list)
    expect(pickCopyList(list, fallback, true)).toEqual(list)

    expect(pickCopyList([], fallback, false)).toEqual([])
    expect(pickCopyList(null, fallback, false)).toEqual([])
    expect(pickCopyList(undefined, fallback, false)).toEqual([])

    expect(pickCopyList([], fallback, true)).toEqual(fallback)
    expect(pickCopyList(null, fallback, true)).toEqual(fallback)
    expect(pickCopyList(undefined, fallback, true)).toEqual(fallback)
  })

  it('hasCopy correctly checks if any copy exists in section', () => {
    expect(hasCopy('', null, undefined, '   ')).toBe(false)
    expect(hasCopy([], '', null)).toBe(false)
    expect(hasCopy('', 'Có chữ', null)).toBe(true)
    expect(hasCopy(['item'])).toBe(true)
    expect(hasCopy(<span>El</span>)).toBe(true)
  })
})

describe('BX-05: Source 2 – EQ Buddy Content', () => {
  it('EQBuddyIntro: ô trống + useDefaultCopyIntro = false thì ẩn tiêu đề và châm ngôn', () => {
    const { container } = render(
      <EQBuddyIntro
        content={{
          useDefaultCopyIntro: false,
          mainTitle: '',
          subtitle: '',
          tagline: '',
          quoteTop: '',
        }}
      />,
    )

    // Tiêu đề chính và phụ mặc định không hiện
    expect(screen.queryByText(viLocale.au02.introTitle)).toBeNull()
    expect(screen.queryByText(viLocale.au02.introSubtitle)).toBeNull()
    expect(screen.queryByText('Dừng để vững vàng bước tới.')).toBeNull()
    // Không có thẻ h1 nào
    expect(container.querySelector('h1')).toBeNull()

    // Nhãn chức năng: nút "Hướng dẫn" vẫn luôn hiển thị
    expect(screen.getAllByText(`📖 ${viLocale.dp01eq.guide}`).length).toBeGreaterThan(0)
  })

  it('EQBuddyIntro: ô trống + useDefaultCopyIntro = true thì hiện chữ mẫu mặc định', () => {
    render(
      <EQBuddyIntro
        content={{
          useDefaultCopyIntro: true,
          mainTitle: '',
          subtitle: '',
        }}
      />,
    )

    expect(screen.getByText(viLocale.au02.introTitle)).toBeDefined()
    expect(screen.getByText(viLocale.au02.introSubtitle)).toBeDefined()
  })

  it('EQBuddyIntro: có điền chữ thì hiện chữ tùy biến', () => {
    render(
      <EQBuddyIntro
        content={{
          useDefaultCopyIntro: false,
          mainTitle: 'BỘ THẺ TÙY BIẾN CỦA HANA',
          subtitle: 'Mô tả tùy biến riêng.',
        }}
      />,
    )

    expect(screen.getByText('BỘ THẺ TÙY BIẾN CỦA HANA')).toBeDefined()
    expect(screen.getByText('Mô tả tùy biến riêng.')).toBeDefined()
  })

  it('EQDrawApp: 3 biểu tượng trống + useDefaultCopyStateIcons = false thì ẩn cả khối biểu tượng', () => {
    const mockCard = {
      id: 1,
      code: 'TDCX-1',
      qrSlug: 'the-so-1',
      keywordEn: 'PEACE',
      keywordVi: 'Bình An',
      promptRecall: 'Câu 1',
      promptPack: 'Câu 2',
      promptAcknowledge: 'Câu 3',
      isPublished: true,
    }

    render(
      <EQDrawApp
        allCards={[mockCard]}
        initialStep="draw"
        content={{
          useDefaultCopyStateIcons: false,
          stateIcon1Label: '',
          stateIcon2Label: '',
          stateIcon3Label: '',
        }}
      />,
    )

    expect(screen.queryByText(viLocale.au02.stateIcon1)).toBeNull()
    expect(screen.queryByText(viLocale.au02.stateIcon2)).toBeNull()
    expect(screen.queryByText(viLocale.au02.stateIcon3)).toBeNull()
  })
})
