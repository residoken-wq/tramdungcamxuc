import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StepMentor } from '@/components/habit/flow/StepMentor'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import { migrateHabitDraft } from '@/components/habit/flow/draft'
import { vi as viStrings } from '@/lib/i18n/vi'
import type { HabitScorecardItem } from '@/lib/habit'

describe('HB-19: Step 3 "Tìm Mentor" unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('1. Render đầy đủ Phần 1 "Soi lại một ngày của bạn" và Phần 2 "Chọn Mentor"', () => {
    const onAdd = vi.fn()
    const onTime = vi.fn()
    const onSelect = vi.fn()
    const onRemove = vi.fn()
    const onRating = vi.fn()
    const onError = vi.fn()

    render(
      <StepMentor
        scorecard={[]}
        anchorHabit=""
        onAddHabit={onAdd}
        onUpdateTime={onTime}
        onSelectAnchor={onSelect}
        onRemoveHabit={onRemove}
        onUpdateRating={onRating}
        onError={onError}
      />,
    )

    expect(screen.getAllByText(viStrings.hb19.stepTitle).length).toBeGreaterThan(0)
    expect(screen.getByText(viStrings.hb19.part1.title)).toBeDefined()
    expect(screen.getByText(viStrings.hb19.part2.title)).toBeDefined()
    expect(screen.getByRole('button', { name: viStrings.hb19.part1.addButton })).toBeDefined()
    expect(screen.getByText(viStrings.hb19.part1.emptyPrompt)).toBeDefined()
    expect(screen.getByText(viStrings.hb19.part2.noGoodHabitsPrompt)).toBeDefined()
  })

  it('2. Mỗi dấu có chữ đi kèm, không chỉ dựa vào màu (+ Có ích, = Trung tính, − Không có ích)', () => {
    const scorecard: HabitScorecardItem[] = [
      { habit: 'Uống cà phê sáng', rating: 'good' },
      { habit: 'Lướt mạng xã hội', rating: 'bad' },
      { habit: 'Rửa mặt', rating: 'neutral' },
    ]

    render(
      <StepMentor
        scorecard={scorecard}
        anchorHabit=""
        onAddHabit={vi.fn()}
        onUpdateTime={vi.fn()}
        onSelectAnchor={vi.fn()}
        onRemoveHabit={vi.fn()}
        onUpdateRating={vi.fn()}
        onError={vi.fn()}
      />,
    )

    // Kiểm tra chữ hiển thị rõ ràng trên các nút
    expect(screen.getAllByText('Có ích').length).toBe(3)
    expect(screen.getAllByText('Trung tính').length).toBe(3)
    expect(screen.getAllByText('Không có ích').length).toBe(3)

    // Kiểm tra aria-pressed của nút active
    const goodBtn = screen.getByLabelText(
      viStrings.hb19.part1.ratings.good.ariaLabel('Uống cà phê sáng'),
    )
    expect(goodBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('3. Chỉ cho chọn Mentor trong các việc đã đánh dấu (+)', () => {
    const scorecard: HabitScorecardItem[] = [
      { habit: 'Tập thể dục 15p', rating: 'good' },
      { habit: 'Uống nước ấm', rating: 'good' },
      { habit: 'Xem video ngắn', rating: 'bad' },
      { habit: 'Đọc tin tức', rating: 'neutral' },
    ]
    const onSelectAnchor = vi.fn()

    render(
      <StepMentor
        scorecard={scorecard}
        anchorHabit=""
        onAddHabit={vi.fn()}
        onUpdateTime={vi.fn()}
        onSelectAnchor={onSelectAnchor}
        onRemoveHabit={vi.fn()}
        onUpdateRating={vi.fn()}
        onError={vi.fn()}
      />,
    )

    // Chỉ có 2 radio buttons cho 2 việc có rating 'good'
    const radios = screen.getAllByRole('radio', {
      name: new RegExp(viStrings.hb09.step1.anchorRadioLabel, 'i'),
    })
    expect(radios.length).toBe(2)

    // Việc 'Xem video ngắn' (bad) và 'Đọc tin tức' (neutral) không có radio chọn Mentor
    expect(
      screen.queryByLabelText(
        new RegExp(`${viStrings.hb09.step1.anchorRadioLabel}: Xem video ngắn`, 'i'),
      ),
    ).toBeNull()
    expect(
      screen.queryByLabelText(
        new RegExp(`${viStrings.hb09.step1.anchorRadioLabel}: Đọc tin tức`, 'i'),
      ),
    ).toBeNull()

    // Bấm chọn 'Tập thể dục 15p' làm Mentor
    fireEvent.click(radios[0])
    expect(onSelectAnchor).toHaveBeenCalledWith('Tập thể dục 15p')
  })

  it('4. Ô "Việc này thường diễn ra lúc mấy giờ?" gắn vào việc được chọn làm Mentor', () => {
    const scorecard: HabitScorecardItem[] = [
      { habit: 'Thức dậy', rating: 'good', time: '06:00' },
      { habit: 'Đánh răng', rating: 'good' },
    ]
    const onUpdateTime = vi.fn()

    render(
      <StepMentor
        scorecard={scorecard}
        anchorHabit="Thức dậy"
        onAddHabit={vi.fn()}
        onUpdateTime={onUpdateTime}
        onSelectAnchor={vi.fn()}
        onRemoveHabit={vi.fn()}
        onUpdateRating={vi.fn()}
        onError={vi.fn()}
      />,
    )

    // Ô chọn giờ AM/PM xuất hiện cho Mentor được chọn (06:00 -> 6:00 AM)
    const timeGroup = screen.getByRole('group', {
      name: viStrings.hb19.part2.timeAriaLabel('Thức dậy'),
    })
    expect(timeGroup).toBeDefined()
    const hourSelect = within(timeGroup).getByLabelText('Giờ') as HTMLSelectElement
    const minuteSelect = within(timeGroup).getByLabelText('Phút') as HTMLSelectElement
    const periodSelect = within(timeGroup).getByLabelText('Buổi (AM hoặc PM)') as HTMLSelectElement
    expect(hourSelect.value).toBe('6')
    expect(minuteSelect.value).toBe('00')
    expect(periodSelect.value).toBe('AM')

    // Đổi phút sang 15 -> '06:15'
    fireEvent.change(minuteSelect, { target: { value: '15' } })
    expect(onUpdateTime).toHaveBeenCalledWith(0, '06:15')
  })

  it('5. Việc đang là Mentor mà khách đổi sang − / = hoặc xoá đi -> bỏ chọn Mentor kèm thông báo', () => {
    const scorecard: HabitScorecardItem[] = [
      { habit: 'Đánh răng sáng', rating: 'good' },
      { habit: 'Tắm nước ấm', rating: 'good' },
    ]
    const onSelectAnchor = vi.fn()
    const onUpdateRating = vi.fn()
    const onRemoveHabit = vi.fn()

    const { rerender } = render(
      <StepMentor
        scorecard={scorecard}
        anchorHabit="Đánh răng sáng"
        onAddHabit={vi.fn()}
        onUpdateTime={vi.fn()}
        onSelectAnchor={onSelectAnchor}
        onRemoveHabit={onRemoveHabit}
        onUpdateRating={onUpdateRating}
        onError={vi.fn()}
      />,
    )

    // Đổi 'Đánh răng sáng' sang neutral (=)
    const neutralBtn = screen.getByLabelText(
      viStrings.hb19.part1.ratings.neutral.ariaLabel('Đánh răng sáng'),
    )
    fireEvent.click(neutralBtn)

    // onSelectAnchor('') được gọi để bỏ chọn Mentor
    expect(onSelectAnchor).toHaveBeenCalledWith('')
    expect(onUpdateRating).toHaveBeenCalledWith(0, 'neutral')

    // Thông báo bỏ chọn Mentor xuất hiện
    expect(screen.getByText(viStrings.hb19.part2.unselectedMentorNotice)).toBeDefined()

    // Trường hợp 5b: Xóa việc đang là Mentor
    rerender(
      <StepMentor
        scorecard={scorecard}
        anchorHabit="Đánh răng sáng"
        onAddHabit={vi.fn()}
        onUpdateTime={vi.fn()}
        onSelectAnchor={onSelectAnchor}
        onRemoveHabit={onRemoveHabit}
        onUpdateRating={onUpdateRating}
        onError={vi.fn()}
      />,
    )

    const deleteBtn = screen.getByLabelText(viStrings.hb19.part1.deleteButtonAria('Đánh răng sáng'))
    fireEvent.click(deleteBtn)

    expect(onSelectAnchor).toHaveBeenCalledWith('')
    expect(onRemoveHabit).toHaveBeenCalledWith(0)
    expect(screen.getByText(viStrings.hb19.part2.deletedMentorNotice)).toBeDefined()
  })

  it('6. Hiển thị câu trích bước 3 từ stepQuotes.mentor nếu có', () => {
    render(
      <StepMentor
        scorecard={[]}
        anchorHabit=""
        onAddHabit={vi.fn()}
        onUpdateTime={vi.fn()}
        onSelectAnchor={vi.fn()}
        onRemoveHabit={vi.fn()}
        onUpdateRating={vi.fn()}
        onError={vi.fn()}
        quote={{
          text: 'Thói quen mới cần một điểm tựa vững chắc để nảy mầm.',
          author: 'James Clear',
          source: 'Atomic Habits',
          sourceUrl: 'https://example.com/atomic-habits',
        }}
      />,
    )

    expect(screen.getByTestId('mentor-quote')).toBeDefined()
    expect(screen.getByText(/Thói quen mới cần một điểm tựa vững chắc/i)).toBeDefined()
    expect(screen.getByText(/James Clear/i)).toBeDefined()
    expect(screen.getByText(/Atomic Habits/i)).toBeDefined()
  })

  it('7. Không có việc (+) thì nút Tiếp bị tắt (disabled) trong HabitFlow', async () => {
    render(<HabitFlow techniques={[]} />)

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // B1 Khám -> B2 1% -> B3 Tìm Mentor
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sang giai đoạn 2/i }))
    })

    expect(screen.getByText('Bước 3 / 6')).toBeDefined()

    // Chưa thêm việc nào: nút Tiếp tục bị disabled
    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i }) as HTMLButtonElement
    expect(nextBtn.disabled).toBe(true)

    // Thêm 1 việc trung tính (=)
    const input = screen.getByPlaceholderText(viStrings.hb19.part1.addInputPlaceholder)
    const ratingSelect = screen.getByLabelText(viStrings.habit.wizard.errors.ratingAria)
    const addBtn = screen.getByRole('button', { name: viStrings.hb19.part1.addButton })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Lướt tin tức' } })
      fireEvent.change(ratingSelect, { target: { value: 'neutral' } })
      fireEvent.click(addBtn)
    })

    // Vẫn chưa có việc (+): nút Tiếp tục vẫn bị disabled
    expect(nextBtn.disabled).toBe(true)

    // Đổi 'Lướt tin tức' sang (+)
    const goodBtn = screen.getByLabelText(
      viStrings.hb19.part1.ratings.good.ariaLabel('Lướt tin tức'),
    )
    await act(async () => {
      fireEvent.click(goodBtn)
    })

    // Đã có việc (+): nút Tiếp tục được bật (enabled)
    expect(nextBtn.disabled).toBe(false)

    // Bấm Tiếp tục khi chưa chọn Mentor -> báo lỗi anchorRequired với role="alert"
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    expect(screen.getByText(viStrings.hb19.errors.anchorRequired)).toBeDefined()
    const alert = screen.getByRole('alert')
    expect(alert).toBeDefined()
    expect(alert.textContent).toContain(viStrings.hb19.errors.anchorRequired)
  })

  it('8. Nháp cũ: migrateHabitDraft bỏ chọn anchorHabit nếu không còn là việc (+)', () => {
    const rawDraft = {
      version: 2,
      step: 3,
      scorecard: [
        { habit: 'Thức dậy 6h', rating: 'bad' },
        { habit: 'Uống nước', rating: 'neutral' },
      ],
      anchorHabit: 'Thức dậy 6h', // Không còn là việc good
    }

    const migrated = migrateHabitDraft(rawDraft)
    expect(migrated.anchorHabit).toBe('')
  })
})
