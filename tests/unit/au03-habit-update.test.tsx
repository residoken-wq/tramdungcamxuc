// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi as vitest } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vitest.mock('server-only', () => ({}))

import { HabitOfferClient } from '@/components/habit/HabitOfferClient'
import type { HabitProductData } from '@/lib/habit.server'
import type { PublicTechnique } from '@/lib/habit'
import type { PublicProduct } from '@/lib/products'
import { DEFAULT_DP01_CONTENT, withDp01Defaults } from '@/lib/habit/dp01-content'
import { HabitTrackerHeader } from '@/components/habit/zip/HabitTrackerHeader'
import { StepNavigation } from '@/components/habit/zip/StepNavigation'
import { Step3FindMentor } from '@/components/habit/zip/Steps/Step3FindMentor'
import { Step5LoopDesign } from '@/components/habit/zip/Steps/Step5LoopDesign'
import { BoardingPassCard } from '@/components/habit/zip/Result/BoardingPassCard'
import { Dashboard28Days } from '@/components/habit/zip/Result/Dashboard28Days'
import { vi } from '@/lib/i18n/vi'

describe('AU-03: Habit updates across offer, 5-minute tool, boarding pass & 28-day table', () => {
  afterEach(() => {
    cleanup()
  })

  const baseOfferProduct: HabitProductData = {
    id: 1,
    name: 'Habit Tracker số',
    slug: 'habit-tracker-so',
    price: 299000,
    salePrice: 189000,
    trialDays: 28,
    saleStatus: 'on_sale',
    includes: ['20 video bài giảng', '11 kỹ thuật thực hành'],
    faq: [],
    cta: { href: '/thanh-toan?san-pham=habit-tracker-so', label: 'Trở thành VIP Member', kind: 'buy' },
    videoCount: 20,
    techniqueCount: 11,
  }

  describe('Mục 1: /habit/1-percent-better', () => {
    it('ẩn hoàn toàn mục "Habit Hack khác biệt" khi featureItems trống và cho phép đổi đơn vị đếm lộ trình', () => {
      const { rerender } = render(
        <HabitOfferClient
          product={{
            ...baseOfferProduct,
            shortDescription: 'Bộ tài liệu tự học Habit Hack 28 ngày',
            curriculumUnitLabel: 'giai đoạn',
            curriculumModules: [
              { title: 'Giai đoạn 1', description: 'Khám đúng bệnh' },
              { title: 'Giai đoạn 2', description: 'Tìm Mentor' },
              { title: 'Giai đoạn 3', description: 'Xây vòng lặp' },
            ],
            featureItems: [],
          }}
          journeyDays={28}
        />,
      )

      expect(screen.getByText('Bộ tài liệu tự học Habit Hack 28 ngày')).toBeDefined()
      expect(screen.getByText('giai đoạn')).toBeDefined()
      expect(screen.getByText('Lộ trình 3 giai đoạn chuyển hóa')).toBeDefined()
      expect(screen.queryByText(/Tại sao Habit.*khác biệt/i)).toBeNull()
      expect(screen.queryByText(vi.habit.offer.features.items[0].title)).toBeNull()

      rerender(
        <HabitOfferClient
          product={{
            ...baseOfferProduct,
            featuresHeading: 'Điểm khác biệt thật từ CMS',
            featureItems: [{ title: 'Nhịp 28 ngày linh hoạt', description: 'Tự chọn lịch tập' }],
          }}
          journeyDays={28}
        />,
      )

      expect(screen.getByText('Điểm khác biệt thật từ CMS')).toBeDefined()
      expect(screen.getByText('Nhịp 28 ngày linh hoạt')).toBeDefined()
    })
  })

  describe('Mục 2: /habit/5-phut header, wizard & nhãn kỹ thuật theo CMS', () => {
    it('ẩn thanh huy hiệu đầu công cụ khi badgeText rỗng, bỏ 3 thẻ giai đoạn lớn và hiển thị thanh tiến độ wizard', () => {
      const resolvedEmpty = withDp01Defaults(null)
      expect(resolvedEmpty.header.badgeText).toBe('')

      const { rerender } = render(
        <>
          <HabitTrackerHeader headerContent={resolvedEmpty.header} currentStep={1} />
          <StepNavigation currentStep={2} maxReachedStep={3} onStepChange={() => {}} />
        </>,
      )

      expect(screen.queryByText(/CONTENT CREATOR HUB/i)).toBeNull()
      expect(screen.queryByText('GIAI ĐOẠN 1')).toBeNull()
      expect(screen.queryByText('GIAI ĐOẠN 2')).toBeNull()
      expect(screen.queryByText('GIAI ĐOẠN 3')).toBeNull()
      expect(screen.getByText('Bước 2 / 6')).toBeDefined()
      const progress = screen.getByRole('progressbar')
      expect(progress.getAttribute('aria-valuenow')).toBe('2')

      rerender(
        <HabitTrackerHeader
          headerContent={{
            ...DEFAULT_DP01_CONTENT.header,
            badgeText: 'PHIÊN BẢN TÙY BIẾN',
          }}
          currentStep={1}
        />,
      )
      expect(screen.getByText('PHIÊN BẢN TÙY BIẾN')).toBeDefined()
    })

    it('Step5LoopDesign: dùng nhãn và placeholder riêng từ CMS cho "Soi lại nhịp sinh học" & đổi {gio} sang AM/PM', () => {
      const techniques: PublicTechnique[] = [
        {
          id: 101,
          name: 'Soi lại nhịp sinh học',
          stage: 'cue',
          order: 1,
          description: 'Chọn khung giờ còn năng lượng',
          examples: ['Tỉnh táo nhất vào sáng sớm'],
          applyLabel: 'Thói quen tốt tôi nhận ra:',
          applyPlaceholder: 'Ngồi thiền',
        },
        {
          id: 102,
          name: 'Ghép thói quen mới',
          stage: 'cue',
          order: 2,
          description: 'Gắn sau thói quen cũ',
          examples: ['Sau khi pha trà thì mở sách'],
          applyTemplate: 'Sau khi {mentor} lúc {gio}, tôi sẽ thực hiện',
        },
      ]

      render(
        <Step5LoopDesign
          techniques={techniques}
          identity={{
            creatorName: 'Hana',
            selectedMentor: 'Pha trà sáng',
            mentorTime: '18:00',
            atomicHabit: 'uống nước ấm',
            identityAction: 'uống nước',
            identityRole: 'người sống khỏe',
            postsPerWeek: 3,
            selectedDays: ['T2', 'T4', 'T6'],
            whyImportant: '',
            startDate: '2026-11-01',
            endDate: '2026-11-28',
            partnerName: '',
            companionName: '',
          }}
          loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
          onTechniquesChange={() => {}}
          onNext={() => {}}
          onPrev={() => {}}
        />,
      )

      // Mở chi tiết cả 2 kỹ thuật để kiểm tra label + placeholder
      const viewButtons = screen.getAllByRole('button', { name: 'Xem' })
      fireEvent.click(viewButtons[0])
      fireEvent.click(viewButtons[1])

      const bioClockInput = screen.getByLabelText('Thói quen tốt tôi nhận ra:') as HTMLInputElement
      expect(bioClockInput.placeholder).toBe('Ngồi thiền')

      const secondInput = screen.getAllByLabelText('Cách tôi áp dụng:')[0] as HTMLInputElement
      expect(secondInput.placeholder).toContain('6:00 PM')
      expect(secondInput.placeholder).not.toContain('18:00')

      expect(screen.getByRole('button', { name: /Tiếp • Nhận Habit Boarding Pass/ })).toBeDefined()
    })
  })

  describe('Mục 3: Habit Boarding Pass, giá động VIP Member, 1:1 CTA & AM/PM', () => {
    it('hiển thị ghi chú người dùng theo vòng lặp 4 quy luật, tên kỹ thuật nhạt khi để trống, trích dẫn mới, 6:00 PM và 2 CTA động', () => {
      const techniques: PublicTechnique[] = [
        { id: 1, name: 'Soi lại nhịp sinh học', stage: 'cue', order: 1 },
        { id: 2, name: 'Ghép thói quen mới', stage: 'cue', order: 2 },
        { id: 4, name: 'Rút gọn dưới 2 phút', stage: 'response', order: 1 },
      ]

      const coachingProduct: PublicProduct = {
        id: 77,
        name: 'Phiên trải nghiệm Growth Mirror 1:1',
        slug: 'phien-trai-nghiem-1-1',
        type: 'coaching_trial',
        web: 'site',
        saleStatus: 'on_sale',
        price: 149000,
        salePrice: null,
        saleEndsAt: null,
        externalUrl: null,
        externalLabel: null,
        ctaLabel: null,
        shortDescription: null,
        coverImage: null,
        trialDays: null,
        journeyStep: null,
      }

      render(
        <BoardingPassCard
          journeyDays={28}
          identity={{
            creatorName: 'Minh An',
            selectedMentor: 'Đánh răng tối',
            mentorTime: '18:00',
            atomicHabit: 'viết 3 dòng nhật ký',
            identityAction: 'viết nhật ký mỗi tối',
            identityRole: 'người sống tỉnh thức',
            postsPerWeek: 4,
            selectedDays: ['T2', 'T4', 'T6', 'CN'],
            whyImportant: '',
            startDate: '2026-11-01',
            endDate: '2026-11-28',
            partnerName: '',
            companionName: 'Minh An',
          }}
          techniques={techniques}
          loopTechniques={{
            cues: ['1', '2'],
            cravings: [],
            responses: ['4'],
            rewards: [],
            appliedNotes: {
              '1': 'Ngồi thiền sau bữa tối',
              '2': '',
              '4': 'Mở sẵn sổ trên bàn',
            },
          }}
          habitProduct={{
            slug: 'habit-tracker-so',
            price: 399000,
            salePrice: 249000,
            saleEndsAt: null,
          }}
          coachingProduct={coachingProduct}
          onPrev={() => {}}
          onSubmitPlan={() => {}}
        />,
      )

      // AM/PM time
      expect(screen.getByText(/Sau khi Đánh răng tối · 6:00 PM/)).toBeDefined()
      expect(screen.queryByText(/18:00/)).toBeNull()

      // Trích dẫn mới thay Aristotle / Lãi kép
      expect(
        screen.getByText(/Mỗi hành động bạn thực hiện là một lá phiếu cho con người bạn muốn trở thành/),
      ).toBeDefined()

      // Vòng lặp 4 quy luật với nội dung người dùng & ghi chú rỗng
      expect(screen.getByText('Ngồi thiền sau bữa tối')).toBeDefined()
      expect(screen.getByText('Mở sẵn sổ trên bàn')).toBeDefined()
      const emptyNoteTechnique = screen.getByText('Ghép thói quen mới')
      expect(emptyNoteTechnique.className).toContain('italic')

      const lawList = screen.getByRole('list', { name: vi.dp01.chosenLawsTitle })
      const lawCards = Array.from(lawList.children)
      expect(lawCards[0].textContent).toContain('TÍN HIỆU')
      expect(lawCards[1].textContent).toContain('KHAO KHÁT')
      expect(lawCards[1].textContent).toContain('chưa chọn')

      // Lời mời email & 2 nút CTA giá động
      expect(
        screen.getByText('Để lại email để bắt đầu hành trình 28 ngày hình thành thói quen'),
      ).toBeDefined()

      const vipLink = screen.getByRole('link', { name: /Trở thành VIP Member/i })
      expect(vipLink.getAttribute('href')).toBe('/thanh-toan?san-pham=habit-tracker-so')
      expect(vipLink.textContent).toContain('399.000đ')
      expect(vipLink.textContent).toContain('249.000đ')

      const coachLink = screen.getByRole('link', { name: /Cần coach đồng hành 1:1/i })
      expect(coachLink.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=77')
      expect(coachLink.textContent).toContain('149.000đ')
    })

    it('chỉ hiện giá gốc trên nút VIP Member khi saleEndsAt đã hết hạn', () => {
      render(
        <BoardingPassCard
          journeyDays={28}
          identity={{
            creatorName: 'Học viên',
            selectedMentor: 'Pha trà',
            mentorTime: '06:00',
            atomicHabit: 'đọc 1 trang',
            identityAction: 'đọc sách',
            identityRole: 'người ham học',
            postsPerWeek: 3,
            selectedDays: ['T2', 'T4', 'T6'],
            whyImportant: '',
            startDate: '2026-11-01',
            endDate: '2026-11-28',
            partnerName: '',
            companionName: '',
          }}
          loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
          habitProduct={{
            slug: 'habit-tracker-so',
            price: 399000,
            salePrice: 249000,
            saleEndsAt: '2020-01-01T00:00:00.000Z',
          }}
          onPrev={() => {}}
        />,
      )

      const vipLink = screen.getByRole('link', { name: /Trở thành VIP Member/i })
      expect(vipLink.textContent).toContain('399.000đ')
      expect(vipLink.textContent).not.toContain('249.000đ')
    })
  })

  describe('Mục 4: Bảng Habit Hack 28 ngày', () => {
    it('hiển thị tiêu đề mới, đủ chú giải 4 trạng thái và giờ Mentor AM/PM', () => {
      render(
        <Dashboard28Days
          planId={99}
          journeyDays={28}
          currentDay={1}
          startDate="2026-11-01"
          selectedDays={['T2', 'T4', 'T6']}
          selectedMentor="Đọc 1 trang"
          mentorTime="18:00"
          atomicHabit="mở sách"
          identityAction="đọc mỗi tối"
          identityRole="người ham học"
          initialCheckins={[]}
        />,
      )

      expect(screen.getByRole('heading', { level: 2, name: 'Bảng Habit Hack 28 ngày' })).toBeDefined()
      expect(screen.queryByText('Lưới 28 ngày theo dõi')).toBeNull()

      expect(screen.getByText('Đã bỏ phiếu')).toBeDefined()
      expect(screen.getByText('Thực hiện tối thiểu')).toBeDefined()
      expect(screen.getByText('Lỡ nhịp')).toBeDefined()
      expect(screen.getByText('Ngày nghỉ theo nhịp')).toBeDefined()

      expect(screen.getByText(/Sau khi Đọc 1 trang · lúc 6:00 PM/)).toBeDefined()
      expect(screen.queryByText(/18:00/)).toBeNull()
    })
  })

  describe('AU-03 QA 11/11 fixes', () => {
    it('bỏ phần tự viết CTA Boarding Pass, bỏ "qua 3 giai đoạn:" và dùng line-clamp-2 cho Mentor', () => {
      expect(DEFAULT_DP01_CONTENT.header.introText).not.toContain('qua 3 giai đoạn:')
      expect(vi.habit.wizard.intro(28)).not.toContain('qua 3 giai đoạn:')

      const { container } = render(
        <BoardingPassCard
          journeyDays={28}
          identity={{
            creatorName: '',
            selectedMentor: 'Đi làm về cất giày và uống nước ấm mỗi ngày thật đều đặn',
            mentorTime: '18:00',
            atomicHabit: 'đọc 1 trang',
            identityAction: 'đọc sách',
            identityRole: 'người ham học',
            postsPerWeek: 3,
            selectedDays: ['T2', 'T4', 'T6'],
            whyImportant: '',
            startDate: '2026-11-01',
            endDate: '2026-11-28',
            partnerName: '',
            companionName: '',
          }}
          loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
          onPrev={() => {}}
        />,
      )

      expect(screen.queryByText('Đồng hành sâu hơn cùng Trạm')).toBeNull()
      expect(container.querySelector('.line-clamp-2')?.textContent).toContain('6:00 PM')
    })

    it('StepNavigation không dùng transition màu gây chập chờn tương phản và Step3 có min-w-0', () => {
      render(
        <StepNavigation
          currentStep={6}
          maxReachedStep={6}
          hasSavedPlan={true}
          onStepChange={() => {}}
        />,
      )
      const loopBtn = screen.getByRole('button', { name: /Vòng lặp/i })
      expect(loopBtn.className).not.toContain('transition-all')

      render(
        <Step3FindMentor
          routines={[{ id: '1', activity: 'Dọn bàn làm việc dài thật dài trên 375px', score: '+' }]}
          selectedMentor=""
          mentorTime=""
          step3Content={DEFAULT_DP01_CONTENT.step3}
          onRoutinesChange={() => {}}
          onMentorSelect={() => {}}
          onPrev={() => {}}
          onNext={() => {}}
        />,
      )
      const input = screen.getByDisplayValue(/Dọn bàn làm việc/)
      expect(input.className).toContain('min-w-0')
    })
  })
})

