import React from 'react'
import { describe, expect, it, vi as vitestVi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  ProductCard,
  TestimonialCard,
  LeadForm,
  Navbar,
  Footer,
} from '@/components/site'
import { EmotionPicker, ProgressGrid } from '@/components/habit'
import { EMOTIONS } from '@/lib/emotions'
import { vi } from '@/lib/i18n/vi'

describe('UI Composites (T0-05)', () => {
  describe('TestimonialCard Component', () => {
    it('returns null and does not render when consent is false', () => {
      const { container } = render(
        <TestimonialCard
          quote="[MẪU] Trải nghiệm tuyệt vời"
          name="[MẪU] Người học A"
          consent={false}
        />
      )
      expect(container.firstChild).toBeNull()
      expect(screen.queryByText(/Trải nghiệm tuyệt vời/)).toBeNull()
    })

    it('renders quote, name, role and avatar when consent is true', () => {
      render(
        <TestimonialCard
          quote="[MẪU] Khóa học đã giúp tôi hiểu mình rõ hơn."
          name="[MẪU] Người học B"
          role="[MẪU] Quản lý đội ngũ"
          photo={{ src: '/brand/sample-avatar.svg', alt: '[MẪU] Ảnh đại diện' }}
          consent={true}
        />
      )

      expect(
        screen.getByText('[MẪU] Khóa học đã giúp tôi hiểu mình rõ hơn.')
      ).toBeDefined()
      expect(screen.getByText('[MẪU] Người học B')).toBeDefined()
      expect(screen.getByText('[MẪU] Quản lý đội ngũ')).toBeDefined()
      const img = screen.getByAltText('[MẪU] Ảnh đại diện')
      expect(img).toBeDefined()
    })
  })

  describe('ProductCard Component', () => {
    it('returns null and does not render when saleStatus is hidden', () => {
      const { container } = render(
        <ProductCard
          name="[MẪU] Sản phẩm bí mật"
          saleStatus="hidden"
          coverImage={{ src: '/brand/sample-cover.svg', alt: '[MẪU] Bìa' }}
        />
      )
      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('[MẪU] Sản phẩm bí mật')).toBeNull()
    })

    it('renders product details, formatted PriceTag, StatusBadge, and CTA slot', () => {
      render(
        <ProductCard
          name="[MẪU] Sổ tay Thói quen 21 Ngày"
          shortDescription="[MẪU] Rèn luyện bền bỉ mỗi ngày qua phương pháp khoa học."
          coverImage={{ src: '/brand/sample-cover.svg', alt: '[MẪU] Bìa sản phẩm' }}
          price={250000}
          salePrice={178000}
          saleStatus="on_sale"
          trialDays={21}
          journeyStep="pause"
          cta={<button id="test-cta-btn">Đăng ký ngay</button>}
        />
      )

      expect(screen.getByText('[MẪU] Sổ tay Thói quen 21 Ngày')).toBeDefined()
      expect(
        screen.getByText('[MẪU] Rèn luyện bền bỉ mỗi ngày qua phương pháp khoa học.')
      ).toBeDefined()
      expect(screen.getByText('250.000đ')).toBeDefined()
      expect(screen.getByText('178.000đ')).toBeDefined()
      expect(screen.getByText('Đang mở bán')).toBeDefined()
      expect(screen.getByText(/21 ngày dùng thử miễn phí/)).toBeDefined()
      expect(screen.getByText(vi.product.journeySteps.pause)).toBeDefined()
      expect(screen.getByRole('button', { name: 'Đăng ký ngay' })).toBeDefined()
    })
  })

  describe('LeadForm Component', () => {
    it('displays Vietnamese errors on empty submit or invalid email', async () => {
      render(<LeadForm />)

      const submitButton = screen.getByRole('button', { name: vi.leadForm.submit })
      fireEvent.click(submitButton)

      // Expect required field error messages
      expect(screen.getByText(vi.leadForm.errors.nameRequired)).toBeDefined()
      expect(screen.getByText(vi.leadForm.errors.emailRequired)).toBeDefined()
      expect(screen.getByText(vi.leadForm.errors.consentRequired)).toBeDefined()

      // Enter name and invalid email format
      const nameInput = screen.getByLabelText(new RegExp(vi.leadForm.nameLabel, 'i'))
      const emailInput = screen.getByLabelText(new RegExp(vi.leadForm.emailLabel, 'i'))

      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn A' } })
      fireEvent.change(emailInput, { target: { value: 'invalid-email-address' } })
      fireEvent.click(submitButton)

      expect(screen.getByText(vi.leadForm.errors.emailInvalid)).toBeDefined()
    })

    it('does NOT call onSubmit when honeypot field has a value', async () => {
      const mockSubmit = vitestVi.fn().mockResolvedValue(undefined)
      render(<LeadForm onSubmit={mockSubmit} />)

      const nameInput = screen.getByLabelText(new RegExp(vi.leadForm.nameLabel, 'i'))
      const emailInput = screen.getByLabelText(new RegExp(vi.leadForm.emailLabel, 'i'))
      const consentCheckbox = screen.getByRole('checkbox')
      const honeypotInput = screen.getByLabelText('Company Name')

      fireEvent.change(nameInput, { target: { value: 'Bot Spam' } })
      fireEvent.change(emailInput, { target: { value: 'bot@spam.com' } })
      fireEvent.click(consentCheckbox)
      fireEvent.change(honeypotInput, { target: { value: 'Spam Corp' } })

      const submitButton = screen.getByRole('button', { name: vi.leadForm.submit })
      fireEvent.click(submitButton)

      // Honeypot silently handles submission without invoking handler
      expect(mockSubmit).not.toHaveBeenCalled()
      expect(screen.getByText(vi.leadForm.successTitle)).toBeDefined()
    })

    it('calls onSubmit with valid payload and displays success message', async () => {
      const mockSubmit = vitestVi.fn().mockResolvedValue(undefined)
      render(<LeadForm onSubmit={mockSubmit} />)

      const nameInput = screen.getByLabelText(new RegExp(vi.leadForm.nameLabel, 'i'))
      const emailInput = screen.getByLabelText(new RegExp(vi.leadForm.emailLabel, 'i'))
      const consentCheckbox = screen.getByRole('checkbox')

      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn B' } })
      fireEvent.change(emailInput, { target: { value: 'vanb@example.com' } })
      fireEvent.click(consentCheckbox)

      const submitButton = screen.getByRole('button', { name: vi.leadForm.submit })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'Nguyễn Văn B',
          email: 'vanb@example.com',
          consent: true,
        })
      })

      expect(screen.getByText(vi.leadForm.successTitle)).toBeDefined()
    })
  })

  describe('EmotionPicker Component', () => {
    it('renders all 6 sample emotions and responds to arrow key navigation', () => {
      const mockChange = vitestVi.fn()
      render(<EmotionPicker value="calm" onChange={mockChange} />)

      // Verify all 6 sample emotions are rendered
      for (const emotion of EMOTIONS) {
        expect(screen.getByText(emotion.label)).toBeDefined()
      }

      // Check radiogroup and radio attributes
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toBeDefined()

      const calmRadio = screen.getByRole('radio', { name: new RegExp('Bình yên', 'i') })
      expect(calmRadio.getAttribute('aria-checked')).toBe('true')

      // Press ArrowRight to move to next emotion (grateful)
      fireEvent.keyDown(calmRadio, { key: 'ArrowRight' })
      expect(mockChange).toHaveBeenCalledWith('grateful')

      // Press ArrowLeft to wrap around to previous emotion
      fireEvent.keyDown(calmRadio, { key: 'ArrowLeft' })
      expect(mockChange).toHaveBeenCalledWith('anxious')
    })
  })

  describe('ProgressGrid Component', () => {
    it('disables future and locked days and prevents onSelectDay call', () => {
      const mockSelect = vitestVi.fn()
      const sampleDays = [
        { day: 1, status: 'done' as const, emotionKey: 'calm' },
        { day: 2, status: 'today' as const },
        { day: 3, status: 'future' as const },
        { day: 4, status: 'locked' as const },
      ]

      render(<ProgressGrid days={sampleDays} onSelectDay={mockSelect} />)

      // Day 1 (done) is clickable
      const day1 = screen.getByRole('button', { name: /Ngày 1: Đã hoàn thành/i })
      expect(day1).toBeDefined()
      expect((day1 as HTMLButtonElement).disabled).toBe(false)
      fireEvent.click(day1)
      expect(mockSelect).toHaveBeenCalledWith(1)

      // Day 3 (future) is disabled and cannot be clicked
      const day3 = screen.getByRole('button', { name: /Ngày 3: Chưa tới/i })
      expect((day3 as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(day3)
      expect(mockSelect).not.toHaveBeenCalledWith(3)

      // Day 4 (locked) is disabled and cannot be clicked
      const day4 = screen.getByRole('button', { name: /Ngày 4: Đã khóa/i })
      expect((day4 as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(day4)
      expect(mockSelect).not.toHaveBeenCalledWith(4)
    })
  })

  describe('Navbar Component', () => {
    it('renders navigation items, CTA button, and accessible mobile controls', () => {
      render(
        <Navbar
          items={[
            { label: 'Về Hana', href: '/ve-hana' },
            { label: 'Thư viện', href: '/thu-vien' },
            { label: 'Test thói quen 5 phút', href: '/habit/chan-doan' },
          ]}
          cta={{ label: 'Đặt phiên trải nghiệm', href: '/dat-phien' }}
        />
      )

      expect(screen.getByRole('link', { name: 'Về Hana' })).toBeDefined()
      expect(screen.getByRole('link', { name: 'Thư viện' })).toBeDefined()
      // Desktop + mobile quiz link
      const quizLinks = screen.getAllByRole('link', { name: /Test thói quen 5 phút/i })
      expect(quizLinks.length).toBeGreaterThan(0)

      // Mobile toggle button
      const toggle = screen.getByRole('button', { name: vi.navbar.openMenu })
      expect(toggle).toBeDefined()
      expect(toggle.getAttribute('aria-expanded')).toBe('false')

      // Open drawer
      fireEvent.click(toggle)
      expect(toggle.getAttribute('aria-expanded')).toBe('true')
    })
  })

  describe('Footer Component', () => {
    it('renders sorted legal links, seller info without empty fields, and copyright year', () => {
      const testLegalLinks = [
        { title: 'Chính sách bảo mật', slug: '/chinh-sach-bao-mat', order: 2 },
        { title: 'Thông tin pháp lý', slug: '/thong-tin-phap-ly', order: 1 },
      ]

      render(
        <Footer
          legalLinks={testLegalLinks}
          sellerInfo={{
            name: 'Trạm Dừng Cảm Xúc',
            email: 'contact@tramdungcamxuc.com',
            // address and taxCode intentionally omitted
          }}
        />
      )

      expect(screen.getByRole('link', { name: 'Thông tin pháp lý' })).toBeDefined()
      expect(screen.getByRole('link', { name: 'Chính sách bảo mật' })).toBeDefined()
      expect(screen.getByText('Trạm Dừng Cảm Xúc')).toBeDefined()
      expect(screen.getByText('contact@tramdungcamxuc.com')).toBeDefined()
      expect(screen.queryByText(vi.footer.seller.taxCode)).toBeNull()

      const currentYear = new Date().getFullYear().toString()
      expect(screen.getByText(new RegExp(currentYear))).toBeDefined()
    })
  })
})
