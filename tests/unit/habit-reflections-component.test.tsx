import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/habit/reflection-actions', () => ({
  saveStationReflection: vi.fn(),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as reflectionActions from '@/lib/habit/reflection-actions'
import { StationReflectionModal } from '@/components/habit/StationReflectionModal'
import { ProgressGrid, type ProgressStationItem } from '@/components/ui/ProgressGrid'

describe('Habit Station Reflections Component Tests (HB-12)', () => {
  describe('1. StationReflectionModal', () => {
    const mockQuestions = [
      { question: 'Điều gì làm bạn tự hào nhất trong trạm này?' },
      { question: 'Khó khăn lớn nhất cần vượt qua?' },
    ]

    it('hiển thị tiêu đề trạm, lời dẫn và label có id tương ứng cho từng câu hỏi', () => {
      render(
        <StationReflectionModal
          isOpen={true}
          onClose={vi.fn()}
          stationName="Trạm 1: Khởi động"
          stationIndex={0}
          initialQuestions={mockQuestions}
        />,
      )

      expect(screen.getByText('Suy ngẫm: Trạm 1: Khởi động')).toBeDefined()
      expect(screen.getByText(/Dành vài phút nhìn lại chặng đường vừa qua/i)).toBeDefined()

      // Kiểm tra label và textarea tương ứng
      const label1 = screen.getByText('1. Điều gì làm bạn tự hào nhất trong trạm này?')
      const inputId1 = label1.getAttribute('for')
      expect(inputId1).toBeDefined()
      const textarea1 = document.getElementById(inputId1!)
      expect(textarea1).toBeDefined()

      const label2 = screen.getByText('2. Khó khăn lớn nhất cần vượt qua?')
      const inputId2 = label2.getAttribute('for')
      expect(inputId2).toBeDefined()
      const textarea2 = document.getElementById(inputId2!)
      expect(textarea2).toBeDefined()
    })

    it('submit gọi saveStationReflection với đúng stationIndex và answers', async () => {
      const mockSave = vi.spyOn(reflectionActions, 'saveStationReflection').mockResolvedValue({
        success: true,
        reflectionId: 123,
      })

      const mockSuccess = vi.fn()
      const mockClose = vi.fn()

      render(
        <StationReflectionModal
          isOpen={true}
          onClose={mockClose}
          stationName="Trạm 1: Khởi động"
          stationIndex={0}
          initialQuestions={mockQuestions}
          onSuccess={mockSuccess}
        />,
      )

      const textareas = screen.getAllByPlaceholderText('Viết suy ngẫm của bạn tại đây...')
      fireEvent.change(textareas[0], { target: { value: 'Tôi đã kiên trì 7 ngày' } })

      const submitBtn = screen.getByRole('button', { name: /Lưu suy ngẫm/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(0, ['Tôi đã kiên trì 7 ngày', ''])
        expect(mockSuccess).toHaveBeenCalledWith({
          stationIndex: 0,
          answers: [
            {
              question: 'Điều gì làm bạn tự hào nhất trong trạm này?',
              answer: 'Tôi đã kiên trì 7 ngày',
            },
            {
              question: 'Khó khăn lớn nhất cần vượt qua?',
              answer: '',
            },
          ],
        })
        expect(mockClose).toHaveBeenCalled()
      })

      mockSave.mockRestore()
    })

    it('lỗi server: hiển thị thông báo lỗi tiếng Việt và không đóng modal', async () => {
      const mockSave = vi.spyOn(reflectionActions, 'saveStationReflection').mockResolvedValue({
        success: false,
        error: 'STATION_NOT_OPEN',
        message: 'Trạm này chưa kết thúc. Bài suy ngẫm sẽ mở vào ngày 7.',
      })

      const mockClose = vi.fn()

      render(
        <StationReflectionModal
          isOpen={true}
          onClose={mockClose}
          stationName="Trạm 1: Khởi động"
          stationIndex={0}
          initialQuestions={mockQuestions}
        />,
      )

      const textareas = screen.getAllByPlaceholderText('Viết suy ngẫm của bạn tại đây...')
      fireEvent.change(textareas[0], { target: { value: 'Trả lời thử' } })

      const submitBtn = screen.getByRole('button', { name: /Lưu suy ngẫm/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(
          screen.getByText('Trạm này chưa kết thúc. Bài suy ngẫm sẽ mở vào ngày 7.'),
        ).toBeDefined()
        expect(mockClose).not.toHaveBeenCalled()
      })

      mockSave.mockRestore()
    })

    it('chế độ readOnly: hiện thông báo hết hạn và không hiển thị nút Lưu suy ngẫm', () => {
      render(
        <StationReflectionModal
          isOpen={true}
          onClose={vi.fn()}
          stationName="Trạm 1: Khởi động"
          stationIndex={0}
          initialQuestions={mockQuestions}
          readOnly={true}
        />,
      )

      expect(screen.getByText(/Quyền truy cập của bạn đã hết hạn/i)).toBeDefined()
      expect(screen.queryByRole('button', { name: /Lưu suy ngẫm/i })).toBeNull()
      expect(screen.getAllByRole('button', { name: /Đóng/i })).toHaveLength(2)
    })
  })

  describe('2. Thanh suy ngẫm trạm trong ProgressGrid', () => {
    it('trạm không có câu hỏi trong CMS -> không hiển thị nút suy ngẫm', () => {
      const mockStations: ProgressStationItem[] = [
        {
          name: 'Trạm không có câu hỏi',
          fromDay: 1,
          toDay: 7,
          days: [{ day: 1, status: 'voted' }],
          reflectionQuestions: [], // Rỗng
        },
      ]

      render(<ProgressGrid stations={mockStations} />)

      expect(screen.queryByRole('button', { name: /Suy ngẫm trạm/i })).toBeNull()
      expect(screen.queryByRole('button', { name: /Xem \/ sửa suy ngẫm/i })).toBeNull()
    })

    it('trạm chưa mở (isReflectionOpen = false) -> nút bị vô hiệu hóa kèm dòng "Mở vào ngày N"', () => {
      const mockStations: ProgressStationItem[] = [
        {
          index: 1,
          name: 'Trạm 2: Vượt ỳ',
          fromDay: 8,
          toDay: 14,
          days: [{ day: 8, status: 'future', disabled: true }],
          reflectionQuestions: [{ question: 'Câu hỏi trạm 2' }],
          isReflectionOpen: false,
          hasReflection: false,
        },
      ]

      render(<ProgressGrid stations={mockStations} />)

      const btn = screen.getByRole('button', { name: /Suy ngẫm trạm/i }) as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(screen.getByText('Mở vào ngày 15')).toBeDefined()
    })

    it('trạm đã mở và đã suy ngẫm -> hiện badge "Đã suy ngẫm" và nút "Xem / sửa suy ngẫm"', () => {
      const mockOpen = vi.fn()
      const mockStations: ProgressStationItem[] = [
        {
          index: 0,
          name: 'Trạm 1: Khởi động',
          fromDay: 1,
          toDay: 7,
          days: [{ day: 1, status: 'voted' }],
          reflectionQuestions: [{ question: 'Câu hỏi trạm 1' }],
          isReflectionOpen: true,
          hasReflection: true,
          onOpenReflection: mockOpen,
        },
      ]

      render(<ProgressGrid stations={mockStations} />)

      expect(screen.getByText('Đã suy ngẫm')).toBeDefined()
      const btn = screen.getByRole('button', { name: /Xem \/ sửa suy ngẫm/i }) as HTMLButtonElement
      expect(btn.disabled).toBe(false)

      fireEvent.click(btn)
      expect(mockOpen).toHaveBeenCalledWith(0)
    })
  })
})
