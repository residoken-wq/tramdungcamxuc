import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BoardingPassPreview } from '@/components/habit/BoardingPassPreview'
import { HabitLoopWizard } from '@/components/habit/HabitLoopWizard'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('Habit Boarding Pass Component (HB-10)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('BoardingPassPreview: hiển thị đầy đủ thông tin xem trước và 2 nút tải ảnh', () => {
    render(
      <BoardingPassPreview
        identityStatement="Tôi sẽ đọc sách mỗi ngày để mở mang tri thức"
        anchorHabit="Uống cà phê sáng"
        twoMinuteAction="Đọc 1 trang sách"
        rhythmDays={['mon', 'wed', 'fri']}
        techniqueIds={[1]}
        availableTechniques={[{ id: 1, name: 'Đặt sách trên bàn', stage: 'cue' }]}
      />,
    )

    // Tiêu đề khối
    expect(screen.getByText(viStrings.hb10.previewHeading)).toBeDefined()
    expect(screen.getByText(viStrings.hb10.previewSubtitle)).toBeDefined()

    // Câu định danh
    expect(screen.getByText(/Tôi sẽ đọc sách mỗi ngày để mở mang tri thức/)).toBeDefined()

    // Thói quen neo & Bản tối giản
    expect(screen.getByText(/Sau khi Uống cà phê sáng, tôi sẽ Đọc 1 trang sách/)).toBeDefined()

    // 7 ô nhịp tuần
    expect(screen.getByText('T2')).toBeDefined()
    expect(screen.getByText('T3')).toBeDefined()
    expect(screen.getByText('CN')).toBeDefined()
    expect(screen.getByText(viStrings.hb10.rhythmDaysCount(3))).toBeDefined()

    // Kỹ thuật
    expect(screen.getByText(/Đặt sách trên bàn/)).toBeDefined()

    // 2 nút tải ảnh
    const btn45 = screen.getByRole('button', { name: viStrings.hb10.download45 })
    const btn916 = screen.getByRole('button', { name: viStrings.hb10.download916 })
    expect(btn45).toBeDefined()
    expect(btn916).toBeDefined()
  })

  it('BoardingPassPreview: xử lý trạng thái đang tạo ảnh và thông báo lỗi tiếng Việt nếu API thất bại', async () => {
    // Mock fetch trả về lỗi 429
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: false,
        status: 429,
        json: async () => ({ error: viStrings.hb10.rateLimited }),
      } as unknown as Response
    })

    render(<BoardingPassPreview identityStatement="Mục tiêu kiểm tra lỗi" />)

    const btn45 = screen.getByRole('button', { name: viStrings.hb10.download45 })

    await act(async () => {
      fireEvent.click(btn45)
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined()
      expect(screen.getByText(viStrings.hb10.rateLimited)).toBeDefined()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/habit/boarding-pass/anh/4x5',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('HabitLoopWizard: Bước 4 hiển thị khối Boarding Pass của bạn cùng 2 nút tải', async () => {
    // Chuẩn bị nháp ở bước 4
    const draftStep4 = {
      step: 4,
      scorecard: [{ habit: 'Thói quen tốt', rating: 'good', time: '07:00' }],
      actionText: 'chạy bộ 15 phút',
      personText: 'người khỏe mạnh',
      identityStatement: 'Tôi sẽ chạy bộ 15 phút để trở thành người khỏe mạnh',
      anchorHabit: 'Thói quen tốt',
      rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      twoMinuteAction: 'Xỏ giày chạy bộ',
      chosenTechniques: {
        cue: [{ techniqueId: 101, action: 'Để giày ngay cửa' }],
        craving: [],
        response: [],
        reward: [],
      },
      name: 'Nguyễn Văn A',
      email: '',
      consent: false,
    }

    localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(draftStep4))

    render(<HabitLoopWizard techniques={[{ id: 101, name: 'Để giày ngay cửa', stage: 'cue' }]} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Xác nhận đã ở bước 4 và hiển thị Boarding Pass Preview
    expect(screen.getByText(viStrings.hb10.previewHeading)).toBeDefined()
    expect(screen.getByRole('button', { name: viStrings.hb10.download45 })).toBeDefined()
    expect(screen.getByRole('button', { name: viStrings.hb10.download916 })).toBeDefined()
  })
})
