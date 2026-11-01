import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HabitLoopWizard } from '@/components/habit/HabitLoopWizard'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('HB-09: Component tests for HabitLoopWizard B3-B4 interaction', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('bước 3 (Tìm Mentor): chọn thói quen neo, nhập giờ tùy chọn và chuyển bước 4 (Gọi tên)', async () => {
    render(<HabitLoopWizard techniques={[]} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Đi qua Bước 1 (Khám đúng bệnh) -> Bước 2 (Nguyên lý 1%) -> Bước 3 (Tìm Mentor)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sang giai đoạn 2/i }))
    })

    // 1. Thêm thói quen tốt (+)
    const input = screen.getByPlaceholderText(viStrings.hb19.part1.addInputPlaceholder)
    const ratingSelect = screen.getByLabelText(viStrings.habit.wizard.errors.ratingAria)
    const addBtn = screen.getByRole('button', { name: viStrings.hb19.part1.addButton })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Uống 1 cốc nước ấm' } })
      fireEvent.change(ratingSelect, { target: { value: 'good' } })
      fireEvent.click(addBtn)
    })

    // Radio chọn thói quen neo xuất hiện
    const anchorRadio = screen.getByLabelText(
      new RegExp(`${viStrings.hb09.step1.anchorRadioLabel}: Uống 1 cốc nước ấm`, 'i'),
    ) as HTMLInputElement
    expect(anchorRadio).toBeDefined()
    expect(anchorRadio.checked).toBe(false)

    // Chọn thói quen neo
    await act(async () => {
      fireEvent.click(anchorRadio)
    })
    expect(anchorRadio.checked).toBe(true)
    expect(screen.getAllByText(viStrings.hb19.part2.selectedBadge).length).toBeGreaterThan(0)

    // Nhập giờ tùy chọn
    const timeInput = screen.getByLabelText(
      viStrings.hb19.part2.timeAriaLabel('Uống 1 cốc nước ấm'),
    ) as HTMLInputElement
    await act(async () => {
      fireEvent.change(timeInput, { target: { value: '06:30' } })
    })
    expect(timeInput.value).toBe('06:30')

    // Bấm Tiếp tục -> bước 2
    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i })
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    expect(screen.getByRole('heading', { name: viStrings.habit.wizard.step2.title })).toBeDefined()
  })

  it('bước 2: hiển thị gợi ý neo, bật/tắt ngày nhịp tuần, lỗi khi bỏ hết ngày', async () => {
    // Khởi tạo nháp đã có thói quen neo ở bước 1 và đang ở bước 2
    const draftStep2 = {
      step: 2,
      scorecard: [{ habit: 'Thức dậy 6h', rating: 'good' as const }],
      anchorHabit: 'Thức dậy 6h',
      rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
      twoMinuteAction: '',
      actionText: 'uống nước ấm',
      personText: 'người khỏe mạnh',
      identityStatement: 'Tôi sẽ uống nước ấm để trở thành người khỏe mạnh',
      chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
    }
    localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(draftStep2))

    render(<HabitLoopWizard techniques={[]} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Kiểm tra câu gợi ý công thức neo xuất hiện
    expect(screen.getByText(/Sau khi Thức dậy 6h, tôi sẽ uống nước ấm/i)).toBeDefined()

    // Kiểm tra các phần mới HB-20: lý do riêng tư & ngày bắt đầu
    expect(screen.getByText(new RegExp(viStrings.hb20.privateReason.title, 'i'))).toBeDefined()
    expect(screen.getByText(new RegExp(viStrings.hb20.startDate.title, 'i'))).toBeDefined()

    // Kiểm tra 7 nút nhịp tuần đang bật (aria-pressed = true)
    const rhythmOptions = viStrings.hb03.fields.rhythmDaysOptions
    const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    for (const d of allDays) {
      const btn = screen.getByRole('button', { name: rhythmOptions[d] })
      expect(btn.getAttribute('aria-pressed')).toBe('true')
    }

    // Nhập hành động dưới 2 phút (20 ký tự: 'Rót một cốc nước sẵn')
    const twoMinInput = screen.getByPlaceholderText(
      viStrings.hb20.coreHabit.placeholder,
    ) as HTMLInputElement
    await act(async () => {
      fireEvent.change(twoMinInput, { target: { value: 'Rót một cốc nước sẵn' } })
    })
    expect(screen.getByText('20/200')).toBeDefined()

    // Bỏ tick cả 7 ngày
    for (const d of allDays) {
      const btn = screen.getByRole('button', { name: rhythmOptions[d] })
      await act(async () => {
        fireEvent.click(btn)
      })
      expect(btn.getAttribute('aria-pressed')).toBe('false')
    }

    // Bấm Tiếp tục khi 0 ngày được chọn -> báo lỗi bước
    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i })
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    expect(screen.getAllByText(viStrings.hb20.errors.rhythmEmpty).length).toBeGreaterThan(0)

    // Chọn nhịp 1 lần/tuần và bật lại Thứ 2
    const freq1Btn = screen.getByRole('button', {
      name: viStrings.hb20.rhythm.frequencyButtonAria(1),
    })
    await act(async () => {
      fireEvent.click(freq1Btn)
    })

    const monBtn = screen.getByRole('button', { name: rhythmOptions.mon })
    await act(async () => {
      fireEvent.click(monBtn)
    })
    expect(monBtn.getAttribute('aria-pressed')).toBe('true')

    // Bấm Tiếp tục -> chuyển bước tiếp theo thành công
    await act(async () => {
      fireEvent.click(nextBtn)
    })
    expect(screen.getByRole('heading', { name: viStrings.hb21.stepTitle })).toBeDefined()
  })
})
