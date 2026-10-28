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

  it('bước 1: chọn thói quen neo, nhập giờ tùy chọn và chuyển bước 2', async () => {
    render(<HabitLoopWizard techniques={[]} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // 1. Thêm thói quen tốt (+)
    const input = screen.getByPlaceholderText(viStrings.habit.wizard.step1.addPlaceholder)
    const ratingSelect = screen.getByLabelText(viStrings.habit.wizard.errors.ratingAria)
    const addBtn = screen.getByRole('button', { name: viStrings.habit.wizard.step1.addButton })

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
    expect(screen.getByText(viStrings.hb09.step1.anchorBadge)).toBeDefined()

    // Nhập giờ tùy chọn
    const timeInput = screen.getByLabelText(
      viStrings.hb09.step1.timeAriaLabel('Uống 1 cốc nước ấm'),
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

    // Kiểm tra dòng chỉ đọc ngày bắt đầu & dòng nhắc dữ liệu riêng tư
    expect(screen.getByText(new RegExp(viStrings.hb09.step2.privateDataNote, 'i'))).toBeDefined()

    // Kiểm tra 7 nút nhịp tuần đang bật (aria-pressed = true)
    const rhythmOptions = viStrings.hb03.fields.rhythmDaysOptions
    const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    for (const d of allDays) {
      const btn = screen.getByRole('button', { name: rhythmOptions[d] })
      expect(btn.getAttribute('aria-pressed')).toBe('true')
    }

    // Nhập hành động dưới 2 phút (20 ký tự: 'Rót một cốc nước sẵn')
    const twoMinInput = screen.getByPlaceholderText(
      viStrings.hb09.step2.twoMinutePlaceholder,
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

    expect(screen.getByText(viStrings.hb09.step2.rhythmEmptyError)).toBeDefined()

    // Bật lại Thứ 2
    const monBtn = screen.getByRole('button', { name: rhythmOptions.mon })
    await act(async () => {
      fireEvent.click(monBtn)
    })
    expect(monBtn.getAttribute('aria-pressed')).toBe('true')

    // Bấm Tiếp tục -> chuyển bước 3 thành công
    await act(async () => {
      fireEvent.click(nextBtn)
    })
    expect(screen.getByRole('heading', { name: viStrings.habit.wizard.step3.title })).toBeDefined()
  })
})
