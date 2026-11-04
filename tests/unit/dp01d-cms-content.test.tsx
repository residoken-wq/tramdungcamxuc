import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { withDp01Defaults, DEFAULT_DP01_CONTENT } from '@/lib/habit/dp01-content'
import { HabitTrackerHeader } from '@/components/habit/zip/HabitTrackerHeader'
import { Step2PercentPrinciple } from '@/components/habit/zip/Steps/Step2PercentPrinciple'
import { Step3FindMentor } from '@/components/habit/zip/Steps/Step3FindMentor'
import { Step4IdentityHabit } from '@/components/habit/zip/Steps/Step4IdentityHabit'
import { Step5LoopDesign } from '@/components/habit/zip/Steps/Step5LoopDesign'
import { BoardingPassCard } from '@/components/habit/zip/Result/BoardingPassCard'
import { DayCheckInModal } from '@/components/habit/zip/Result/DayCheckInModal'
import { HabitTrackerFooter } from '@/components/habit/zip/HabitTrackerFooter'
import { getDefaultHabitFlowDraft } from '@/components/habit/flow/draft'

describe('DP-01d B2: Habit Copy in CMS & withDp01Defaults', () => {
  afterEach(() => {
    cleanup()
  })

  it('withDp01Defaults: returns default zip copy when CMS content is null or empty', () => {
    const res = withDp01Defaults(null)
    expect(res.header.titleLine1).toBe('Xây Thói Quen')
    expect(res.header.titleLine2).toBe('Dựng Thương Hiệu')
    expect(res.header.badgeText).toContain('CONTENT CREATOR HUB')
    expect(res.step4.suggestedRoles).toEqual(DEFAULT_DP01_CONTENT.step4.suggestedRoles)
    expect(res.footer.slogan).toBe('Dừng lại • Lắng nghe • Sống trọn vẹn hơn')
  })

  it('withDp01Defaults: custom CMS copy overrides defaults without losing un-edited fields', () => {
    const custom = withDp01Defaults({
      header: {
        titleLine1: 'Rèn Luyện Bản Lĩnh',
        titleLine2: 'Định Vị Tương Lai',
      },
      step3: {
        mentorTitle: 'Chọn Người Dẫn Đường',
      },
      step4: {
        suggestedRoles: 'người viết nhật ký\nngười tập yoga sáng\nngười đọc sách',
      },
      footer: {
        slogan: 'Hành trình vạn dặm bắt đầu từ một bước chân',
      },
    })

    expect(custom.header.titleLine1).toBe('Rèn Luyện Bản Lĩnh')
    expect(custom.header.titleLine2).toBe('Định Vị Tương Lai')
    // Unedited field retains default
    expect(custom.header.tagline).toBe(DEFAULT_DP01_CONTENT.header.tagline)
    expect(custom.step3.mentorTitle).toBe('Chọn Người Dẫn Đường')
    expect(custom.step4.suggestedRoles).toEqual([
      'người viết nhật ký',
      'người tập yoga sáng',
      'người đọc sách',
    ])
    expect(custom.footer.slogan).toBe('Hành trình vạn dặm bắt đầu từ một bước chân')
  })

  it('HabitTrackerHeader: renders defaults when prop is omitted, and custom text when provided; no "Bước x / 6" badge', () => {
    const { rerender } = render(<HabitTrackerHeader currentStep={2} />)
    expect(screen.getByText('Xây Thói Quen')).toBeDefined()
    expect(screen.getByText('Dựng Thương Hiệu')).toBeDefined()
    // B5 check: "Bước 2 / 6" should NOT exist
    expect(screen.queryByText(/Bước \d \/ 6/)).toBeNull()

    const customHeader = {
      ...DEFAULT_DP01_CONTENT.header,
      titleLine1: 'Khám Phá Bản Thân',
      titleLine2: 'Chuyển Đổi Vững Vàng',
    }
    rerender(<HabitTrackerHeader currentStep={2} headerContent={customHeader} />)
    expect(screen.getByText('Khám Phá Bản Thân')).toBeDefined()
    expect(screen.getByText('Chuyển Đổi Vững Vàng')).toBeDefined()
  })

  it('Step2PercentPrinciple: renders default chart title and custom chart title when provided', () => {
    const { rerender } = render(<Step2PercentPrinciple onNext={() => {}} onPrev={() => {}} />)
    expect(screen.getByText(DEFAULT_DP01_CONTENT.step2.chartTitle)).toBeDefined()

    const customStep2 = {
      ...DEFAULT_DP01_CONTENT.step2,
      chartTitle: 'Biểu đồ: Sức mạnh lãi kép hành vi',
    }
    rerender(
      <Step2PercentPrinciple step2Content={customStep2} onNext={() => {}} onPrev={() => {}} />,
    )
    expect(screen.getByText('Biểu đồ: Sức mạnh lãi kép hành vi')).toBeDefined()
  })

  it('Step3FindMentor: renders default scorecardTitle and custom scorecardTitle when provided', () => {
    const { rerender } = render(
      <Step3FindMentor
        routines={[]}
        selectedMentor=""
        onRoutinesChange={() => {}}
        onMentorSelect={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )
    expect(screen.getByText(DEFAULT_DP01_CONTENT.step3.scorecardTitle)).toBeDefined()

    const customStep3 = {
      ...DEFAULT_DP01_CONTENT.step3,
      scorecardTitle: 'Nhìn lại 24 giờ của bạn',
    }
    rerender(
      <Step3FindMentor
        routines={[]}
        selectedMentor=""
        step3Content={customStep3}
        onRoutinesChange={() => {}}
        onMentorSelect={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )
    expect(screen.getByText('Nhìn lại 24 giờ của bạn')).toBeDefined()
  })

  it('Step4IdentityHabit: renders default role chips and custom role chips when provided', () => {
    const draft = getDefaultHabitFlowDraft()
    const { rerender } = render(
      <Step4IdentityHabit
        draft={draft}
        onDraftChange={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )
    expect(screen.getByText(/người giữ lời với chính mình/)).toBeDefined()

    const customStep4 = {
      ...DEFAULT_DP01_CONTENT.step4,
      suggestedRoles: ['người chạy bộ kiên trì', 'người đọc chăm chỉ'],
    }
    rerender(
      <Step4IdentityHabit
        draft={draft}
        step4Content={customStep4}
        onDraftChange={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )
    expect(screen.getByText(/người chạy bộ kiên trì/)).toBeDefined()
    expect(screen.getByText(/người đọc chăm chỉ/)).toBeDefined()
  })

  it('Step5LoopDesign: renders default vs custom lead-in and loop actions', () => {
    const { rerender } = render(
      <Step5LoopDesign
        loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
        onTechniquesChange={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )
    expect(screen.getByText(/Tín hiệu đủ rõ ràng/)).toBeDefined()

    const customStep5 = {
      ...DEFAULT_DP01_CONTENT.step5,
      leadIn: 'Thiết kế hệ thống 4 bước vững chắc cho thói quen của bạn.',
    }
    rerender(
      <Step5LoopDesign
        loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
        step5Content={customStep5}
        onTechniquesChange={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )
    expect(
      screen.getByText('Thiết kế hệ thống 4 bước vững chắc cho thói quen của bạn.'),
    ).toBeDefined()
  })

  it('BoardingPassCard: renders 2 download buttons (B4) and custom pass title when provided', () => {
    const identity = {
      actionText: 'chạy bộ',
      identityAction: 'chạy bộ',
      personText: 'vận động viên',
      identityRole: 'vận động viên',
      creatorName: 'Hana',
      whyImportant: 'Để rèn luyện sức khỏe bền bỉ',
      partnerName: 'Coach Hana',
      frequency: '3' as const,
      selectedDays: ['T2', 'T4', 'T6'],
      atomicHabit: 'xỏ giày chạy',
      twoMinuteAction: 'xỏ giày chạy',
      selectedMentor: 'Uống nước',
      anchorHabit: 'Uống nước',
      startDate: '2026-11-04',
      endDate: '2026-12-01',
    }

    const { rerender } = render(
      <BoardingPassCard
        identity={identity}
        loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
        onPrev={() => {}}
      />,
    )

    // B4: Check 2 download buttons exist
    expect(screen.getByText('Tải ảnh Cover điện thoại')).toBeDefined()
    expect(screen.getByText('Tải ảnh đăng bài')).toBeDefined()
    expect(screen.getByText('Sao chép caption')).toBeDefined()

    // Pass title custom test
    const customStep6 = {
      ...DEFAULT_DP01_CONTENT.step6,
      passTitle: 'TẤM VÉ CHUYỂN MÌNH 28 NGÀY',
    }
    rerender(
      <BoardingPassCard
        identity={identity}
        loopTechniques={{ cues: [], cravings: [], responses: [], rewards: [], appliedNotes: {} }}
        step6Content={customStep6}
        onPrev={() => {}}
      />,
    )
    expect(screen.getByText('TẤM VÉ CHUYỂN MÌNH 28 NGÀY')).toBeDefined()
  })

  it('DayCheckInModal: renders default check-in hints and custom hint when provided', () => {
    const dayItem = {
      dayNumber: 1,
      dayOfWeek: 'T4',
      dateStr: '04/11',
      fullDate: '2026-11-04',
      isPostDay: true,
      completed: false,
      postPublished: false,
    }

    const { rerender } = render(
      <DayCheckInModal dayItem={dayItem} onClose={() => {}} onSave={() => {}} />,
    )
    expect(screen.getByText(DEFAULT_DP01_CONTENT.checkIn.postDayHint)).toBeDefined()

    const customCheckIn = {
      ...DEFAULT_DP01_CONTENT.checkIn,
      postDayHint: 'Hôm nay là ngày bạn khẳng định căn tính của mình:',
    }
    rerender(
      <DayCheckInModal
        dayItem={dayItem}
        checkInContent={customCheckIn}
        onClose={() => {}}
        onSave={() => {}}
      />,
    )
    expect(screen.getByText('Hôm nay là ngày bạn khẳng định căn tính của mình:')).toBeDefined()
  })

  it('HabitTrackerFooter: renders default slogan and custom slogan when provided', () => {
    const { rerender } = render(<HabitTrackerFooter />)
    expect(screen.getByText(DEFAULT_DP01_CONTENT.footer.slogan)).toBeDefined()

    const customFooter = {
      ...DEFAULT_DP01_CONTENT.footer,
      slogan: 'Lắng nghe từng nhịp thở • Chuyển hóa mỗi ngày',
    }
    rerender(<HabitTrackerFooter footerContent={customFooter} />)
    expect(screen.getByText('Lắng nghe từng nhịp thở • Chuyển hóa mỗi ngày')).toBeDefined()
  })
})
