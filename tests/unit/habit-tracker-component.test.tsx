import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/habit/tracker-actions', () => ({
  checkInDay: vi.fn(),
}))

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as trackerActions from '@/lib/habit/tracker-actions'
import { CheckInModal } from '@/components/habit/CheckInModal'
import { ProgressGrid, type ProgressStationItem } from '@/components/ui/ProgressGrid'

describe('Habit Tracker Component Tests (HB-11)', () => {
  describe('1. CheckInModal với 4 trạng thái', () => {
    it('ngày bỏ phiếu (isVotingDay=true): không hiện lựa chọn "Nghỉ"', () => {
      render(
        <CheckInModal
          day={1}
          isOpen={true}
          isVotingDay={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      expect(screen.getByRole('radio', { name: /Bỏ phiếu/i })).toBeDefined()
      expect(screen.getByRole('radio', { name: /Bản tối giản/i })).toBeDefined()
      expect(screen.getByRole('radio', { name: /Lỡ nhịp/i })).toBeDefined()
      expect(screen.queryByRole('radio', { name: /Nghỉ/i })).toBeNull()
      expect(screen.queryByText(/không tính vào 90%/i)).toBeNull()
    })

    it('ngày bỏ phiếu hiện câu twoMinuteAction nếu có', () => {
      render(
        <CheckInModal
          day={1}
          isOpen={true}
          isVotingDay={true}
          twoMinuteAction="Tập hít thở 3 hơi sâu"
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      expect(screen.getByText('Tập hít thở 3 hơi sâu')).toBeDefined()
    })

    it('ngày nghỉ theo nhịp (isVotingDay=false): có đủ 4 lựa chọn và dòng nhắc nhở 90%', () => {
      render(
        <CheckInModal
          day={6}
          isOpen={true}
          isVotingDay={false}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      expect(screen.getByRole('radio', { name: /Bỏ phiếu/i })).toBeDefined()
      expect(screen.getByRole('radio', { name: /Bản tối giản/i })).toBeDefined()
      expect(screen.getByRole('radio', { name: /Lỡ nhịp/i })).toBeDefined()
      expect(screen.getByRole('radio', { name: /Nghỉ/i })).toBeDefined()
      expect(
        screen.getByText('Ngày nghỉ theo nhịp – ghi gì cũng không tính vào 90%'),
      ).toBeDefined()
    })

    it('submit gửi đúng status qua checkInDay và gọi onSuccess', async () => {
      const mockCheckIn = vi.spyOn(trackerActions, 'checkInDay').mockResolvedValue({
        success: true,
        day: 2,
        status: 'minimal',
        done: true,
      })

      const mockSuccess = vi.fn()
      const mockClose = vi.fn()

      render(
        <CheckInModal
          day={2}
          isOpen={true}
          isVotingDay={true}
          onClose={mockClose}
          onSuccess={mockSuccess}
        />,
      )

      // Chọn Bản tối giản
      const minimalRadio = screen.getByRole('radio', { name: /Bản tối giản/i })
      fireEvent.click(minimalRadio)

      // Bấm submit
      const submitBtn = screen.getByRole('button', { name: /Lưu check-in/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockCheckIn).toHaveBeenCalledWith(2, undefined, null, '', 'minimal')
        expect(mockSuccess).toHaveBeenCalledWith(2, 'minimal', null, '')
        expect(mockClose).toHaveBeenCalled()
      })

      mockCheckIn.mockRestore()
    })

    it('lỗi server: hiện thông báo lỗi tiếng Việt và không đóng modal', async () => {
      const mockCheckIn = vi.spyOn(trackerActions, 'checkInDay').mockResolvedValue({
        success: false,
        error: 'REST_ON_VOTING_DAY',
        message: 'Hôm nay là ngày bỏ phiếu theo nhịp của bạn, không ghi nghỉ được.',
      })

      const mockClose = vi.fn()

      render(
        <CheckInModal
          day={3}
          isOpen={true}
          isVotingDay={true}
          onClose={mockClose}
          onSuccess={vi.fn()}
        />,
      )

      const submitBtn = screen.getByRole('button', { name: /Lưu check-in/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(
          screen.getByText('Hôm nay là ngày bỏ phiếu theo nhịp của bạn, không ghi nghỉ được.'),
        ).toBeDefined()
        expect(mockClose).not.toHaveBeenCalled()
      })

      mockCheckIn.mockRestore()
    })
  })

  describe('2. ProgressGrid chia theo trạm', () => {
    const mockStations: ProgressStationItem[] = [
      {
        name: 'Trạm 1: Khởi động',
        fromDay: 1,
        toDay: 7,
        votedCount: 2,
        votingDaysTotal: 5,
        days: [
          { day: 1, status: 'voted', emotionKey: 'peaceful' },
          { day: 2, status: 'minimal' },
          { day: 3, status: 'today' },
          { day: 4, status: 'future', disabled: true },
          { day: 5, status: 'future', disabled: true },
          { day: 6, status: 'rest' },
          { day: 7, status: 'rest', disabled: true },
        ],
      },
    ]

    it('hiển thị khối trạm với tên, khoảng ngày và tiến độ trạm', () => {
      render(<ProgressGrid stations={mockStations} />)

      expect(screen.getByText('Trạm 1: Khởi động')).toBeDefined()
      expect(screen.getByText('Ngày 1 – 7')).toBeDefined()
      expect(screen.getByText('2/5 ngày bỏ phiếu')).toBeDefined()
    })

    it('aria-label hiển thị đủ ngày, trạng thái và cảm xúc', () => {
      render(<ProgressGrid stations={mockStations} />)

      // Ngày 1: Bỏ phiếu, cảm xúc: Bình an
      expect(
        screen.getByRole('button', { name: /Ngày 1: Bỏ phiếu, cảm xúc: Bình an/i }),
      ).toBeDefined()

      // Ngày 2: Bản tối giản
      expect(screen.getByRole('button', { name: /Ngày 2: Bản tối giản/i })).toBeDefined()

      // Ngày 3: Hôm nay
      expect(screen.getByRole('button', { name: /Ngày 3: Hôm nay/i })).toBeDefined()

      // Ngày 6: Nghỉ
      expect(screen.getByRole('button', { name: /Ngày 6: Nghỉ/i })).toBeDefined()
    })

    it('ngày chưa tới (disabled) không thể click', () => {
      const mockSelect = vi.fn()
      render(<ProgressGrid stations={mockStations} onSelectDay={mockSelect} />)

      const day4 = screen.getByRole('button', { name: /Ngày 4: Chưa tới/i })
      expect((day4 as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(day4)
      expect(mockSelect).not.toHaveBeenCalled()
    })
  })
})
