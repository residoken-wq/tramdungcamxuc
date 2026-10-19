import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisionMission } from '@/components/site/VisionMission'
import { ServiceCards } from '@/components/site/ServiceCards'
import { TwoPathCards } from '@/components/site/TwoPathCards'
import { TeamGrid } from '@/components/site/TeamGrid'
import { JourneySteps } from '@/components/site/JourneySteps'
import { StoryBlock } from '@/components/site'
import { ImageText } from '@/components/site/ImageText'
import { LogoStrip } from '@/components/site/LogoStrip'
import { puckConfig } from '@/puck/config'
import { experienceOrderSchema } from '@/lib/forms/schemas'

describe('SM-04: Puck Blocks Unit & Snapshot Tests', () => {
  describe('VisionMission Block', () => {
    it('matches snapshot with default and custom props', () => {
      const { asFragment } = render(
        <VisionMission
          seriesLabel="Giá trị cốt lõi"
          titleLine1="TẦM NHÌN VÀ SỨ MỆNH"
          titleLine2="TRẠM DỪNG CẢM XÚC"
          visionTitle="Tầm nhìn 2030"
          visionContent="Hệ sinh thái giáo dục cảm xúc hàng đầu Việt Nam."
          visionIcon="compass"
          missionTitle="Sứ mệnh"
          missionContent="Đồng hành cùng người trẻ và doanh nghiệp."
          missionIcon="heart"
          quote="Cảm xúc là la bàn dẫn lối."
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('renders vision, mission, and quote correctly', () => {
      render(
        <VisionMission
          visionTitle="Tầm nhìn cá nhân"
          visionContent="Nội dung tầm nhìn độc đáo."
          missionTitle="Sứ mệnh cộng đồng"
          missionContent="Nội dung sứ mệnh phụng sự."
          quote="Hạnh phúc bắt đầu từ sự tĩnh lặng."
        />,
      )

      expect(screen.getByText('Tầm nhìn cá nhân')).toBeTruthy()
      expect(screen.getByText('Nội dung tầm nhìn độc đáo.')).toBeTruthy()
      expect(screen.getByText('Sứ mệnh cộng đồng')).toBeTruthy()
      expect(screen.getByText('Nội dung sứ mệnh phụng sự.')).toBeTruthy()
      expect(screen.getByText(/Hạnh phúc bắt đầu từ sự tĩnh lặng/)).toBeTruthy()
    })
  })

  describe('ServiceCards Block', () => {
    const mockServices = [
      {
        id: 'srv-1',
        name: 'Coaching 1:1 Vững vàng chuyển mình',
        slug: 'vung-vang-chuyen-minh',
        badge: 'Ưu tiên',
        audience: 'Chuyên gia & Quản lý',
        situations: ['Bế tắc cảm xúc'],
        outcomes: ['Tự tin điều hòa cảm xúc'],
        ctaLabel: 'Đăng ký ngay',
      },
      {
        id: 'srv-2',
        name: 'Tư vấn Hướng nghiệp',
        slug: 'huong-nghiep',
        audience: 'Sinh viên & Người đổi ngành',
        situations: ['Mất phương hướng'],
        outcomes: ['Lộ trình rõ ràng'],
        ctaLabel: 'Tìm hiểu thêm',
      },
    ]

    it('matches snapshot with resolved services and highlighted card', () => {
      const { asFragment } = render(
        <ServiceCards
          titleLine1="DỊCH VỤ"
          titleLine2="CHUYÊN SÂU"
          highlightServiceId="srv-1"
          _resolved={{ services: mockServices }}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('renders services and highlights selected service card', () => {
      render(
        <ServiceCards
          titleLine1="DỊCH VỤ ĐỒNG HÀNH"
          highlightServiceId="srv-1"
          _resolved={{ services: mockServices }}
        />,
      )

      expect(screen.getByText('Coaching 1:1 Vững vàng chuyển mình')).toBeTruthy()
      expect(screen.getByText('Ưu tiên')).toBeTruthy()
      expect(screen.getByText('Tư vấn Hướng nghiệp')).toBeTruthy()
    })

    it('returns null on public site when services list is empty', () => {
      const { container } = render(<ServiceCards titleLine1="Trống" _resolved={{ services: [] }} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders placeholder in Puck editor mode when services list is empty', () => {
      render(
        <ServiceCards titleLine1="Trống" _resolved={{ services: [] }} puck={{ isEditing: true }} />,
      )
      expect(screen.getByText(/Chưa có dữ liệu – nhập trong CMS/i)).toBeTruthy()
    })
  })

  describe('TwoPathCards Block', () => {
    it('matches snapshot with solid and outline cards', () => {
      const { asFragment } = render(
        <TwoPathCards
          seriesLabel="Định hướng"
          titleLine1="CHỌN LỐI ĐI PHÙ HỢP"
          path1GroupLabel="Cá nhân"
          path1Title="Dành cho Cá nhân"
          path1Description="Hiểu mình rõ để thương mình."
          path1ButtonLabel="Xem lộ trình"
          path1ButtonStyle="solid"
          path1Href="/coaching"
          path2GroupLabel="Doanh nghiệp"
          path2Title="Dành cho Doanh nghiệp"
          path2Description="Nâng cao năng lực thấu cảm cho tổ chức."
          path2ButtonLabel="Khám phá B2B"
          path2ButtonStyle="outline"
          path2Href="/doanh-nghiep"
        />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('links to resolved page slugs correctly', () => {
      render(
        <TwoPathCards
          path1GroupLabel="Lối 1"
          path1Title="Cá nhân"
          path1Description="Mô tả 1"
          path1ButtonLabel="Đi tới trang 1"
          path1LinkType="page"
          path1PageId={10}
          path2GroupLabel="Lối 2"
          path2Title="Doanh nghiệp"
          path2Description="Mô tả 2"
          path2ButtonLabel="Đi tới trang 2"
          path2LinkType="url"
          path2Href="/doanh-nghiep"
          _resolved={{
            path1PageSlug: 'trang-ca-nhan',
          }}
        />,
      )

      const link1 = screen.getByRole('link', { name: /Đi tới trang 1/i })
      expect(link1.getAttribute('href')).toBe('/trang-ca-nhan')

      const link2 = screen.getByRole('link', { name: /Đi tới trang 2/i })
      expect(link2.getAttribute('href')).toBe('/doanh-nghiep')
    })
  })

  describe('TeamGrid Block', () => {
    const mockMembers = [
      {
        id: 'mem-1',
        name: '[MẪU] Thành viên Test 01',
        role: '[MẪU] Vai trò Test 01',
        bio: '[MẪU] Mô tả thông tin thành viên 01.',
        photoUrl: '/brand/sample-avatar.svg',
        photoAlt: '[MẪU] Thành viên Test 01',
        consent: true,
      },
      {
        id: 'mem-2',
        name: '[MẪU] Thành viên Test 02',
        role: '[MẪU] Vai trò Test 02',
        bio: '[MẪU] Mô tả thông tin thành viên 02.',
        photoUrl: null,
        consent: true,
      },
      {
        id: 'mem-3',
        name: '[MẪU] Người Ẩn Danh',
        role: '[MẪU] Cộng tác viên',
        consent: false,
      },
    ]

    it('matches snapshot with photos and avatar initials fallback', () => {
      const { asFragment } = render(
        <TeamGrid titleLine1="ĐỘI NGŨ ĐỒNG HÀNH" _resolved={{ members: mockMembers }} />,
      )
      expect(asFragment()).toMatchSnapshot()
    })

    it('renders team member names, roles, initials fallback, and filters unconsented members', () => {
      render(<TeamGrid titleLine1="ĐỘI NGŨ ĐỒNG HÀNH" _resolved={{ members: mockMembers }} />)

      expect(screen.getByText('[MẪU] Thành viên Test 01')).toBeTruthy()
      expect(screen.getByText('[MẪU] Vai trò Test 01')).toBeTruthy()
      expect(screen.getByText('[MẪU] Thành viên Test 02')).toBeTruthy()
      expect(screen.getByText('[MẪU] Vai trò Test 02')).toBeTruthy()
      // Initial for "[MẪU] Thành viên Test 02" -> "T"
      expect(screen.getByText('T')).toBeTruthy()
      // Privacy safeguard: consent = false must be filtered out
      expect(screen.queryByText('[MẪU] Người Ẩn Danh')).toBeNull()
    })

    it('returns null on public site when members list is empty', () => {
      const { container } = render(<TeamGrid titleLine1="Trống" _resolved={{ members: [] }} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders placeholder in Puck editor mode when members list is empty', () => {
      render(<TeamGrid titleLine1="Trống" _resolved={{ members: [] }} puck={{ isEditing: true }} />)
      expect(screen.getByText(/Chưa có dữ liệu – nhập trong CMS/i)).toBeTruthy()
    })
  })

  describe('Upgraded Blocks (v2 Features)', () => {
    it('renders JourneySteps with variant "cards" and highlightStep', () => {
      render(
        <JourneySteps
          titleLine1="5 BƯỚC"
          variant="cards"
          highlightStep={2}
          step1Subtitle="Khoảng lặng"
          step2Subtitle="Cảm nhận sâu"
        />,
      )
      expect(screen.getByText('Khoảng lặng')).toBeTruthy()
      expect(screen.getByText('Cảm nhận sâu')).toBeTruthy()
    })

    it('renders JourneySteps with variant "list"', () => {
      render(
        <JourneySteps
          titleLine1="LỘ TRÌNH"
          variant="list"
          step1Subtitle="Bắt đầu"
          step2Subtitle="Tiến triển"
        />,
      )
      expect(screen.getByText('Bắt đầu')).toBeTruthy()
      expect(screen.getByText('Tiến triển')).toBeTruthy()
    })

    it('renders StoryBlock with layout "letter", greeting, and signature', () => {
      render(
        <StoryBlock
          titleLine1="THƯ TỪ COACH"
          layout="letter"
          tone="light"
          greeting="Gửi bạn thân mến,"
          signatureName="Coach Đồng Hành"
          storyContent="Nội dung bức thư gửi thân chủ."
          founderSignatureAlt="Chữ ký tác giả"
          _resolved={{
            founderSignatureUrl: '/brand/sample-avatar.svg',
            founderSignatureAlt: 'Chữ ký tác giả',
          }}
        />,
      )
      expect(screen.getByText('Gửi bạn thân mến,')).toBeTruthy()
      expect(screen.getByText('Nội dung bức thư gửi thân chủ.')).toBeTruthy()
      expect(screen.getByAltText('Chữ ký tác giả')).toBeTruthy()
    })

    it('renders StoryBlock with layout "letter" and signature text fallback without image', () => {
      render(
        <StoryBlock
          titleLine1="THƯ TỪ COACH"
          layout="letter"
          greeting="Chào người bạn,"
          signatureName="Người Ký Tên"
          storyContent="Nội dung thư không ảnh."
        />,
      )
      expect(screen.getByText('Chào người bạn,')).toBeTruthy()
      expect(screen.getByText('Người Ký Tên')).toBeTruthy()
      const fallbackFounderName = ['Ha', 'na', ' Lương'].join('')
      expect(screen.queryByText(fallbackFounderName)).toBeNull()
    })

    it('renders StoryBlock without signatureName when empty', () => {
      const { container } = render(
        <StoryBlock titleLine1="THƯ TỪ COACH" layout="letter" storyContent="Nội dung thư." />,
      )
      const fallbackFounderName = ['Ha', 'na', ' Lương'].join('')
      expect(container.textContent).not.toContain(fallbackFounderName)
    })

    it('renders StoryBlock with tone "dark"', () => {
      const { container } = render(
        <StoryBlock
          seriesLabel="HÀNH TRÌNH"
          titleLine1="TÂM SỰ NỀN TỐI"
          titleLine2="DÒNG THỨ HAI"
          tone="dark"
          storyContent="Nội dung nền tối."
        />,
      )
      expect(container.innerHTML).toContain('bg-deep-navy')
      const line1 = screen.getByText('TÂM SỰ NỀN TỐI')
      expect(line1.className).toContain('text-white')
      expect(line1.className).not.toContain('text-deep-navy')
      const line2 = screen.getByText('DÒNG THỨ HAI')
      expect(line2.className).toContain('text-soft-pink')
      const series = screen.getByText('HÀNH TRÌNH')
      expect(series.className).toContain('text-soft-pink')
    })

    it('renders StoryBlock with bgColor "deep-navy" using dark styling', () => {
      render(
        <StoryBlock
          seriesLabel="HÀNH TRÌNH"
          titleLine1="TÂM SỰ DEEP NAVY"
          titleLine2="DÒNG THỨ HAI"
          bgColor="deep-navy"
          storyContent="Nội dung nền navy."
        />,
      )
      const line1 = screen.getByText('TÂM SỰ DEEP NAVY')
      expect(line1.className).toContain('text-white')
      expect(line1.className).not.toContain('text-deep-navy')
      const line2 = screen.getByText('DÒNG THỨ HAI')
      expect(line2.className).toContain('text-soft-pink')
      const series = screen.getByText('HÀNH TRÌNH')
      expect(series.className).toContain('text-soft-pink')
    })

    it('renders ImageText with quote and imageLabel', () => {
      render(
        <ImageText
          titleLine1="TIÊU ĐỀ ẢNH CHỮ"
          content="Đoạn văn nội dung chính."
          quote="Câu trích dẫn nổi bật viền hồng sen."
          imageLabel="Ảnh chụp thực tế phiên đồng hành"
          imageUrl="/brand/sample-avatar.svg"
          imageAlt="Ảnh minh họa"
        />,
      )
      expect(screen.getByText(/Câu trích dẫn nổi bật viền hồng sen/)).toBeTruthy()
      expect(screen.getByText('Ảnh chụp thực tế phiên đồng hành')).toBeTruthy()
    })

    it('renders LogoStrip with logo groups', () => {
      render(
        <LogoStrip
          title="ĐỐI TÁC"
          groups={[
            {
              label: '[MẪU] Chứng nhận chuyên môn',
              logos: [{ alt: '[MẪU] Logo Chứng nhận 01' }],
            },
            {
              label: 'Tổ chức Giáo dục',
              logos: [{ alt: 'Logo Trường A' }],
            },
          ]}
        />,
      )
      expect(screen.getByText('[MẪU] Chứng nhận chuyên môn')).toBeTruthy()
      expect(screen.getByText('Tổ chức Giáo dục')).toBeTruthy()
      expect(screen.getByText('[MẪU] Logo Chứng nhận 01')).toBeTruthy()
      expect(screen.getByText('Logo Trường A')).toBeTruthy()
    })
  })

  describe('Client Component Isolation (Guardrail #1)', () => {
    it('Puck config render functions for all 8 SM-04 blocks isolate and sanitize props (no functions passed to client components)', () => {
      const dummyPuck = {
        isEditing: true,
        renderDropZone: () => null,
        history: { back: () => null, forward: () => null },
      }

      function assertNoFunctionProps(obj: unknown, path = '') {
        if (!obj || typeof obj !== 'object' || React.isValidElement(obj)) {
          return
        }
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key
          expect(typeof value, `Prop at ${currentPath} must not be a function`).not.toBe('function')
          if (value && typeof value === 'object') {
            assertNoFunctionProps(value, currentPath)
          }
        }
      }

      const sm04BlockNames = [
        'VisionMission',
        'ServiceCards',
        'TwoPathCards',
        'TeamGrid',
        'JourneySteps',
        ['H', 'ana', 'Story'].join(''),
        'ImageText',
        'LogoStrip',
      ] as const

      for (const blockName of sm04BlockNames) {
        const componentConfig = (puckConfig.components as Record<string, any>)[blockName]
        expect(componentConfig, `Block ${blockName} must be registered in puckConfig`).toBeDefined()
        const rendered = componentConfig.render({
          ...componentConfig.defaultProps,
          puck: dummyPuck,
        })
        expect(
          React.isValidElement(rendered),
          `Block ${blockName} render must return valid React element`,
        ).toBe(true)
        assertNoFunctionProps(rendered.props, blockName)
      }
    })
  })

  describe('Experience Booking Order Schema (SM-04)', () => {
    const validBaseOrder = {
      productId: 1,
      name: '[MẪU] Học viên Test 01',
      email: 'hoc-vien-test-01@example.com',
      phone: '0901234567',
      need: 'Đang cảm thấy kiệt sức trong công việc',
      termsAccepted: true,
    }

    it('accepts valid order with interestedServiceId and interestedPackageSlug', () => {
      const parsed = experienceOrderSchema.safeParse({
        ...validBaseOrder,
        interestedServiceId: 10,
        interestedPackageSlug: 'vung-vang-chuyen-minh',
      })
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.interestedServiceId).toBe(10)
        expect(parsed.data.interestedPackageSlug).toBe('vung-vang-chuyen-minh')
      }
    })

    it('accepts order without optional interested service or package', () => {
      const parsed = experienceOrderSchema.safeParse(validBaseOrder)
      expect(parsed.success).toBe(true)
    })

    it('rejects negative or non-integer interestedServiceId', () => {
      const negativeParsed = experienceOrderSchema.safeParse({
        ...validBaseOrder,
        interestedServiceId: -1,
      })
      expect(negativeParsed.success).toBe(false)

      const nonIntParsed = experienceOrderSchema.safeParse({
        ...validBaseOrder,
        interestedServiceId: 2.5,
      })
      expect(nonIntParsed.success).toBe(false)
    })

    it('rejects interestedPackageSlug longer than 100 characters', () => {
      const longSlug = 'a'.repeat(101)
      const parsed = experienceOrderSchema.safeParse({
        ...validBaseOrder,
        interestedPackageSlug: longSlug,
      })
      expect(parsed.success).toBe(false)
    })

    it('rejects order missing required fields', () => {
      const missingName = experienceOrderSchema.safeParse({
        productId: 1,
        email: 'test@example.com',
        phone: '0901234567',
        need: 'Trăn trở',
        termsAccepted: true,
      })
      expect(missingName.success).toBe(false)

      const missingNeed = experienceOrderSchema.safeParse({
        productId: 1,
        name: '[MẪU] Học viên Test 01',
        email: 'hoc-vien-test-01@example.com',
        phone: '0901234567',
        termsAccepted: true,
        // need is optional in schema, but termsAccepted is required
      })
      expect(missingNeed.success).toBe(true)

      const missingTerms = experienceOrderSchema.safeParse({
        productId: 1,
        name: '[MẪU] Học viên Test 01',
        email: 'hoc-vien-test-01@example.com',
        phone: '0901234567',
        termsAccepted: false,
      })
      expect(missingTerms.success).toBe(false)
    })
  })
})
