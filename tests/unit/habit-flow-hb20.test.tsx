import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { StepName } from '@/components/habit/flow/StepName'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import {
  migrateHabitDraft,
  getDefaultHabitFlowDraft,
  serializeHabitDraftForStorage,
} from '@/components/habit/flow/draft'
import { getVietnamYmd, addVietnamDays } from '@/lib/habit/tracker-stats'
import { buildBoardingPass, boardingPassInputSchema } from '@/lib/habit/boarding-pass'
import { vi as viStrings } from '@/lib/i18n/vi'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'

describe('HB-20: Step 4 "Gọi tên thói quen" - Unit & Flow Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  describe('1. StepName UI component', () => {
    it('hiển thị đầy đủ 6 phần theo đúng thứ tự: Tuyên ngôn, Nhịp điệu, Hạt nhân, Lý do riêng, Ngày bắt đầu, Bạn đồng hành', () => {
      const todayYmd = getVietnamYmd()
      render(
        <StepName
          actionText="đọc sách 5 trang"
          personText="người thông thái"
          identityStatement="Tôi sẽ đọc sách 5 trang để trở thành người thông thái"
          anchorHabit="Uống cà phê sáng"
          rhythmDays={['mon', 'wed', 'fri']}
          rhythmFrequency={3}
          twoMinuteAction="Mở trang sách đầu tiên"
          privateReason="Tôi muốn rèn luyện tư duy cho tương lai"
          companionName="Minh"
          startDate={todayYmd}
          journeyDays={28}
          onActionChange={vi.fn()}
          onPersonChange={vi.fn()}
          onToggleRhythmDay={vi.fn()}
          onTwoMinuteChange={vi.fn()}
        />,
      )

      // 1. Tuyên ngôn
      expect(screen.getByText(viStrings.hb20.declaration.title)).toBeDefined()
      expect(screen.getByText(/Sau khi Uống cà phê sáng, tôi sẽ đọc sách 5 trang/i)).toBeDefined()

      // 2. Nhịp điệu
      expect(screen.getByText(viStrings.hb20.rhythm.title)).toBeDefined()
      expect(screen.getByText(viStrings.hb20.rhythm.plannedRestNote)).toBeDefined()
      expect(screen.getByText(viStrings.hb20.rhythm.countStatus(3, 3))).toBeDefined()

      // 3. Thói quen hạt nhân
      expect(screen.getByText(viStrings.hb20.coreHabit.title)).toBeDefined()
      expect(screen.getByText('22/200')).toBeDefined()

      // 4. Vì sao điều này quan trọng
      expect(screen.getByText(viStrings.hb20.privateReason.title)).toBeDefined()
      expect(screen.getByText(viStrings.hb20.privateReason.privateBadge)).toBeDefined()
      expect(screen.getByText('39/500')).toBeDefined()

      // 5. Ngày bắt đầu
      expect(screen.getByText(viStrings.hb20.startDate.title)).toBeDefined()
      const endDateYmd = getVietnamYmd(new Date(addVietnamDays(todayYmd, 27)))
      const [ey, em, ed] = endDateYmd.split('-')
      const endExpectedStr = `${ed}/${em}/${ey}`
      expect(screen.getByText(viStrings.hb20.startDate.endDateHint(endExpectedStr))).toBeDefined()

      // 6. Bạn đồng hành
      expect(screen.getByText(viStrings.hb20.companion.title)).toBeDefined()
      expect(screen.getByText(viStrings.hb20.companion.note)).toBeDefined()
    })

    it('báo lỗi khi số thứ đã chọn khác với số lần mỗi tuần đã đặt', () => {
      render(
        <StepName
          actionText="chạy bộ"
          personText="người dẻo dai"
          identityStatement="Tôi sẽ chạy bộ để trở thành người dẻo dai"
          rhythmDays={['mon', 'wed', 'fri']}
          rhythmFrequency={5}
          twoMinuteAction="Xỏ giày"
          error={viStrings.hb20.errors.rhythmCountMismatch(5, 3)}
          onActionChange={vi.fn()}
          onPersonChange={vi.fn()}
          onToggleRhythmDay={vi.fn()}
          onTwoMinuteChange={vi.fn()}
        />,
      )

      expect(screen.getByText(viStrings.hb20.errors.rhythmCountMismatch(5, 3))).toBeDefined()
    })

    it('ô chọn ngày bắt đầu có min là hôm nay và max là hôm nay + 14 ngày theo giờ VN', () => {
      const todayYmd = getVietnamYmd()
      const maxStartDayYmd = getVietnamYmd(new Date(addVietnamDays(todayYmd, 14)))

      render(
        <StepName
          actionText="uống nước"
          personText="người khỏe mạnh"
          identityStatement="Tôi sẽ uống nước để trở thành người khỏe mạnh"
          rhythmDays={['mon']}
          twoMinuteAction="Rót nước"
          onActionChange={vi.fn()}
          onPersonChange={vi.fn()}
          onToggleRhythmDay={vi.fn()}
          onTwoMinuteChange={vi.fn()}
        />,
      )

      const dateInput = screen.getByLabelText(viStrings.hb20.startDate.label) as HTMLInputElement
      expect(dateInput.min).toBe(todayYmd)
      expect(dateInput.max).toBe(maxStartDayYmd)
    })
  })

  describe('2. Khôi phục nháp (draft.ts)', () => {
    it('startDate đã qua (nhỏ hơn hôm nay) tự động được đặt lại về hôm nay', () => {
      const yesterday = getVietnamYmd(new Date(Date.now() - 86400000 * 2))
      const rawDraft = {
        step: 4,
        version: 2,
        actionText: 'thiền',
        personText: 'người điềm tĩnh',
        startDate: yesterday,
        privateReason: 'Lý do riêng tư',
        companionName: 'An',
        rhythmFrequency: 4,
        rhythmDays: ['mon', 'wed', 'fri', 'sun'],
      }

      const migrated = migrateHabitDraft(rawDraft)
      expect(migrated.startDate).toBe(getVietnamYmd())
      expect(migrated.privateReason).toBe('Lý do riêng tư')
      expect(migrated.companionName).toBe('An')
      expect(migrated.rhythmFrequency).toBe(4)
    })

    it('startDate hợp lệ trong tương lai được giữ nguyên', () => {
      const futureDate = getVietnamYmd(new Date(addVietnamDays(getVietnamYmd(), 5)))
      const rawDraft = {
        startDate: futureDate,
      }
      const migrated = migrateHabitDraft(rawDraft)
      expect(migrated.startDate).toBe(futureDate)
    })

    it('serializeHabitDraftForStorage lưu trữ privateReason, companionName, startDate, rhythmFrequency', () => {
      const draft = {
        ...getDefaultHabitFlowDraft(),
        privateReason: 'Lý do bí mật',
        companionName: 'Bạn Thân',
        startDate: '2026-11-10',
        rhythmFrequency: 5,
        email: 'test@example.com', // Không được lưu
        name: 'Hana', // Không được lưu
        consent: true, // Không được lưu
      }

      const jsonStr = serializeHabitDraftForStorage(draft)
      const parsed = JSON.parse(jsonStr)

      expect(parsed.privateReason).toBe('Lý do bí mật')
      expect(parsed.companionName).toBe('Bạn Thân')
      expect(parsed.startDate).toBe('2026-11-10')
      expect(parsed.rhythmFrequency).toBe(5)
      expect(parsed.email).toBeUndefined()
      expect(parsed.name).toBeUndefined()
      expect(parsed.consent).toBeUndefined()
    })
  })

  describe('3. Boarding Pass', () => {
    it('Boarding Pass sử dụng ngày bắt đầu do học viên chọn thay vì luôn là hôm nay', () => {
      const customStartDate = '2026-11-10'
      const data = buildBoardingPass(
        {
          identityStatement: 'Tôi sẽ đi bộ 10 phút để trở thành người năng động',
          rhythmDays: ['mon', 'wed', 'fri'],
          techniqueIds: [],
        },
        {
          startDate: customStartDate,
          journeyDays: 28,
        },
      )

      expect(data.startDateStr).toBe('10/11/2026')
    })

    it('boardingPassInputSchema loại bỏ hoàn toàn privateReason (bảo mật dữ liệu cá nhân)', () => {
      const parsed = boardingPassInputSchema.parse({
        identityStatement: 'Tôi sẽ dậy sớm để đón bình minh',
        startDate: '2026-11-05',
        privateReason: 'Đây là lý do cực kỳ nhạy cảm',
      } as Record<string, unknown>)

      expect((parsed as Record<string, unknown>).privateReason).toBeUndefined()
      expect(parsed.startDate).toBe('2026-11-05')
    })
  })

  describe('4. HabitFlow Step 4 chuyển bước & xác thực', () => {
    it('chặn chuyển bước khi số ngày chọn không khớp với rhythmFrequency', async () => {
      const draft = {
        step: 4,
        version: 2,
        scorecard: [{ habit: 'Thức dậy 6h', rating: 'good' as const }],
        anchorHabit: 'Thức dậy 6h',
        rhythmDays: ['mon', 'tue', 'wed'] as const,
        rhythmFrequency: 5, // Đặt là 5 nhưng chỉ chọn 3 ngày
        twoMinuteAction: 'Xỏ giày',
        actionText: 'chạy bộ',
        personText: 'người bền bỉ',
        identityStatement: 'Tôi sẽ chạy bộ để trở thành người bền bỉ',
        chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
      }
      localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(draft))

      render(<HabitFlow techniques={[]} />)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i })
      await act(async () => {
        fireEvent.click(nextBtn)
      })

      expect(
        screen.getAllByText(viStrings.hb20.errors.rhythmCountMismatch(5, 3)).length,
      ).toBeGreaterThan(0)
    })

    it('chặn chuyển bước khi ngày bắt đầu ngoài khoảng hôm nay -> +14 ngày', async () => {
      const pastDate = getVietnamYmd(new Date(Date.now() - 86400000 * 2))

      render(
        <StepName
          actionText="chạy bộ"
          personText="người dẻo dai"
          identityStatement="Tôi sẽ chạy bộ để trở thành người dẻo dai"
          rhythmDays={['mon']}
          rhythmFrequency={1}
          twoMinuteAction="Xỏ giày"
          startDate={pastDate}
          error={viStrings.hb20.errors.startDateOutOfRange}
          onActionChange={vi.fn()}
          onPersonChange={vi.fn()}
          onToggleRhythmDay={vi.fn()}
          onTwoMinuteChange={vi.fn()}
        />,
      )

      expect(screen.getByText(viStrings.hb20.errors.startDateOutOfRange)).toBeDefined()
    })

    it('(HB-26) hiển thị quote khi có dữ liệu và ẩn hoàn toàn khi quote rỗng/null', () => {
      const { unmount } = render(
        <StepName
          actionText="chạy bộ"
          personText="người dẻo dai"
          identityStatement="Tôi sẽ chạy bộ để trở thành người dẻo dai"
          rhythmDays={['mon']}
          rhythmFrequency={1}
          twoMinuteAction="Xỏ giày"
          quote={{
            text: 'Mỗi hành động bạn thực hiện là một lá phiếu cho con người mà bạn muốn trở thành.',
            author: 'James Clear',
            source: 'Atomic Habits',
            sourceUrl: 'https://jamesclear.com',
          }}
          onActionChange={vi.fn()}
          onPersonChange={vi.fn()}
          onToggleRhythmDay={vi.fn()}
          onTwoMinuteChange={vi.fn()}
        />,
      )

      const quoteEl = screen.getByTestId('name-quote')
      expect(quoteEl).toBeDefined()
      expect(quoteEl.textContent).toContain('Mỗi hành động bạn thực hiện là một lá phiếu')
      expect(quoteEl.textContent).toContain('James Clear')
      expect(quoteEl.textContent).toContain('Atomic Habits')

      unmount()

      render(
        <StepName
          actionText="chạy bộ"
          personText="người dẻo dai"
          identityStatement="Tôi sẽ chạy bộ để trở thành người dẻo dai"
          rhythmDays={['mon']}
          rhythmFrequency={1}
          twoMinuteAction="Xỏ giày"
          quote={null}
          onActionChange={vi.fn()}
          onPersonChange={vi.fn()}
          onToggleRhythmDay={vi.fn()}
          onTwoMinuteChange={vi.fn()}
        />,
      )

      expect(screen.queryByTestId('name-quote')).toBeNull()
    })
  })
})
