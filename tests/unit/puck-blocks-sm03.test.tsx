import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { Callout } from '@/components/site/Callout'
import { PackageCards } from '@/components/site/PackageCards'
import { SolutionEcosystem } from '@/components/site/SolutionEcosystem'
import { CTASection } from '@/components/site/CTASection'
import { TestimonialCard } from '@/components/site/TestimonialCard'
import { TestimonialGrid } from '@/components/site/TestimonialGrid'
import { PackageComparison } from '@/components/site/PackageComparison'
import { FAQ } from '@/components/site/FAQ'
import { vi } from '@/lib/i18n/vi'
import { BOOKING_PATH } from '@/lib/products'
import { toPublicTestimonial } from '@/lib/testimonials'

describe('SM-03: Puck Blocks Unit & Snapshot Tests', () => {
  describe('Snapshots of 5 New Blocks & Variants', () => {
    it('matches snapshot for IconCardGrid with icon variant', () => {
      const { asFragment } = render(
        <IconCardGrid
          seriesLabel="Đặc điểm nổi bật"
          titleLine1="GIẢI PHÁP ĐỒNG HÀNH"
          titleLine2="TOÀN DIỆN"
          emotionLine="Dành cho từng giai đoạn phát triển của bạn."
          marker="icon"
          columns={3}
          items={[
            {
              icon: 'lotus',
              title: 'Thấu hiểu bản thân',
              text: 'Nhận diện các tầng cảm xúc và nhu cầu cốt lõi.',
            },
            {
              icon: 'compass',
              title: 'Định hướng sự nghiệp',
              text: 'Lựa chọn hướng đi phù hợp với giá trị cá nhân.',
            },
          ]}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot for IconCardGrid with number variant', () => {
      const { asFragment } = render(
        <IconCardGrid
          seriesLabel="Tiến trình"
          titleLine1="3 BƯỚC ĐỒNG HÀNH"
          titleLine2="RÕ RÀNG"
          marker="number"
          columns={3}
          items={[
            {
              title: 'Lắng nghe & Khám phá',
              text: 'Nhìn nhận bức tranh hiện tại.',
            },
            {
              title: 'Tháo gỡ & Chuyển hóa',
              text: 'Thực hành các kỹ thuật điều hòa cảm xúc.',
            },
          ]}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot for Callout with default tone', () => {
      const { asFragment } = render(
        <Callout
          bgColor="deep-navy"
          title="Không gian an toàn tuyệt đối cho cảm xúc của bạn"
          description="Mọi chia sẻ của bạn đều được lắng nghe trung tính và bảo mật hoàn toàn."
          showButton={true}
          buttonText="Đặt lịch kết nối"
          buttonLink="/coaching#booking"
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot for Callout with calm tone', () => {
      const { asFragment } = render(
        <Callout
          bgColor="lavender-mist"
          title="Dành 5 phút mỗi ngày cho chính mình"
          description="Hạnh phúc bắt đầu từ những khoảnh khắc tĩnh lặng."
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot for PackageCards', () => {
      const { asFragment } = render(
        <PackageCards
          seriesLabel="Hành trình đồng hành"
          titleLine1="3 GÓI GROWTH MIRROR"
          titleLine2="ĐỒNG HÀNH TOÀN DIỆN"
          emotionLine="Chọn lộ trình phù hợp với tốc độ của bạn."
          highlightPackageId="build"
          _resolved={{
            packages: [
              {
                id: 'clear',
                name: 'CLEAR',
                slug: 'clear',
                web: 'site',
                type: 'package',
                price: 2500000,
                salePrice: 1750000,
                saleStatus: 'on_sale',
                shortDescription: 'Nhận diện và tháo gỡ điểm nghẽn cảm xúc.',
                components: [
                  { label: 'Habit Tracker + EQ Buddy số', quantity: 1, unitValue: 500000 },
                  { label: 'Coaching 1:1', quantity: 1, unitValue: 1000000 },
                ],
              },
              {
                id: 'build',
                name: 'BUILD',
                slug: 'build',
                web: 'site',
                type: 'package',
                price: 5800000,
                salePrice: 2900000,
                saleStatus: 'on_sale',
                shortDescription: 'Xây dựng thói quen và sự vững vàng.',
                components: [
                  { label: 'Habit Tracker + EQ Buddy số', quantity: 1, unitValue: 500000 },
                  { label: 'Coaching 1:1', quantity: 3, unitValue: 1000000 },
                ],
              },
            ],
          }}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot for SolutionEcosystem with 3-pillar variant', () => {
      const { asFragment } = render(
        <SolutionEcosystem
          seriesLabel="Hệ thống giải pháp"
          titleLine1="HỆ SINH THÁI ĐỒNG HÀNH"
          titleLine2="3 TRỤ CỘT CẢM XÚC"
          _resolved={{
            services: [
              {
                id: 1,
                name: 'Tự soi chiếu',
                slug: 'tu-soi-chieu',
                audienceLabel: 'Trụ cột 1',
              },
              {
                id: 2,
                name: 'Chuyển hóa 1:1',
                slug: 'chuyen-hoa-1-1',
                audienceLabel: 'Trụ cột 2',
              },
            ],
            programs: [],
          }}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot for CTASection with default and minimal variants', () => {
      const { asFragment: asFragmentDefault } = render(
        <CTASection
          titleLine1="SẴN SÀNG CHO HÀNH TRÌNH"
          titleLine2="LÀM CHỦ CẢM XÚC?"
          emotionLine="Bắt đầu ngay hôm nay để tìm lại sự bình an nội tại."
          buttonText="Đặt phiên trải nghiệm 149.000đ"
          buttonLink="/coaching#booking"
        />,
      )
      expect(asFragmentDefault()).toMatchSnapshot()

      const { asFragment: asFragmentMinimal } = render(
        <CTASection
          titleLine1="KẾT NỐI NGAY HÔM NAY"
          buttonText="Bắt đầu ngay"
          buttonLink="/coaching"
        />,
      )
      expect(asFragmentMinimal()).toMatchSnapshot()
    })
  })

  describe('Empty CMS Data Handling (Editor Mode vs Public Page)', () => {
    it('PackageCards: renders null on public page when packages are empty', () => {
      const { container } = render(
        <PackageCards packages={[]} puck={{ isEditing: false }} _resolved={{ packages: [] }} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('PackageCards: renders placeholder in editor mode when packages are empty', () => {
      render(<PackageCards packages={[]} puck={{ isEditing: true }} _resolved={{ packages: [] }} />)
      expect(screen.getByText(vi.builder.noDataSelectInCms)).toBeTruthy()
    })

    it('SolutionEcosystem: renders null on public page when services and programs are empty', () => {
      const { container } = render(
        <SolutionEcosystem
          puck={{ isEditing: false }}
          _resolved={{ services: [], programs: [] }}
        />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('SolutionEcosystem: renders column empty notes in editor mode when columns have no items', () => {
      render(
        <SolutionEcosystem
          puck={{ isEditing: true }}
          _resolved={{ products: [], services: [], programs: [] }}
        />,
      )
      expect(screen.getByText(vi.sm03.noProductsSelected)).toBeTruthy()
      expect(screen.getByText(vi.sm03.noServicesSelected)).toBeTruthy()
      expect(screen.getByText(vi.sm03.noProgramsSelected)).toBeTruthy()
    })

    it('TestimonialGrid: renders null on public page when testimonials are empty', () => {
      const { container } = render(
        <TestimonialGrid
          puck={{ isEditing: false }}
          manualTestimonials={[]}
          _resolved={{ testimonials: [] }}
        />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('TestimonialGrid: renders placeholder in editor mode when testimonials are empty', () => {
      render(
        <TestimonialGrid
          puck={{ isEditing: true }}
          manualTestimonials={[]}
          _resolved={{ testimonials: [] }}
        />,
      )
      expect(screen.getByText(vi.builder.noDataSelectInCms)).toBeTruthy()
    })
  })

  describe('Consent Privacy Verification', () => {
    it('TestimonialCard: returns null and does not render personal details when consent is false', () => {
      const { container } = render(
        <TestimonialCard
          name="Người Thử Nghiệm"
          quote="Lời chia sẻ tuyệt mật."
          role="Giám đốc điều hành"
          age="35 tuổi"
          story={{
            before: 'Trước đây rất căng thẳng.',
            after: 'Bây giờ rất bình an.',
          }}
          photo={{ src: 'https://example.com/private.jpg', alt: 'Private photo' }}
          consent={false}
        />,
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Người Thử Nghiệm')).toBeNull()
      expect(screen.queryByText('Lời chia sẻ tuyệt mật.')).toBeNull()
      expect(screen.queryByText('Giám đốc điều hành')).toBeNull()
      expect(screen.queryByText('35 tuổi')).toBeNull()
      expect(screen.queryByText('Trước đây rất căng thẳng.')).toBeNull()
      expect(screen.queryByAltText('Private photo')).toBeNull()
    })
  })

  describe('PackageComparison: Booking Path Navigation without Direct Payment', () => {
    it('generates booking link leading to BOOKING_PATH with package query and without checkout link', () => {
      render(
        <PackageComparison
          packages={[{ packageId: 1 }]}
          showPackageButtons={true}
          packageButtonText="Đăng ký gói"
          _resolved={{
            packages: [
              {
                id: 1,
                name: 'Gói Thử Nghiệm',
                slug: 'goi-thu-nghiem',
                web: 'site',
                type: 'package',
                price: 2000000,
                salePrice: 1500000,
                saleStatus: 'on_sale',
              },
            ],
          }}
        />,
      )

      const bookingButtons = screen.getAllByRole('link', { name: /Đăng ký gói/i })
      expect(bookingButtons.length).toBeGreaterThan(0)

      for (const btn of bookingButtons) {
        const href = btn.getAttribute('href')
        expect(href).toContain(BOOKING_PATH)
        expect(href).toContain('goi=goi-thu-nghiem')
        expect(href).not.toContain('/checkout')
        expect(href).not.toContain('/thanh-toan')
      }
    })
  })

  describe('FAQ: Accessible Accordion Interactions', () => {
    it('toggles question accordion, updates aria-expanded and displays answer content', () => {
      render(
        <FAQ
          items={[
            {
              question: 'Khóa học kéo dài trong bao lâu?',
              answer: 'Khóa học kéo dài trong 4 tuần liên tục.',
            },
            {
              question: 'Tôi có được hỗ trợ 1:1 không?',
              answer: 'Có, bạn sẽ có các buổi làm việc trực tiếp cùng chuyên gia.',
            },
          ]}
        />,
      )

      const firstQuestionBtn = screen.getByRole('button', {
        name: /Khóa học kéo dài trong bao lâu\?/i,
      })
      const answerElement = screen.getByText('Khóa học kéo dài trong 4 tuần liên tục.')

      // Initially closed
      expect(firstQuestionBtn.getAttribute('aria-expanded')).toBe('false')
      expect(answerElement.hasAttribute('hidden')).toBe(true)

      // Click to open
      fireEvent.click(firstQuestionBtn)
      expect(firstQuestionBtn.getAttribute('aria-expanded')).toBe('true')
      expect(answerElement.hasAttribute('hidden')).toBe(false)

      // Click again to close
      fireEvent.click(firstQuestionBtn)
      expect(firstQuestionBtn.getAttribute('aria-expanded')).toBe('false')
      expect(answerElement.hasAttribute('hidden')).toBe(true)

      // Check aria-controls matches answer element id
      const ariaControls = firstQuestionBtn.getAttribute('aria-controls')
      expect(ariaControls).toBe(answerElement.getAttribute('id'))
    })
  })

  describe('CTASection: Real toPublicTestimonial Flow & Button Visibility', () => {
    it('renders photo evidence strip when testimonials pass through real toPublicTestimonial', () => {
      const rawDoc = {
        id: 101,
        name: 'Học viên A',
        quote: 'Trải nghiệm rất tuyệt vời.',
        consent: true,
        _status: 'published',
        photo: {
          url: '/brand/sample-avatar.svg',
          alt: 'Avatar Học viên A',
        },
      }

      const publicTestimonial = toPublicTestimonial(rawDoc)
      expect(publicTestimonial).not.toBeNull()
      expect(publicTestimonial?.consent).toBe(true)

      render(
        <CTASection
          titleLine1="BẮT ĐẦU"
          titleLine2="CHUYỂN MÌNH"
          buttonText="Đặt lịch"
          buttonLink="/dat-lich"
          proofText="500+ học viên tin tưởng"
          _resolved={{
            testimonials: [publicTestimonial!],
          }}
        />,
      )

      expect(screen.getByAltText('Avatar Học viên A')).toBeTruthy()
      expect(screen.getByText('500+ học viên tin tưởng')).toBeTruthy()
    })

    it('hides CTA button when buttonLinkType is page and _resolved buttonUrl is missing', () => {
      render(
        <CTASection
          titleLine1="BẮT ĐẦU"
          titleLine2="CHUYỂN MÌNH"
          buttonLinkType="page"
          buttonPageId="unresolved-page"
          buttonText="Đến trang đích"
          _resolved={{
            buttonUrl: '',
          }}
        />,
      )

      expect(screen.queryByRole('link', { name: /Đến trang đích/i })).toBeNull()
    })
  })
})

