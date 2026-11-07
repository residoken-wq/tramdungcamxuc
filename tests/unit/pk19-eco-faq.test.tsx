import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Data } from '@puckeditor/core'

import { applyPuckMigrations } from '@/puck/migrations'
import { SolutionEcosystem } from '@/components/site/SolutionEcosystem'
import { FAQ } from '@/components/site/FAQ'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('PK-19: SolutionEcosystem & FAQ Design Upgrades', () => {
  describe('Puck Migrations for SolutionEcosystem and FAQ', () => {
    it('migrates legacy SolutionEcosystem v1 to v2 with layout: cards and initialized fields', () => {
      const legacyData: Data = {
        content: [
          {
            type: 'SolutionEcosystem',
            props: {
              id: 'eco-1',
              version: 1,
              titleLine1: 'HỆ SINH THÁI',
              titleLine2: 'TOÀN DIỆN',
              col1Products: [{ productId: 'prod-1' }],
              col2Services: [{ serviceId: 'srv-1' }],
            },
          },
        ],
        root: { props: { title: 'Test Page' } },
      }

      const migrated = applyPuckMigrations(legacyData)
      const eco = migrated.content[0]

      expect(eco.props.version).toBe(2)
      expect(eco.props.layout).toBe('cards')
      expect(eco.props.col1Icon).toBe('')
      expect(eco.props.col1Accent).toBe('none')
      expect(eco.props.col1Groups).toEqual([])
      expect(eco.props.col2Groups).toEqual([])
      expect(eco.props.col3Groups).toEqual([])
      expect(eco.props.col1Products).toEqual([{ productId: 'prod-1' }])
    })

    it('migrates legacy FAQ v4 with aside: booking to v5 with contactBadge = "Trạm Dừng Cảm Xúc"', () => {
      const legacyData: Data = {
        content: [
          {
            type: 'FAQ',
            props: {
              id: 'faq-1',
              version: 4,
              aside: 'booking',
              bookingAsideTitle: 'Đặt phiên',
            },
          },
        ],
        root: { props: { title: 'Test Page' } },
      }

      const migrated = applyPuckMigrations(legacyData)
      const faq = migrated.content[0]

      expect(faq.props.version).toBe(5)
      expect(faq.props.contactBadge).toBe('Trạm Dừng Cảm Xúc')
      expect(faq.props.description).toBe('')
      expect(faq.props.seriesLabelStyle).toBe('text')
      expect(faq.props.iconStyle).toBe('chevron')
      expect(faq.props.contactMediaId).toBe('')
    })

    it('migrates legacy FAQ v4 with aside: none to v5 with empty contactBadge', () => {
      const legacyData: Data = {
        content: [
          {
            type: 'FAQ',
            props: {
              id: 'faq-2',
              version: 4,
              aside: 'none',
            },
          },
        ],
        root: { props: { title: 'Test Page' } },
      }

      const migrated = applyPuckMigrations(legacyData)
      const faq = migrated.content[0]

      expect(faq.props.version).toBe(5)
      expect(faq.props.contactBadge).toBe('')
    })
  })

  describe('SolutionEcosystem: Layout "groups"', () => {
    it('renders column accent bars with specified brand colors', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          titleLine2="ĐỒNG HÀNH"
          col1Title="Đào tạo cá nhân"
          col1Accent="accent-pink"
          col2Title="Khai vấn 1:1"
          col2Accent="none"
          col3Title="Doanh nghiệp"
          col3Accent="deep-navy"
          col1Groups={[
            {
              frame: 'plain',
              itemStyle: 'row',
              buttonStyle: 'outline',
              items: [{ productId: 'p1' }],
            },
          ]}
          col2Groups={[
            {
              frame: 'plain',
              itemStyle: 'card',
              buttonStyle: 'outline',
              items: [{ serviceId: 's1' }],
            },
          ]}
          col3Groups={[
            {
              frame: 'plain',
              itemStyle: 'card',
              buttonStyle: 'filled',
              items: [{ programId: 'pr1' }],
            },
          ]}
          _resolved={{
            products: [
              {
                id: 'p1',
                name: 'Habit Tracker',
                slug: 'habit-tracker',
                type: 'digital_tool',
              } as any,
            ],
            services: [{ id: 's1', name: 'Coaching 1:1', slug: 'coaching-1-1' } as any],
            programs: [{ id: 'pr1', name: 'Workshop Doanh nghiệp', slug: 'workshop' } as any],
          }}
        />,
      )

      const pinkAccent = document.querySelector('.bg-accent-pink.h-\\[6px\\]')
      const navyAccent = document.querySelector('.bg-deep-navy.h-\\[6px\\]')

      expect(pinkAccent).not.toBeNull()
      expect(navyAccent).not.toBeNull()
    })

    it('renders column icon when colNIcon is provided', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          col1Title="Cột 1"
          col1Icon="target"
          col1Groups={[
            {
              frame: 'plain',
              itemStyle: 'row',
              buttonStyle: 'outline',
              items: [{ productId: 'p1' }],
            },
          ]}
          _resolved={{
            products: [{ id: 'p1', name: 'Sản phẩm 1', slug: 'p1', type: 'digital_tool' } as any],
          }}
        />,
      )

      const iconBox = document.querySelector('.w-10.h-10.rounded-xl')
      expect(iconBox).not.toBeNull()
      expect(iconBox?.querySelector('svg')).not.toBeNull()
    })

    it('renders outlined group with badge and border', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          col1Title="Cột 1"
          col1Groups={[
            {
              badge: 'SIGNATURE PROGRAM',
              title: 'Chuyển mình không chênh vênh',
              frame: 'outlined',
              itemStyle: 'row',
              buttonStyle: 'outline',
              items: [{ productId: 'p1' }],
            },
          ]}
          _resolved={{
            products: [
              {
                id: 'p1',
                name: 'CLEAR',
                slug: 'clear',
                type: 'package',
                tagline: 'Định hình nội tại',
              } as any,
            ],
          }}
        />,
      )

      expect(screen.getByText('SIGNATURE PROGRAM')).toBeDefined()
      expect(screen.getByText('Chuyển mình không chênh vênh')).toBeDefined()

      const outlinedContainer = document.querySelector('.border-accent-pink')
      expect(outlinedContainer).not.toBeNull()
      // Outlined frame uses rounded-full marker
      const marker = outlinedContainer?.querySelector('.rounded-full.bg-accent-pink')
      expect(marker).not.toBeNull()
    })

    it('renders row item with bold "Name:", tagline/desc, and buttonStyle outline/filled', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          col1Title="Cột 1"
          col1Groups={[
            {
              frame: 'plain',
              itemStyle: 'row',
              buttonStyle: 'outline',
              items: [{ productId: 'p1' }],
            },
            {
              frame: 'plain',
              itemStyle: 'row',
              buttonStyle: 'filled',
              items: [{ productId: 'p2' }],
            },
          ]}
          _resolved={{
            products: [
              {
                id: 'p1',
                name: 'CLEAR',
                slug: 'clear',
                type: 'package',
                saleStatus: 'on_sale',
                tagline: 'Định hình góc nhìn',
              } as any,
              {
                id: 'p2',
                name: 'BUILD',
                slug: 'build',
                type: 'package',
                saleStatus: 'on_sale',
                shortDescription: 'Xây dựng thói quen',
              } as any,
            ],
          }}
        />,
      )

      expect(screen.getByText('CLEAR:')).toBeDefined()
      expect(screen.getByText('Định hình góc nhìn')).toBeDefined()
      expect(screen.getByText('BUILD:')).toBeDefined()
      expect(screen.getByText('Xây dựng thói quen')).toBeDefined()

      // Outline button has border-bright-magenta
      const outlineBtn = document.querySelector('.border-bright-magenta')
      expect(outlineBtn).not.toBeNull()

      // Filled button has bg-accent-pink
      const filledBtn = document.querySelector('a.bg-accent-pink')
      expect(filledBtn).not.toBeNull()
    })

    it('renders card item with heading and centered button', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          col2Title="Khai vấn 1:1"
          col2Groups={[
            {
              frame: 'plain',
              itemStyle: 'card',
              buttonStyle: 'outline',
              items: [
                {
                  serviceId: 's1',
                  heading: '1. Dành cho Chuyên gia / Cá nhân chuyển nghề',
                  buttonText: 'Khám phá ngay',
                },
              ],
            },
          ]}
          _resolved={{
            services: [
              {
                id: 's1',
                name: 'Growth Mirror',
                slug: 'growth-mirror',
                audienceLabel: 'Đồng hành cá nhân',
              } as any,
            ],
          }}
        />,
      )

      expect(screen.getByText('1. Dành cho Chuyên gia / Cá nhân chuyển nghề')).toBeDefined()
      expect(screen.getByText('Growth Mirror:')).toBeDefined()
      expect(screen.getByText('Đồng hành cá nhân')).toBeDefined()
      // Overridden buttonText
      expect(screen.getByRole('link', { name: 'Khám phá ngay' })).toBeDefined()
    })

    it('buttonText prop overrides CMS ctaLabel', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          col1Title="Cột 1"
          col1Groups={[
            {
              frame: 'plain',
              itemStyle: 'row',
              buttonStyle: 'outline',
              items: [{ productId: 'p1', buttonText: 'Đặt ngay hôm nay' }],
            },
          ]}
          _resolved={{
            products: [
              {
                id: 'p1',
                name: 'Habit Tracker',
                slug: 'habit',
                type: 'digital_tool',
                saleStatus: 'on_sale',
                ctaLabel: 'Mua',
              } as any,
            ],
          }}
        />,
      )

      expect(screen.getByRole('link', { name: 'Đặt ngay hôm nay' })).toBeDefined()
      expect(screen.queryByRole('link', { name: 'Mua' })).toBeNull()
    })

    it('falls back to existing products when colNGroups is empty in groups layout', () => {
      render(
        <SolutionEcosystem
          layout="groups"
          titleLine1="HỆ SINH THÁI"
          col1Title="Đào tạo cá nhân"
          col1Products={[{ productId: 'p-old' }]}
          col1Groups={[]}
          _resolved={{
            products: [
              {
                id: 'p-old',
                name: 'Công cụ số 21 ngày',
                slug: 'tool-21',
                type: 'digital_tool',
                saleStatus: 'on_sale',
                tagline: 'Thực hành',
              } as any,
            ],
          }}
        />,
      )

      // Fallback renders the old product as a card
      expect(screen.getByText('Công cụ số 21 ngày:')).toBeDefined()
      expect(screen.getByText('Thực hành')).toBeDefined()
    })
  })

  describe('FAQ: Description, Pill Series Label, Contact Aside, and PlusMinus Icon', () => {
    it('renders description paragraph under heading', () => {
      render(
        <FAQ
          titleLine1="CÂU HỎI"
          titleLine2="THƯỜNG GẶP"
          description="Dưới đây là những giải đáp tận tâm cho mọi thắc mắc của bạn."
          items={[{ question: 'Q1', answer: 'A1' }]}
        />,
      )

      expect(
        screen.getByText('Dưới đây là những giải đáp tận tâm cho mọi thắc mắc của bạn.'),
      ).toBeDefined()
    })

    it('renders seriesLabel with pill style when seriesLabelStyle="pill"', () => {
      render(
        <FAQ
          seriesLabel="FAQS"
          seriesLabelStyle="pill"
          titleLine1="CÂU HỎI"
          titleLine2="THƯỜNG GẶP"
          items={[{ question: 'Q1', answer: 'A1' }]}
        />,
      )

      const pill = screen.getByText('FAQS')
      expect(pill.className).toContain('rounded-full')
      expect(pill.className).toContain('border-[1.5px]')
      expect(pill.className).toContain('border-accent-pink')
      expect(pill.className).toContain('text-bright-magenta')
    })

    it('renders contact aside with avatar image (with alt), centered not-full-width button, and "Hoặc email:"', () => {
      render(
        <FAQ
          aside="contact"
          contactBadge="Tư vấn 1:1"
          contactImageUrl="/brand/hana-avatar.png"
          contactImageAlt="Chân dung Hana Lương"
          bookingAsideTitle="Đặt lịch gọi 15 phút"
          bookingAsideDescription="Trò chuyện trực tiếp cùng Hana."
          bookingButtonText="Đặt lịch tư vấn"
          bookingButtonLink="/coaching/dat-lich"
          showEmail={true}
          email="contact@tramdungcamxuc.com"
          items={[{ question: 'Q1', answer: 'A1' }]}
        />,
      )

      expect(screen.getByText('Tư vấn 1:1')).toBeDefined()
      expect(screen.getByText('Đặt lịch gọi 15 phút')).toBeDefined()
      expect(screen.getByText('Trò chuyện trực tiếp cùng Hana.')).toBeDefined()

      // Avatar image with alt
      const img = screen.getByAltText('Chân dung Hana Lương')
      expect(img).toBeDefined()

      // Button is not full width
      const btn = screen.getByRole('link', { name: 'Đặt lịch tư vấn' })
      expect(btn.className).not.toContain('w-full')
      expect(btn.className).toContain('rounded-full')

      // Email line
      expect(screen.getByText(new RegExp(viStrings.pk19.orEmail))).toBeDefined()
      const emailLink = screen.getByRole('link', { name: 'contact@tramdungcamxuc.com' })
      expect(emailLink.getAttribute('href')).toBe('mailto:contact@tramdungcamxuc.com')
    })

    it('renders user fallback icon in contact aside when contactImageUrl is missing', () => {
      render(
        <FAQ
          aside="contact"
          bookingAsideTitle="Đặt lịch"
          items={[{ question: 'Q1', answer: 'A1' }]}
        />,
      )

      const roundAvatarBox = document.querySelector('.w-28.h-28.rounded-full')
      expect(roundAvatarBox).not.toBeNull()
      expect(roundAvatarBox?.querySelector('svg')).not.toBeNull()
    })

    it('toggles plus and minus icons and updates active question color when iconStyle="plusminus"', () => {
      render(
        <FAQ
          iconStyle="plusminus"
          items={[
            { question: 'Thời gian tham gia là bao lâu?', answer: 'Khóa học kéo dài 28 ngày.' },
            { question: 'Có cần kinh nghiệm trước không?', answer: 'Không cần kinh nghiệm trước.' },
          ]}
        />,
      )

      const q1Btn = screen.getByRole('button', { name: /Thời gian tham gia là bao lâu\?/i })
      const q1Text = screen.getByText('Thời gian tham gia là bao lâu?')

      // Initially closed: not bright-magenta
      expect(q1Btn.getAttribute('aria-expanded')).toBe('false')
      expect(q1Text.className).not.toContain('text-bright-magenta')

      // Click to open: should change question color to text-bright-magenta
      fireEvent.click(q1Btn)
      expect(q1Btn.getAttribute('aria-expanded')).toBe('true')
      expect(q1Text.className).toContain('text-bright-magenta')

      // Click to close again
      fireEvent.click(q1Btn)
      expect(q1Btn.getAttribute('aria-expanded')).toBe('false')
      expect(q1Text.className).not.toContain('text-bright-magenta')
    })

    it('has no hardcoded string "Trạm Dừng Cảm Xúc" in src/components/site/FAQ.tsx JSX', () => {
      const faqFile = fs.readFileSync(
        path.join(process.cwd(), 'src/components/site/FAQ.tsx'),
        'utf-8',
      )
      // Check that the string is not hardcoded inside JSX elements
      expect(faqFile).not.toContain('>Trạm Dừng Cảm Xúc<')
      expect(faqFile).not.toContain('>"Trạm Dừng Cảm Xúc"<')
    })
  })
})

describe('QA PK-19c', () => {
  it('slot child questions follow the parent FAQ "+ / −" style and turn magenta when open', async () => {
    const { FAQ } = await import('@/components/site/FAQ')
    const { FaqItemView } = await import('@/components/site/FaqItemView')
    const { render: r, fireEvent: fe } = await import('@testing-library/react')
    const { getByRole } = r(
      <FAQ titleLine1="[MẪU] FAQ" iconStyle="plusminus" aside="none">
        <FaqItemView question="[MẪU] Câu hỏi 1" answer="[MẪU] Trả lời 1" />
      </FAQ>,
    )
    const btn = getByRole('button', { name: /Câu hỏi 1/ })
    fe.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(btn.innerHTML).toContain('text-bright-magenta')
  })

  it('FAQ.tsx stays a server component (no hooks); the contact image lives in FaqContactAvatar', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync('src/components/site/FAQ.tsx', 'utf8')
    expect(src).not.toMatch(/\buse(State|Effect)\b/)
  })
})
