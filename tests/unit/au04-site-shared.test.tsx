import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ExperienceBookingButton,
  formatBookingButtonLabel,
} from '@/components/site/ExperienceBookingButton'
import { BookingCTA } from '@/components/site/BookingCTA'
import { ButtonWidget } from '@/components/site/widgets/ButtonWidget'
import { CTASection } from '@/components/site/CTASection'
import {
  TwoToneTitle,
  renderHighlightedTitle,
  stripTitleHighlight,
  TITLE_HIGHLIGHT_COLOR,
  TITLE_HIGHLIGHT_DARK_COLOR,
} from '@/components/ui/TwoToneTitle'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { renderToStaticMarkup } from 'react-dom/server'
import { NavBadge } from '@/components/site/nav/NavBadge'
import { Navbar } from '@/components/site/Navbar'
import * as navBadgeMigration from '@/migrations/20261110_150000_au04_navigation_badge'
import { registrationFormSchema } from '@/lib/forms/schemas'
import { submitRegistrationLead } from '@/lib/forms/submit.server'
import { RegistrationModal } from '@/components/site/RegistrationModal'
import { vi as viStrings } from '@/lib/i18n/vi'
import type { Payload } from 'payload'
import * as analyticsModule from '@/lib/analytics/track'
import type { PublicProduct } from '@/lib/products'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

const mockCoachingProduct: PublicProduct = {
  id: 7,
  name: 'Growth Mirror – phiên trải nghiệm',
  slug: 'growth-mirror-phien-trai-nghiem',
  web: 'site',
  type: 'coaching_trial',
  price: 149000,
  salePrice: null,
  saleStatus: 'on_sale',
}

describe('AU-04: Nút đặt lịch dùng chung (Mục 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatBookingButtonLabel helper', () => {
    it('appends price in parenthesis when showPrice is true and label lacks price', () => {
      const res = formatBookingButtonLabel('Đặt phiên trải nghiệm', 149000, true)
      expect(res).toBe('Đặt phiên trải nghiệm (149.000đ)')
    })

    it('replaces {price} placeholder if present', () => {
      const res = formatBookingButtonLabel('Đặt lịch chỉ {price}', 149000, true)
      expect(res).toBe('Đặt lịch chỉ 149.000đ')
    })

    it('does not duplicate price if already contained in label', () => {
      const res = formatBookingButtonLabel('Đặt phiên trải nghiệm 149.000đ', 149000, true)
      expect(res).toBe('Đặt phiên trải nghiệm 149.000đ')
    })

    it('returns raw label when showPrice is false or price is null', () => {
      expect(formatBookingButtonLabel('Đặt lịch', null, true)).toBe('Đặt lịch')
      expect(formatBookingButtonLabel('Đặt lịch', 149000, false)).toBe('Đặt lịch')
    })
  })

  describe('ExperienceBookingButton component', () => {
    it('renders link to /dat-phien-trai-nghiem?san-pham=7 and displays dynamic price', () => {
      render(<ExperienceBookingButton product={mockCoachingProduct} />)
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link).toBeDefined()
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      expect(link.textContent).toContain('Đặt phiên trải nghiệm (149.000đ)')
    })

    it('falls back to /dat-phien-trai-nghiem when no product is passed', () => {
      render(<ExperienceBookingButton product={null} />)
      const link = screen.getByRole('link', { name: /Đặt phiên trải nghiệm/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem')
    })

    it('tracks booking_clicked on click', () => {
      render(<ExperienceBookingButton product={mockCoachingProduct} pageSlug="trang-chu" />)
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      fireEvent.click(link)
      expect(analyticsModule.track).toHaveBeenCalledWith('booking_clicked', {
        productId: 7,
        slug: 'growth-mirror-phien-trai-nghiem',
        pageSlug: 'trang-chu',
      })
    })

    it('supports custom button text and respects showPrice=false', () => {
      render(
        <ExperienceBookingButton
          product={mockCoachingProduct}
          buttonText="Cần coach đồng hành 1:1"
          showPrice={false}
        />,
      )
      const link = screen.getByRole('link', { name: 'Cần coach đồng hành 1:1' })
      expect(link.textContent).toBe('Cần coach đồng hành 1:1')
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
    })
  })

  describe('BookingCTA with ExperienceBookingButton', () => {
    it('renders booking button with product id query param and tracks on click', () => {
      render(
        <BookingCTA
          title="Phiên trải nghiệm Growth Mirror"
          product={mockCoachingProduct}
          pageSlug="coaching"
        />,
      )
      const button = screen.getByRole('link', { name: 'Đặt phiên trải nghiệm' })
      expect(button.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      fireEvent.click(button)
      expect(analyticsModule.track).toHaveBeenCalledWith('booking_clicked', {
        productId: 7,
        slug: 'growth-mirror-phien-trai-nghiem',
        pageSlug: 'coaching',
      })
    })
  })

  describe('ButtonWidget with linkType=booking', () => {
    it('renders ExperienceBookingButton with resolved booking product and price', () => {
      render(
        <ButtonWidget
          text="Đặt lịch hẹn 1:1"
          linkType="booking"
          _resolved={{
            bookingProduct: mockCoachingProduct,
            bookingProductId: 7,
          }}
        />,
      )
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      expect(link.textContent).toContain('Đặt lịch hẹn 1:1 (149.000đ)')
    })
  })

  describe('CTASection with buttonAction=booking', () => {
    it('renders ExperienceBookingButton with resolved booking product and price', () => {
      render(
        <CTASection
          buttonText="Đặt phiên trải nghiệm"
          buttonAction="booking"
          _resolved={{
            bookingProduct: mockCoachingProduct,
            bookingProductId: 7,
          }}
        />,
      )
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      expect(link.textContent).toContain('149.000đ')
    })
  })

  describe('AU-04: Tô màu từng chữ trong tiêu đề (Mục 1)', () => {
    it('returns original string when text contains no asterisks', () => {
      const raw = 'CHUYỂN MÌNH KHÔNG CHÊNH VÊNH'
      const res = renderHighlightedTitle(raw)
      expect(res).toBe(raw)
    })

    it('highlights words wrapped in *...* with bright-magenta on light background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*Chuyển* mình không *Chênh* vênh')}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">Chuyển</span>`)
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">Chênh</span>`)
      expect(markup).toContain(' mình không ')
    })

    it('highlights words with soft-pink on dark background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*Chuyển* mình không *Chênh* vênh', { isDark: true })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_DARK_COLOR}">Chuyển</span>`)
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_DARK_COLOR}">Chênh</span>`)
    })

    it('leaves single or unmatched asterisks as literal text', () => {
      const single = 'Chuyển * mình không'
      const res = renderHighlightedTitle(single)
      expect(res).toBe(single)

      const odd = '*Chuyển* mình không *chênh'
      const markup = renderToStaticMarkup(<div>{renderHighlightedTitle(odd)}</div>)
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">Chuyển</span>`)
      expect(markup).toContain(' mình không *chênh')
    })

    it('integrates with TwoToneTitle seamlessly', () => {
      const markup = renderToStaticMarkup(
        <TwoToneTitle
          line1="*Chuyển* mình"
          line2="không *chênh* vênh"
          line1ClassName="text-deep-navy"
          line2ClassName="text-bright-magenta"
        />,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">Chuyển</span>`)
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">chênh</span>`)
    })

    it('integrates with SectionHeader seamlessly and preserves HTML when no asterisks', () => {
      const withAsterisks = renderToStaticMarkup(
        <SectionHeader titleLine1="*Chuyển* mình" titleLine2="không *chênh* vênh" />,
      )
      expect(withAsterisks).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">Chuyển</span>`)

      const withoutAsterisks = renderToStaticMarkup(
        <SectionHeader titleLine1="Chuyển mình" titleLine2="không chênh vênh" />,
      )
      expect(withoutAsterisks).not.toContain('<span class="text-bright-magenta">')
      expect(withoutAsterisks).toContain('<span class="block text-deep-navy">Chuyển mình</span>')
    })

    it('returns non-string inputs (e.g. inline-edited React elements) untouched', () => {
      const el = <span>*Chuyển* mình</span>
      expect(renderHighlightedTitle(el)).toBe(el)
      expect(renderHighlightedTitle(null)).toBeNull()
      expect(renderHighlightedTitle(undefined)).toBeUndefined()
    })

    it('strips *...* markers for accessible labels and returns undefined for React elements', () => {
      expect(stripTitleHighlight('*Khoảnh khắc* Me *Time*')).toBe('Khoảnh khắc Me Time')
      expect(stripTitleHighlight('Tiêu đề thường')).toBe('Tiêu đề thường')
      expect(stripTitleHighlight(<span>Inline</span>)).toBeUndefined()
    })
  })

  describe('AU-04: Nhãn "Free" ở menu & submenu (Mục 2)', () => {
    it('renders chip with soft-pink background and bright-magenta text', () => {
      const markup = renderToStaticMarkup(<NavBadge badge="Free" />)
      expect(markup).toContain('Free')
      expect(markup).toContain('bg-soft-pink')
      expect(markup).toContain('text-bright-magenta')
      expect(markup).toContain('aria-label="Nhãn: Free"')
    })

    it('returns null when badge is undefined or whitespace', () => {
      expect(renderToStaticMarkup(<NavBadge />)).toBe('')
      expect(renderToStaticMarkup(<NavBadge badge="" />)).toBe('')
      expect(renderToStaticMarkup(<NavBadge badge="   " />)).toBe('')
    })

    it('renders badge in Navbar items', () => {
      render(
        <Navbar
          cta={{ label: 'Trải nghiệm', href: '/trai-nghiem' }}
          items={[
            { label: 'Check-in cảm xúc', href: '/habit', badge: 'Free' },
            { label: 'Về Hana', href: '/ve-hana' },
          ]}
        />,
      )
      const badge = screen.getAllByLabelText('Nhãn: Free')
      expect(badge.length).toBeGreaterThanOrEqual(1)
      expect(badge[0].textContent).toBe('Free')
    })

    it('exports up and down functions in migration', () => {
      expect(typeof navBadgeMigration.up).toBe('function')
      expect(typeof navBadgeMigration.down).toBe('function')
    })
  })

  describe('AU-04: Form Tham gia & Nhận brochure (Mục 3)', () => {
    describe('registrationFormSchema validation', () => {
      it('validates correct community registration data', () => {
        const result = registrationFormSchema.safeParse({
          name: 'Học viên Test 01',
          email: 'test@example.com',
          phone: '0901234567',
          formType: 'community-me-time',
          consent: true,
        })
        expect(result.success).toBe(true)
      })

      it('rejects missing phone with Vietnamese error', () => {
        const result = registrationFormSchema.safeParse({
          name: 'Học viên Test 01',
          email: 'test@example.com',
          phone: '',
          formType: 'community-me-time',
          consent: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const phoneError = result.error.errors.find((e) => e.path.includes('phone'))
          expect(phoneError?.message).toBe(viStrings.forms.validation.phoneRequired)
        }
      })

      it('rejects invalid phone with Vietnamese error', () => {
        const result = registrationFormSchema.safeParse({
          name: 'Học viên Test 01',
          email: 'test@example.com',
          phone: '12345',
          formType: 'community-me-time',
          consent: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const phoneError = result.error.errors.find((e) => e.path.includes('phone'))
          expect(phoneError?.message).toBe(viStrings.forms.validation.phoneInvalid)
        }
      })

      it('accepts various valid Vietnamese phone formats', () => {
        const formats = ['0901234567', '+84901234567', '0912 345 678', '098-765-4321']
        for (const phone of formats) {
          const result = registrationFormSchema.safeParse({
            name: 'Học viên Test 01',
            email: 'test@example.com',
            phone,
            formType: 'community-me-time',
            consent: true,
          })
          expect(result.success).toBe(true)
        }
      })

      it('rejects unconsented submission with Vietnamese error', () => {
        const result = registrationFormSchema.safeParse({
          name: 'Học viên Test 01',
          email: 'test@example.com',
          phone: '0901234567',
          formType: 'community-me-time',
          consent: false,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const consentError = result.error.errors.find((e) => e.path.includes('consent'))
          expect(consentError?.message).toBe(viStrings.forms.validation.consentRequired)
        }
      })

      it('requires name for community forms but allows optional for brochure', () => {
        const communityResult = registrationFormSchema.safeParse({
          name: '',
          email: 'test@example.com',
          phone: '0901234567',
          formType: 'community-me-time',
          consent: true,
        })
        expect(communityResult.success).toBe(false)
        if (!communityResult.success) {
          const nameError = communityResult.error.errors.find((e) => e.path.includes('name'))
          expect(nameError?.message).toBe(viStrings.forms.validation.nameRequired)
        }

        const brochureResult = registrationFormSchema.safeParse({
          email: 'test@example.com',
          phone: '0901234567',
          formType: 'brochure-chuyen-minh',
          consent: true,
        })
        expect(brochureResult.success).toBe(true)
      })
    })

    describe('submitRegistrationLead server logic', () => {
      it('creates lead with correct source, interestTags, and consent info', async () => {
        const mockCreate = vi.fn().mockResolvedValue({ id: 99 })
        const mockPayload = {
          create: mockCreate,
          count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
          delete: vi.fn().mockResolvedValue({}),
          findGlobal: vi.fn().mockResolvedValue({ email: 'hana@tramdungcamxuc.com' }),
        } as unknown as Payload

        const mockSender = { send: vi.fn().mockResolvedValue({ success: true }) }

        const result = await submitRegistrationLead(
          {
            name: 'Học viên Test 01',
            email: 'test@example.com',
            phone: '0901234567',
            formType: 'community-me-time',
            consent: true,
          },
          { ip: '127.0.0.1', page: '/cong-dong' },
          { payload: mockPayload, emailSender: mockSender },
        )

        expect(result.success).toBe(true)
        expect(result.id).toBe(99)
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            collection: 'leads',
            data: expect.objectContaining({
              name: 'Học viên Test 01',
              email: 'test@example.com',
              phone: '0901234567',
              consent: true,
              source: expect.objectContaining({
                form: 'community-me-time',
                page: '/cong-dong',
              }),
              interestTags: [{ text: 'community' }, { text: 'me-time' }],
            }),
            overrideAccess: true,
          }),
        )
      })
    })

    describe('CTASection integration with RegistrationModal', () => {
      it('opens modal when button with buttonAction=form is clicked in solid variant', () => {
        render(
          <CTASection
            variant="solid"
            buttonText="Tham gia Me Time"
            buttonAction="form"
            formType="community-me-time"
            formSuccessMessage="[MẪU] Cảm ơn bạn, Trạm sẽ liên hệ qua Zalo sớm."
          />,
        )

        const button = screen.getByRole('button', { name: 'Tham gia Me Time' })
        fireEvent.click(button)

        expect(screen.getByRole('dialog')).toBeDefined()
        expect(screen.getByRole('heading', { name: 'Tham gia ME TIME' })).toBeDefined()
        expect(screen.getByLabelText(/Họ và tên/)).toBeDefined()
        expect(screen.getByLabelText(/Số điện thoại/)).toBeDefined()
        expect(screen.getByLabelText(/Email/)).toBeDefined()
      })
    })
  })
})
