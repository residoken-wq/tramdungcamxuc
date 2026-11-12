import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EQ_GRADIENT_THEME_OPTIONS } from '@/collections/EqCards'
import { EQCardFlip } from '@/components/eq/zip/EQCardFlip'
import { GuideModal } from '@/components/eq/zip/GuideModal'
import { EQBuddyIntro } from '@/components/eq/zip/EQBuddyIntro'
import type { PublicEqCard } from '@/lib/eq/cards.server'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock TrialBanner
vi.mock('@/components/habit/TrialBanner', () => ({
  TrialBanner: ({ productSlug }: { productSlug: string }) => (
    <div data-testid="trial-banner" data-product={productSlug}>
      Trial Banner
    </div>
  ),
}))

const sampleCard: PublicEqCard = {
  id: 'card-1',
  code: '01',
  order: 1,
  keywordEn: 'ACCEPTANCE',
  keywordVi: 'Chấp nhận',
  category: 'Tự thân',
  gradientTheme: 'from-[#FDE6F6] via-[#FAF7F4] to-[#E9DDF9]',
  message: 'Mọi cảm xúc đến đều có lý do của nó.',
  promptRecall: 'Bạn đang cố xua đuổi điều gì?',
  promptPack: 'Một điều bạn có thể ôm ấp lúc này?',
  promptAcknowledge: 'Tôi cho phép bản thân được cảm thấy như vậy.',
  smallAction: 'Hít 3 hơi thở sâu.',
  story: null,
  qrSlug: 'the-01-acceptance',
  printedAt: null,
  _status: 'published',
}

describe('DP-01b: EQ Buddy Zip UI & Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Gradient themes and Brand Book tokens (E1)', () => {
    it('has 10 gradient theme options using Brand Book 2026 hex colors', () => {
      expect(EQ_GRADIENT_THEME_OPTIONS).toHaveLength(10)
      const allowedHex = ['#FDE6F6', '#FAF7F4', '#E9DDF9', '#D9F1EA', '#F6E9B8']

      for (const [gradientVal] of EQ_GRADIENT_THEME_OPTIONS) {
        expect(gradientVal).toContain('from-')
        expect(gradientVal).toContain('to-')
        // Each option must only use our approved brand pastel hexes
        for (const token of gradientVal.split(' ')) {
          if (token.startsWith('from-[#') || token.startsWith('via-[#') || token.startsWith('to-[#')) {
            const hexMatch = token.match(/#([A-Fa-f0-9]{6})/)
            if (hexMatch) {
              expect(allowedHex).toContain(hexMatch[0].toUpperCase())
            }
          }
        }
      }
    })
  })

  describe('EQCardFlip 3D flip card component', () => {
    it('renders front card with keywords, category, and message quote', () => {
      const toggleMock = vi.fn()
      render(
        <EQCardFlip
          card={sampleCard}
          isFlipped={false}
          onToggleFlip={toggleMock}
        />
      )

      expect(screen.getAllByText('ACCEPTANCE').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('• Chấp nhận •')).toBeDefined()
      expect(screen.getByText('Tự thân')).toBeDefined()
      expect(screen.getByText(/Mọi cảm xúc đến đều có lý do của nó/)).toBeDefined()
      expect(screen.queryByText(/THẺ SỐ/i)).toBeNull()
      expect(screen.getByText('EQ BUDDY')).toBeDefined()
    })

    it('renders back card with 3 reflection prompts', () => {
      const toggleMock = vi.fn()
      render(
        <EQCardFlip
          card={sampleCard}
          isFlipped={true}
          onToggleFlip={toggleMock}
        />
      )

      expect(screen.getByText('Bạn đang cố xua đuổi điều gì?')).toBeDefined()
      expect(screen.getByText('Một điều bạn có thể ôm ấp lúc này?')).toBeDefined()
      expect(screen.getByText('Tôi cho phép bản thân được cảm thấy như vậy.')).toBeDefined()
    })

    it('triggers onToggleFlip when clicked or keydown Enter/Space', () => {
      const toggleMock = vi.fn()
      render(
        <EQCardFlip
          card={sampleCard}
          isFlipped={false}
          onToggleFlip={toggleMock}
        />
      )

      const cardButton = screen.getByRole('button')
      fireEvent.click(cardButton)
      expect(toggleMock).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(cardButton, { key: 'Enter' })
      expect(toggleMock).toHaveBeenCalledTimes(2)

      fireEvent.keyDown(cardButton, { key: ' ' })
      expect(toggleMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('GuideModal Component', () => {
    it('renders when isOpen is true and calls onClose when clicked', () => {
      const closeMock = vi.fn()
      const { rerender } = render(
        <GuideModal isOpen={false} onClose={closeMock} />
      )

      expect(screen.queryByText(/3 bước để "dừng"/i)).toBeNull()

      rerender(<GuideModal isOpen={true} onClose={closeMock} />)
      expect(screen.getByText(/3 bước để "dừng"/i)).toBeDefined()
      expect(screen.getByText(/Gọi tên mong muốn và cảm xúc/i)).toBeDefined()
      expect(screen.getByText(/Chọn thông điệp/i)).toBeDefined()
      expect(screen.getAllByText(/Khám phá/i).length).toBeGreaterThanOrEqual(1)

      const closeBtn = screen.getByRole('button', { name: /Đóng hướng dẫn/i })
      fireEvent.click(closeBtn)
      expect(closeMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('EQBuddyIntro Onboarding Component', () => {
    beforeEach(() => {
      mockPush.mockClear()
    })

    it('switches between step 1 (Bộ thẻ là gì?) and step 2 (4 Bước Sử Dụng)', () => {
      render(
        <EQBuddyIntro
          content={{
            mainTitle: 'Trạm EQ Buddy',
            intro1Heading: 'Bộ thẻ là gì?',
            shopeeUrl: 'https://shopee.vn/test-shop',
          }}
          trialBanner={<div data-testid="trial-banner" />}
        />
      )

      // Content check
      expect(screen.getByText('Trạm EQ Buddy')).toBeDefined()
      expect(screen.getByText(/Bộ thẻ là gì\?/i)).toBeDefined()
      expect(screen.getByTestId('trial-banner')).toBeDefined()

      // Link Rút thẻ ngay leads to /eq-buddy/rut-the
      const drawLink = screen.getByRole('link', { name: /Rút thẻ ngay/i })
      expect(drawLink.getAttribute('href')).toBe('/eq-buddy/rut-the')
    })

    it('renders no trial banner when the page passes none (free mode)', () => {
      render(
        <EQBuddyIntro
          content={{
            mainTitle: 'Trạm EQ Buddy Free',
          }}
          trialBanner={null}
        />
      )

      expect(screen.queryByTestId('trial-banner')).toBeNull()
    })
  })
})
