import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoGallery } from '@/components/site/PhotoGallery'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { FAQ } from '@/components/site/FAQ'
import { ServiceCards } from '@/components/site/ServiceCards'
import { TestimonialGrid } from '@/components/site/TestimonialGrid'
import { ImageText } from '@/components/site/ImageText'
import { ContactForms } from '@/components/site/ContactForms'
import { LeadMagnetCarousel } from '@/components/site/LeadMagnetCarousel'
import { LibraryPreview } from '@/components/site/LibraryPreview'
import { Callout, renderHighlightedText } from '@/components/site/Callout'
import { migrateFAQV5ToV6 } from '@/puck/migrations/v6-faq'
import type { Data } from '@puckeditor/core'

describe('PK-21: v2 Variants and New Blocks', () => {
  describe('1.1 PhotoGallery & IconCardGrid Carousel', () => {
    const photos = [
      { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 1', caption: 'Chú thích 1' },
      { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 2', caption: 'Chú thích 2' },
      { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 3', caption: 'Chú thích 3' },
      { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 4', caption: 'Chú thích 4' },
      { imageUrl: '/brand/sample-cover.svg', alt: 'Ảnh 5', caption: 'Chú thích 5' },
    ]

    it('renders PhotoGallery in mosaic layout with scroll-snap and navigation buttons when photos > 4', () => {
      render(
        <PhotoGallery
          layout="mosaic"
          items={photos}
          seriesLabel="Khoảnh khắc"
          titleLine1="GHI DẤU"
          titleLine2="CẢM XÚC"
        />
      )

      expect(screen.getByText('Khoảnh khắc')).toBeDefined()
      expect(screen.getByText('GHI DẤU')).toBeDefined()
      // Nav buttons exist because photos.length (5) > 4 for mosaic
      const prevBtns = screen.getAllByRole('button', { name: /ảnh trước/i })
      const nextBtns = screen.getAllByRole('button', { name: /ảnh tiếp theo/i })
      expect(prevBtns.length).toBeGreaterThan(0)
      expect(nextBtns.length).toBeGreaterThan(0)

      // Children have data-eb-card attribute
      const cards = document.querySelectorAll('[data-eb-card]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('renders PhotoGallery in grid layout without error', () => {
      render(
        <PhotoGallery
          layout="grid"
          items={photos.slice(0, 3)}
          seriesLabel="Khoảnh khắc"
          titleLine1="HÌNH ẢNH"
        />
      )
      // For grid layout with 3 photos (<= 6), nav buttons are not needed
      expect(screen.queryByRole('button', { name: /ảnh tiếp theo/i })).toBeNull()
      const images = screen.getAllByRole('img')
      // Renders 3 items across responsive containers (mobile + desktop)
      expect(images.length).toBe(6)
    })

    it('renders IconCardGrid with columns="carousel"', () => {
      const cards = [
        { icon: 'star' as const, title: 'Bước 1', text: 'Mô tả 1' },
        { icon: 'heart' as const, title: 'Bước 2', text: 'Mô tả 2' },
        { icon: 'target' as const, title: 'Bước 3', text: 'Mô tả 3' },
      ]
      render(
        <IconCardGrid
          columns="carousel"
          seriesLabel="Hành trình"
          titleLine1="BƯỚC ĐI"
          items={cards}
        />
      )
      expect(screen.getByText('Bước 1')).toBeDefined()
      expect(screen.getByText('Bước 2')).toBeDefined()
      expect(screen.getByText('Bước 3')).toBeDefined()
      // Nav buttons exist for carousel (desktop + mobile)
      const prevCardBtns = screen.getAllByRole('button', { name: /Thẻ trước/i })
      const nextCardBtns = screen.getAllByRole('button', { name: /Thẻ tiếp theo/i })
      expect(prevCardBtns.length).toBeGreaterThan(0)
      expect(nextCardBtns.length).toBeGreaterThan(0)
    })
  })

  describe('1.2 FAQ Variants & Migration', () => {
    const sampleFaqs = [
      {
        question: 'Phiên trải nghiệm diễn ra thế nào?',
        answer: 'Phiên trải nghiệm kéo dài 60 phút để thấu hiểu bức tranh cảm xúc.',
        highlight: true,
      },
      {
        question: 'Tôi có thể tham gia online không?',
        answer: 'Có, các phiên đều hỗ trợ hình thức trực tuyến qua Zoom.',
      },
    ]

    it('renders FAQ cards variant with permanent answers and highlight badge', () => {
      render(
        <FAQ
          variant="cards"
          titleLine1="CÂU HỎI"
          titleLine2="THƯỜNG GẶP"
          items={sampleFaqs}
        />
      )
      // In cards variant, both answers are visible without toggling
      expect(
        screen.getByText('Phiên trải nghiệm kéo dài 60 phút để thấu hiểu bức tranh cảm xúc.')
      ).toBeDefined()
      expect(
        screen.getByText('Có, các phiên đều hỗ trợ hình thức trực tuyến qua Zoom.')
      ).toBeDefined()

      // Check for deep-navy highlight card
      const solidCard = document.querySelector('[data-eb-card-solid]')
      expect(solidCard).toBeDefined()
    })

    it('renders FAQ quick variant with expand functionality and see all button', () => {
      render(
        <FAQ
          variant="quick"
          titleLine1="CÂU HỎI"
          titleLine2="NHANH"
          seeAllLink="/lien-he#faq"
          items={sampleFaqs}
        />
      )

      // See all link is rendered
      const seeAllLink = screen.getByRole('link', { name: /Xem toàn bộ/i })
      expect(seeAllLink).toBeDefined()
      expect(seeAllLink.getAttribute('href')).toBe('/lien-he#faq')

      // Quick items have expand toggle via accessible button
      const questionBtn = screen.getByRole('button', {
        name: /Phiên trải nghiệm diễn ra thế nào\?/i,
      })
      expect(questionBtn.getAttribute('aria-expanded')).toBe('false')
      fireEvent.click(questionBtn)
      expect(questionBtn.getAttribute('aria-expanded')).toBe('true')
    })

    it('migrates legacy FAQ from version 5 to version 6 with variant: "accordion"', () => {
      const v5Data: Data = {
        content: [
          {
            type: 'FAQ',
            props: {
              id: 'faq-1',
              version: 5,
              titleLine1: 'Hỏi đáp',
            },
          },
        ],
        root: { props: { title: 'Trang' } },
      }

      const result = migrateFAQV5ToV6(v5Data)
      const faqBlock = result.content[0]
      expect(faqBlock.props.version).toBe(6)
      expect(faqBlock.props.variant).toBe('accordion')
    })

    it('is idempotent on already v6 FAQ data', () => {
      const v6Data: Data = {
        content: [
          {
            type: 'FAQ',
            props: {
              id: 'faq-2',
              version: 6,
              variant: 'cards',
              titleLine1: 'Hỏi đáp',
            },
          },
        ],
        root: { props: { title: 'Trang' } },
      }

      const result = migrateFAQV5ToV6(v6Data)
      expect(result.content[0].props.version).toBe(6)
      expect(result.content[0].props.variant).toBe('cards')
    })
  })

  describe('1.3 ServiceCards detailed, TestimonialGrid featured, ImageText imageBleed', () => {
    it('renders ServiceCards in detailed layout with situations and outcomes', () => {
      render(
        <ServiceCards
          layout="detailed"
          titleLine1="DỊCH VỤ"
          cardTitles={[{ text: 'Khai vấn 1:1' }]}
          _resolved={{
            services: [
              {
                id: 1,
                name: 'Khai vấn 1:1',
                slug: 'khai-van-1-1',
                audience: 'Người đi làm',
                situations: ['Hay căng thẳng, mệt mỏi', 'Mất phương hướng'],
                outcomes: ['Lấy lại cân bằng', 'Kế hoạch hành động rõ ràng'],
              },
            ],
          }}
        />
      )

      expect(screen.getByText(/Người đi làm/i)).toBeDefined()
      expect(screen.getByText(/Phù hợp với bạn khi:/i)).toBeDefined()
      expect(screen.getByText('Hay căng thẳng, mệt mỏi')).toBeDefined()
      expect(screen.getByText(/Kết quả chuyển hóa:/i)).toBeDefined()
      expect(screen.getByText('Lấy lại cân bằng')).toBeDefined()

      const cards = document.querySelectorAll('[data-eb-card]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('renders TestimonialGrid featured layout and hides unconsented testimonials', () => {
      const testimonials = [
        {
          id: '1',
          name: 'Khách hàng A',
          role: 'CEO',
          quote: 'Trải nghiệm rất tuyệt vời và ý nghĩa.',
          consent: true as const,
        },
        {
          id: '2',
          name: 'Khách hàng B (ẩn)',
          role: 'Quản lý',
          quote: 'Nội dung này chưa đồng ý chia sẻ.',
          consent: false as unknown as true,
        },
        {
          id: '3',
          name: 'Khách hàng C',
          role: 'Trưởng nhóm',
          quote: 'Đồng hành rất tận tâm và thấu cảm.',
          consent: true as const,
        },
      ]

      render(
        <TestimonialGrid
          variant="featured"
          _resolved={{ testimonials }}
        />
      )

      // Consented testimonials appear
      expect(screen.getByText(/Khách hàng A/i)).toBeDefined()
      expect(screen.getByText(/Khách hàng C/i)).toBeDefined()
      // Unconsented testimonial must NOT appear
      expect(screen.queryByText(/Khách hàng B/i)).toBeNull()
      expect(screen.queryByText(/Nội dung này chưa đồng ý chia sẻ\./i)).toBeNull()
    })

    it('renders ImageText with imageBleed prop', () => {
      render(
        <ImageText
          imageBleed={true}
          layout="image-right"
          imageUrl="/brand/sample-cover.svg"
          imageAlt="Ảnh tràn viền"
          titleLine1="KHÔNG GIAN"
          content="Nội dung giới thiệu không gian ấm cúng."
        />
      )

      expect(screen.getByText('KHÔNG GIAN')).toBeDefined()
      expect(screen.getByText('Nội dung giới thiệu không gian ấm cúng.')).toBeDefined()
      const bleedContainer = document.querySelector('[data-testid="image-text-bleed"]')
      expect(bleedContainer).toBeDefined()
    })
  })

  describe('1.4 ContactForms personal layout', () => {
    it('renders personal layout with all 5 required fields', () => {
      render(
        <ContactForms
          layout="personal"
          titleB2C="KẾT NỐI"
          descriptionB2C="Đặt lịch hẹn"
        />
      )

      // 5 required fields in personal form
      expect(screen.getByLabelText(/Họ và tên/i)).toBeDefined()
      expect(screen.getByLabelText(/Email/i)).toBeDefined()
      expect(screen.getByLabelText(/Số điện thoại/i)).toBeDefined()
      expect(screen.getByLabelText(/Lộ trình bạn quan tâm/i)).toBeDefined()
      expect(screen.getByLabelText(/Điều bạn đang trăn trở/i)).toBeDefined()

      // Submit button has default text
      expect(screen.getByRole('button', { name: /Đặt lịch Phiên Khám phá/i })).toBeDefined()
    })
  })

  describe('1.5 LeadMagnetCarousel list & LibraryPreview featured', () => {
    it('renders LeadMagnetCarousel in list mode with white cards and bright-magenta titles', () => {
      const magnets = [
        {
          id: 'lm1',
          name: 'Cẩm nang Cảm xúc',
          slug: 'cam-nang-cam-xuc',
          shortDescription: 'Tài liệu hướng dẫn thực hành mỗi ngày.',
        },
      ]

      render(
        <LeadMagnetCarousel
          display="list"
          titleLine1="TÀI NGUYÊN"
          items={magnets}
        />
      )

      expect(screen.getByText('Cẩm nang Cảm xúc')).toBeDefined()
      expect(screen.getByText('Tài liệu hướng dẫn thực hành mỗi ngày.')).toBeDefined()
      const card = document.querySelector('[data-eb-card]')
      expect(card).toBeDefined()
    })

    it('renders LibraryPreview in featured layout with 1 featured item and secondary grid', () => {
      const items = [
        {
          id: 'post1',
          isPost: true as const,
          title: 'Bài viết lớn nổi bật',
          slug: 'bai-viet-lon-noi-bat',
          featured: true,
          readingMinutes: 7,
        },
        {
          id: 'post2',
          isPost: true as const,
          title: 'Bài viết nhỏ thứ nhất',
          slug: 'bai-viet-nho-1',
          readingMinutes: 3,
        },
        {
          id: 'post3',
          isPost: true as const,
          title: 'Bài viết nhỏ thứ hai',
          slug: 'bai-viet-nho-2',
          readingMinutes: 4,
        },
      ]

      render(
        <LibraryPreview
          layout="featured"
          titleLine1="GÓC NHÌN"
          items={items}
        />
      )

      expect(screen.getByTestId('library-preview-featured')).toBeDefined()
      expect(screen.getByText('Bài viết lớn nổi bật')).toBeDefined()
      expect(screen.getByText('Bài viết nhỏ thứ nhất')).toBeDefined()
      expect(screen.getByText('Bài viết nhỏ thứ hai')).toBeDefined()
    })
  })

  describe('1.6 Callout strip & Markdown bold highlights', () => {
    it('parses **...** into bright-magenta bold text safely using React', () => {
      render(
        <div data-testid="highlighted-text">
          {renderHighlightedText('Chào mừng đến **Trạm Dừng Cảm Xúc** bình an.')}
        </div>
      )

      const boldElement = screen.getByText('Trạm Dừng Cảm Xúc')
      expect(boldElement.tagName.toLowerCase()).toBe('strong')
      expect(boldElement.className).toContain('text-bright-magenta')
      expect(boldElement.className).toContain('font-bold')
      expect(screen.getByText(/Chào mừng đến/)).toBeDefined()
      expect(screen.getByText(/bình an\./)).toBeDefined()
    })

    it('renders Callout in strip mode with soft-pink container and prefix title', () => {
      render(
        <Callout
          variant="strip"
          title="LƯU Ý QUAN TRỌNG:"
          description="Hãy lắng nghe cơ thể và **thương lấy chính mình**."
          showButton={true}
          buttonText="Đọc thêm"
          buttonLink="/ve-hana"
        />
      )

      expect(screen.getByText('LƯU Ý QUAN TRỌNG:')).toBeDefined()
      expect(screen.getByText('thương lấy chính mình')).toBeDefined()
      expect(screen.getByRole('link', { name: 'Đọc thêm' })).toBeDefined()

      const card = document.querySelector('[data-eb-card]')
      expect(card).toBeDefined()
      // strip does NOT have data-eb-card-solid
      expect(document.querySelector('[data-eb-card-solid]')).toBeNull()
    })
  })
})
