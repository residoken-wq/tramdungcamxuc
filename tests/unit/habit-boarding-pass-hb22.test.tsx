import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { StepBoardingPass } from '@/components/habit/flow/StepBoardingPass'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import { fillBoardingCaption } from '@/lib/habit/flow-content'
import { formatStartDateVN } from '@/lib/habit/boarding-pass'
import { vi as viStrings } from '@/lib/i18n/vi'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import * as analyticsModule from '@/lib/analytics/track'

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
  EVENT_ALLOWED_PROPS: {
    habit_loop_completed: ['step', 'duration'],
    trial_started: ['productSlug', 'productId', 'days'],
  },
}))

vi.mock('@/lib/habit/actions', () => ({
  submitHabitPlanAction: vi.fn(),
}))

describe('HB-22: Bước 6 "Boarding Pass" & Lên chuyến', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  describe('1. fillBoardingCaption & bảo vệ thông tin riêng tư', () => {
    it('điền đúng {tuyen_ngon}, {so_ngay}, {ngay_bat_dau} theo ngày giờ VN', () => {
      const template =
        'Hành trình của tôi:\n{tuyen_ngon}\nThời gian: {so_ngay} ngày, xuất phát {ngay_bat_dau}!'
      const result = fillBoardingCaption(template, {
        tuyen_ngon: 'Sau khi thức dậy, tôi sẽ đi bộ 10 phút để trở thành người năng động',
        so_ngay: 28,
        ngay_bat_dau: formatStartDateVN('2026-11-05'),
      })

      expect(result).toBe(
        'Hành trình của tôi:\nSau khi thức dậy, tôi sẽ đi bộ 10 phút để trở thành người năng động\nThời gian: 28 ngày, xuất phát 05/11/2026!',
      )
    })

    it('giữ nguyên biến lạ {bien_la} mà không báo lỗi hay in undefined', () => {
      const template = 'Tôi cam kết {tuyen_ngon} cùng {bien_la}'
      const result = fillBoardingCaption(template, {
        tuyen_ngon: 'chạy bộ',
      })
      expect(result).toBe('Tôi cam kết chạy bộ cùng {bien_la}')
      expect(result).not.toContain('undefined')
    })

    it('tuyệt đối KHÔNG đưa privateReason hoặc companionName vào caption ngay cả khi template có placeholder đó', () => {
      const maliciousTemplate =
        'Tuyên ngôn: {tuyen_ngon}\nLý do: {privateReason}\nBạn: {companionName}'
      const result = fillBoardingCaption(maliciousTemplate, {
        tuyen_ngon: 'Tôi sẽ thiền 5 phút',
        // Even if someone passed extra properties at runtime
        ...({
          privateReason: 'Bí mật riêng tư',
          companionName: 'Người bạn bí mật',
        } as unknown as Record<string, string>),
      })
      // {privateReason} and {companionName} are NOT in the permitted replacement map
      expect(result).not.toContain('Bí mật riêng tư')
      expect(result).not.toContain('Người bạn bí mật')
      expect(result).toContain('{privateReason}')
      expect(result).toContain('{companionName}')
    })
  })

  describe('2. StepBoardingPass UI & Tương tác sao chép / tải ảnh', () => {
    const defaultProps = {
      identityStatement: 'Tôi sẽ đọc sách 10 trang để trở thành người thông thái',
      actionText: 'đọc sách 10 trang',
      personText: 'người thông thái',
      anchorHabit: 'Uống cà phê sáng',
      twoMinuteAction: 'Mở trang sách',
      rhythmDays: ['mon', 'wed', 'fri'] as ('mon' | 'wed' | 'fri')[],
      chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
      selectedTechniqueIds: [],
      journeyDays: 28,
      startDate: '2026-11-02',
      techniques: [],
      name: 'Học viên A',
      email: 'a@example.com',
      consent: true,
      honeypot: '',
      isSubmitting: false,
      onNameChange: vi.fn(),
      onEmailChange: vi.fn(),
      onConsentChange: vi.fn(),
      onHoneypotChange: vi.fn(),
      onTurnstileVerify: vi.fn(),
      onSubmitPlan: vi.fn(),
    }

    it('hiển thị câu trích dẫn bước 6 và lời giới thiệu khi được truyền vào', () => {
      render(
        <StepBoardingPass
          {...defaultProps}
          quote={{
            text: 'Hành trình vạn dặm bắt đầu từ một bước chân.',
            author: 'Lão Tử',
            source: 'Đạo Đức Kinh',
          }}
          intro="Hãy lưu lại tấm vé Boarding Pass để đánh dấu ngày khởi hành."
        />,
      )

      expect(screen.getByText('“Hành trình vạn dặm bắt đầu từ một bước chân.”')).toBeDefined()
      expect(
        screen.getByText('Hãy lưu lại tấm vé Boarding Pass để đánh dấu ngày khởi hành.'),
      ).toBeDefined()
    })

    it('hiển thị 3 nút với đúng nhãn tiếng Việt', () => {
      render(
        <StepBoardingPass {...defaultProps} captionTemplate="Hành trình {so_ngay} ngày bắt đầu!" />,
      )

      expect(screen.getByRole('button', { name: viStrings.hb10.download916 })).toBeDefined()
      expect(screen.getByRole('button', { name: viStrings.hb10.download45 })).toBeDefined()
      expect(screen.getByRole('button', { name: viStrings.hb22.copyCaption })).toBeDefined()
    })

    it('không hiển thị nút chép caption khi không có caption template', () => {
      render(<StepBoardingPass {...defaultProps} captionTemplate={undefined} />)

      expect(screen.getByRole('button', { name: viStrings.hb10.download916 })).toBeDefined()
      expect(screen.getByRole('button', { name: viStrings.hb10.download45 })).toBeDefined()
      expect(screen.queryByRole('button', { name: viStrings.hb22.copyCaption })).toBeNull()
    })

    it('sao chép thành công qua Clipboard API và hiển thị Toast', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      render(
        <StepBoardingPass
          {...defaultProps}
          captionTemplate="Caption mẫu tuyệt vời cho {so_ngay} ngày!"
        />,
      )

      const copyBtn = screen.getByRole('button', { name: viStrings.hb22.copyCaption })
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('Caption mẫu tuyệt vời cho 28 ngày!')
      })

      // Toast status
      expect(screen.getAllByText(viStrings.hb22.copiedToast).length).toBeGreaterThanOrEqual(1)
    })

    it('hiển thị fallback textarea khi Clipboard API thất bại', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      render(
        <StepBoardingPass
          {...defaultProps}
          captionTemplate="Caption cần copy bằng tay cho {so_ngay} ngày"
        />,
      )

      const copyBtn = screen.getByRole('button', { name: viStrings.hb22.copyCaption })
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(screen.getByLabelText(viStrings.hb22.captionFallbackLabel)).toBeDefined()
      })

      const textarea = screen.getByLabelText(
        viStrings.hb22.captionFallbackLabel,
      ) as HTMLTextAreaElement
      expect(textarea.value).toBe('Caption cần copy bằng tay cho 28 ngày')
    })

    it('nút chính kích hoạt gửi form "Lên chuyến · Bắt đầu 28 ngày →"', () => {
      const submitMock = vi.fn((e: React.FormEvent) => e.preventDefault())
      render(<StepBoardingPass {...defaultProps} journeyDays={28} onSubmitPlan={submitMock} />)

      const primaryBtn = screen.getByRole('button', {
        name: viStrings.hb22.startJourneyButton(28),
      })
      expect(primaryBtn).toBeDefined()
      fireEvent.click(primaryBtn)
      expect(submitMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('3. Luồng HabitFlow Step 6 submit & Điều hướng Tracker / Analytics', () => {
    it('gửi form thành công (chưa đăng nhập): đích đến là /tai-khoan/dang-nhap?next=/habit/tracker, màn chúc mừng hiện nút chính dẫn đến URL đó', async () => {
      const actions = await import('@/lib/habit/actions')
      vi.mocked(actions.submitHabitPlanAction).mockResolvedValueOnce({
        success: true,
        planId: 123,
        trackerDestination: '/tai-khoan/dang-nhap?next=/habit/tracker',
        trialStarted: false,
      })

      // Lưu sẵn nháp đang ở bước 6
      const draft = {
        version: 2,
        step: 6,
        scorecard: [{ habit: 'Uống cà phê sáng', rating: 'good', time: '07:00' }],
        anchorHabit: 'Uống cà phê sáng',
        rhythmDays: ['mon', 'wed', 'fri'],
        rhythmFrequency: 3,
        twoMinuteAction: 'Mở sách',
        actionText: 'đọc sách 10 trang',
        personText: 'người kiên trì',
        identityStatement: 'Tôi sẽ đọc sách 10 trang để trở thành người kiên trì',
        startDate: '2026-11-03',
        journeyDays: 28,
        chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
      }
      localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(draft))

      render(
        <HabitFlow
          techniques={[]}
          journeyDays={28}
          stepQuotes={{
            boardingPass: {
              text: 'Khởi hành vững vàng!',
              author: 'Trạm Dừng Cảm Xúc',
              source: 'Trạm Dừng Cảm Xúc',
              sourceUrl: null,
            },
            onePercent: null,
            mentor: null,
            name: null,
            loop: null,
            tracker: null,
          }}
          boardingPassCaption="Tôi cam kết {tuyen_ngon} trong {so_ngay} ngày từ {ngay_bat_dau}"
        />,
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Kiểm tra đang ở bước 6 và hiện câu quote
      expect(screen.getByText('“Khởi hành vững vàng!”')).toBeDefined()

      // Nhập email và check consent
      const emailInput = screen.getByLabelText(viStrings.habit.wizard.step4.emailLabel)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      const consentCheckbox = screen.getByLabelText(
        new RegExp(viStrings.habit.wizard.step4.consentLabel, 'i'),
      )
      fireEvent.click(consentCheckbox)

      // Bấm nút chính "Lên chuyến · Bắt đầu 28 ngày →"
      const submitBtn = screen.getByRole('button', {
        name: viStrings.hb22.startJourneyButton(28),
      })

      await act(async () => {
        fireEvent.click(submitBtn)
      })

      // Đợi màn chúc mừng xuất hiện
      expect(await screen.findByText(viStrings.hb22.successTitle)).toBeDefined()

      // Nút chính dẫn vào tracker
      const trackerLink = screen.getByTestId('success-tracker-link')
      expect(trackerLink.getAttribute('href')).toBe('/tai-khoan/dang-nhap?next=/habit/tracker')
      expect(trackerLink.textContent).toContain(viStrings.hb22.goToTracker(28))

      // Có link ưu đãi
      expect(screen.getByTestId('success-offer-link')).toBeDefined()

      // trial_started KHÔNG được gọi vì chưa đăng nhập/chưa kích hoạt trial
      expect(analyticsModule.track).not.toHaveBeenCalledWith('trial_started', expect.anything())
    })

    it('gửi form thành công (đã đăng nhập, kích hoạt trial): đích đến là /habit/tracker, phát sự kiện trial_started', async () => {
      const actions = await import('@/lib/habit/actions')
      vi.mocked(actions.submitHabitPlanAction).mockResolvedValueOnce({
        success: true,
        planId: 456,
        trackerDestination: '/habit/tracker',
        trialStarted: true,
        trialDays: 28,
      })

      const draft = {
        version: 2,
        step: 6,
        scorecard: [{ habit: 'Uống cà phê sáng', rating: 'good', time: '07:00' }],
        anchorHabit: 'Uống cà phê sáng',
        rhythmDays: ['mon', 'wed', 'fri'],
        rhythmFrequency: 3,
        twoMinuteAction: 'Mở sách',
        actionText: 'đọc sách 10 trang',
        personText: 'người kiên trì',
        identityStatement: 'Tôi sẽ đọc sách 10 trang để trở thành người kiên trì',
        startDate: '2026-11-03',
        journeyDays: 28,
        chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
      }
      localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(draft))

      render(
        <HabitFlow
          techniques={[]}
          journeyDays={28}
          boardingPassCaption="Hành trình {so_ngay} ngày"
        />,
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Nhập email và check consent
      const emailInput = screen.getByLabelText(viStrings.habit.wizard.step4.emailLabel)
      fireEvent.change(emailInput, { target: { value: 'dangb@example.com' } })
      const consentCheckbox = screen.getByLabelText(
        new RegExp(viStrings.habit.wizard.step4.consentLabel, 'i'),
      )
      fireEvent.click(consentCheckbox)

      const submitBtn = await screen.findByRole('button', {
        name: viStrings.hb22.startJourneyButton(28),
      })

      await act(async () => {
        fireEvent.click(submitBtn)
      })

      expect(await screen.findByText(viStrings.hb22.successTitle)).toBeDefined()

      const trackerLink = screen.getByTestId('success-tracker-link')
      expect(trackerLink.getAttribute('href')).toBe('/habit/tracker')

      // trial_started được kích hoạt với productSlug habit-tracker-so và số ngày 28
      expect(analyticsModule.track).toHaveBeenCalledWith('trial_started', {
        productSlug: 'habit-tracker-so',
        days: 28,
      })
    })
  })
})
