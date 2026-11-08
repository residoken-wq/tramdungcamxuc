import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { HeroImage } from '@/components/site/HeroImage'
import { IconCard } from '@/components/site/IconCard'
import { ImageText } from '@/components/site/ImageText'
import { CTASection } from '@/components/site/CTASection'
import { communityTemplate } from '@/puck/templates/community'

describe('CD-01: Trang Cộng đồng của Trạm (Slide 47–57)', () => {
  describe('Khối cũ backward-compatible với các field mới', () => {
    it('HeroImage: mặc định seriesLabelFont=ui và emotionFont=quote', () => {
      const { container } = render(
        <HeroImage
          id="hero-test"
          seriesLabel="Nhãn series"
          titleLine1="Tiêu đề chính"
          titleLine2=""
          emotionLine="Dòng cảm xúc"
        />,
      )
      const label = screen.getByText('Nhãn series')
      expect(label.className).toContain('font-ui')
      expect(label.className).not.toContain('font-quote')

      const emotion = screen.getByText('Dòng cảm xúc')
      expect(emotion.className).toContain('font-quote')
      expect(emotion.className).toContain('italic')
    })

    it('HeroImage: hỗ trợ seriesLabelFont=quote và emotionFont=body khi được truyền', () => {
      const { container } = render(
        <HeroImage
          id="hero-test-quote"
          seriesLabel="Nhãn câu trích"
          seriesLabelFont="quote"
          titleLine1="Tiêu đề chính"
          titleLine2=""
          emotionLine="Đoạn văn mô tả trắng"
          emotionFont="body"
        />,
      )
      const label = screen.getByText('Nhãn câu trích')
      expect(label.className).toContain('font-quote')
      expect(label.className).toContain('italic')

      const emotion = screen.getByText('Đoạn văn mô tả trắng')
      expect(emotion.className).toContain('font-body')
      expect(emotion.className).not.toContain('font-quote')
    })

    it('IconCard: mặc định không có divider, link và highlight coming-soon', () => {
      const { container } = render(
        <IconCard id="card-test-default" title="Thẻ mẫu" text="Mô tả thẻ mẫu" />,
      )
      expect(screen.getByText('Thẻ mẫu')).toBeDefined()
      expect(container.querySelector('[aria-hidden="true"].border-b')).toBeNull()
      expect(container.querySelector('a')).toBeNull()
    })

    it('IconCard: hỗ trợ coming-soon highlight, showDivider, linkText, subtitleColor', () => {
      const { container } = render(
        <IconCard
          id="card-test-custom"
          title="Thẻ mới"
          titleFont="display"
          subtitle="Tiêu đề phụ"
          subtitleColor="bright-magenta"
          showDivider={true}
          linkText="Khám phá →"
          linkHref="#me-time"
        />,
      )

      const title = screen.getByText('Thẻ mới')
      expect(title.className).toContain('font-display')

      const subtitle = screen.getByText('Tiêu đề phụ')
      expect(subtitle.className).toContain('text-bright-magenta')

      expect(container.querySelector('[aria-hidden="true"].border-b')).not.toBeNull()

      const link = screen.getByRole('link', { name: 'Khám phá →' })
      expect(link.getAttribute('href')).toBe('#me-time')

      const { container: csContainer } = render(
        <IconCard
          id="card-test-coming-soon"
          title="Sắp ra mắt"
          highlight="coming-soon"
          linkText="Khám phá →"
          linkHref="#me-time"
        />,
      )
      const csCard = csContainer.querySelector('[data-eb-card]')
      expect(csCard?.className).toContain('#F5F3EF')
      expect(csContainer.querySelector('a')).toBeNull()
    })

    it('CTASection: mặc định variant=card, hỗ trợ variant=solid trên nền deep-navy', () => {
      const { container: cardContainer } = render(
        <CTASection
          id="cta-default"
          titleLine1="Kêu gọi"
          description="Mô tả"
          buttonText="Bấm"
        />,
      )
      expect(cardContainer.querySelector('[data-cta-solid]')).toBeNull()

      const { container: solidContainer } = render(
        <CTASection
          id="cta-solid"
          variant="solid"
          bgColor="deep-navy"
          titleLine1="BẮT ĐẦU TỪ MỘT BƯỚC NHỎ"
          emotionLine="Dòng cảm xúc"
          buttonText="THAM GIA ME TIME"
          buttonVariant="magenta"
          secondaryButtonText="THAM GIA YOGA BUDDY"
          secondaryButtonVariant="pink"
        />,
      )
      const solidSection = solidContainer.querySelector('[data-cta-solid]')
      expect(solidSection).not.toBeNull()
      expect(screen.getByText('BẮT ĐẦU TỪ MỘT BƯỚC NHỎ')).toBeDefined()
      expect(screen.getByText('THAM GIA ME TIME')).toBeDefined()
      expect(screen.getByText('THAM GIA YOGA BUDDY')).toBeDefined()
    })
  })

  describe('Mẫu community (Trang Cộng đồng)', () => {
    it('chứa đúng 10 section theo thứ tự slide 48–57', () => {
      expect(communityTemplate.content).toHaveLength(10)

      const expectedTypes = [
        'HeroImage', // Slide 48 (§5.1)
        'IconCardGrid', // Slide 49 (§5.2)
        'ImageText', // Slide 50 (§5.3)
        'IconCardGrid', // Slide 51 (§5.4)
        'TestimonialGrid', // Slide 52 (§5.5)
        'PhotoGallery', // Slide 53 (§5.6)
        'ImageText', // Slide 54 (§5.7)
        'Columns', // Slide 55 (§5.8)
        'PhotoGallery', // Slide 56 (§5.9)
        'CTASection', // Slide 57 (§5.10)
      ]

      const actualTypes = communityTemplate.content.map((item) => item.type)
      expect(actualTypes).toEqual(expectedTypes)
    })

    it('mọi khối có trong puckConfig và render qua Render không ném lỗi', () => {
      expect(() => {
        render(
          <Render
            config={puckConfig}
            data={communityTemplate}
          />,
        )
      }).not.toThrow()
    })

    it('chữ khớp tài liệu nội dung §5 ở các tiêu đề chính', () => {
      render(
        <Render
          config={puckConfig}
          data={communityTemplate}
        />,
      )

      // Slide 48: Hero
      expect(screen.getAllByText(/Cộng đồng của Trạm/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Không gian an toàn để thuộc về/i).length).toBeGreaterThan(0)

      // Slide 49: Chọn không gian
      expect(screen.getByText('CHỌN KHÔNG GIAN CỦA BẠN')).toBeDefined()
      expect(screen.getByText('Tự nguyện đến. Tôn trọng nhịp riêng.')).toBeDefined()
      expect(screen.getAllByText('ME TIME').length).toBeGreaterThan(0)
      expect(screen.getAllByText('YOGA BUDDY').length).toBeGreaterThan(0)
      expect(screen.getByText('COMING SOON')).toBeDefined()

      // Slide 50: Me Time
      expect(screen.getAllByText(/Thương mình theo cách riêng/i).length).toBeGreaterThan(0)

      // Slide 51: Lịch trình 5:00 AM
      expect(screen.getByText('LỊCH TRÌNH 5:00 AM')).toBeDefined()

      // Slide 52: Tiếng nói từ Me Time (trong template prop vì public page ẩn grid khi CMS chưa có testimonial)
      const testimonialBlock = communityTemplate.content.find(
        (b) => b.props.id === 'community-testimonials-me-time',
      )
      expect(testimonialBlock?.props.titleLine1).toBe('TIẾNG NÓI CỘNG ĐỒNG ME TIME')

      // Slide 53: Khoảnh khắc Me Time
      expect(screen.getAllByText(/KHOẢNH KHẮC ME TIME/i).length).toBeGreaterThan(0)

      // Slide 54: Yoga Buddy
      expect(screen.getAllByText(/Mỗi lần trải thảm là một lần chăm sóc Thân - Tâm/i).length).toBeGreaterThan(0)

      // Slide 55: Cuộc hẹn 8:30 sáng
      expect(screen.getAllByText(/CUỘC HẸN 8:30 SÁNG THỨ 3 & 5/i).length).toBeGreaterThan(0)

      // Slide 56: Góc nhỏ Yoga Buddy
      expect(screen.getAllByText(/GÓC NHỎ YOGA BUDDY/i).length).toBeGreaterThan(0)

      // Slide 57: CTA
      expect(screen.getByText(/TRỞ THÀNH MỘT PHẦN/i)).toBeDefined()
      expect(screen.getByText(/CỦA BỘ LẠC/i)).toBeDefined()
      expect(screen.getByText(/Tham gia Me Time/i)).toBeDefined()
      expect(screen.getByText(/Tham gia Yoga Buddy/i)).toBeDefined()
    })

    it('không chứa chữ tự đặt của mẫu PK-22', () => {
      const rawJson = JSON.stringify(communityTemplate)

      const pk22InventedPhrases = [
        'Đồng hành qua các chặng',
        '1.000+',
        'Mỗi tuần một chủ đề',
        'Nhóm Zalo kín',
        'Cùng thức dậy, cùng thực hành',
        'Không phán xét, không áp lực',
        'Cùng nhau đi xa hơn',
        '30 ngày thử thách',
        'Thư viện tài liệu',
        'Hỏi đáp hàng tuần',
      ]

      for (const phrase of pk22InventedPhrases) {
        expect(rawJson).not.toContain(phrase)
      }
    })

    it('không chứa tên người thật (Đăng / Stella / Ngọc) - lấy từ CMS collection', () => {
      const rawJson = JSON.stringify(communityTemplate)
      expect(rawJson).not.toContain('Đăng')
      expect(rawJson).not.toContain('Stella')
      expect(rawJson).not.toContain('Ngọc')
    })

    it('slide 57 CTA có nền deep-navy và link 2 nút để #', () => {
      const ctaBlock = communityTemplate.content[9]
      expect(ctaBlock.type).toBe('CTASection')
      expect(ctaBlock.props.variant).toBe('solid')
      expect(ctaBlock.props.bgColor).toBe('deep-navy')
      expect(ctaBlock.props.buttonLink).toBe('#')
      expect(ctaBlock.props.secondaryButtonLink).toBe('#')
    })
  })
})

