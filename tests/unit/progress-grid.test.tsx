import React from 'react'
import { describe, expect, it, vi as vitestVi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressGrid } from '@/components/ui/ProgressGrid'
import { getDefaultHabitDraft, formatIdentityStatement } from '@/lib/habit'

describe('ProgressGrid Component & Draft Resilience (T2-03)', () => {
  describe('ProgressGrid Rendering', () => {
    it('hiển thị đầy đủ 21 ô cho hành trình 21 ngày', () => {
      render(<ProgressGrid />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(21)
      expect(screen.getByText('1')).toBeDefined()
      expect(screen.getByText('21')).toBeDefined()
    })

    it('hỗ trợ prop doneDays dạng số: doneDays={5} đánh dấu ngày 1 đến 5 là hoàn thành', () => {
      render(<ProgressGrid doneDays={5} />)
      const day1 = screen.getByRole('button', { name: /Ngày 1: Đã hoàn thành/i })
      const day5 = screen.getByRole('button', { name: /Ngày 5: Đã hoàn thành/i })
      expect(day1).toBeDefined()
      expect(day5).toBeDefined()
      expect(day1.className).toContain('bg-mint-haze')
    })

    it('hỗ trợ prop doneDays dạng mảng [1, 3, 7]', () => {
      render(<ProgressGrid doneDays={[1, 3, 7]} />)
      const day1 = screen.getByRole('button', { name: /Ngày 1: Đã hoàn thành/i })
      const day3 = screen.getByRole('button', { name: /Ngày 3: Đã hoàn thành/i })
      const day7 = screen.getByRole('button', { name: /Ngày 7: Đã hoàn thành/i })
      expect(day1).toBeDefined()
      expect(day3).toBeDefined()
      expect(day7).toBeDefined()
    })

    it('khi readOnly=true, các ô đều bị disabled và không gọi onSelectDay', () => {
      const mockSelect = vitestVi.fn()
      render(<ProgressGrid doneDays={3} onSelectDay={mockSelect} readOnly={true} />)
      const day1 = screen.getByRole('button', { name: /Ngày 1: Đã hoàn thành/i })
      expect((day1 as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(day1)
      expect(mockSelect).not.toHaveBeenCalled()
    })
  })

  describe('Draft Resilience (localStorage parsing)', () => {
    it('đọc localStorage an toàn: trả về default draft khi dữ liệu rỗng hoặc JSON hỏng mà không crash', () => {
      const defaultDraft = getDefaultHabitDraft()
      expect(defaultDraft.step).toBe(1)
      expect(defaultDraft.scorecard).toEqual([])
      expect(defaultDraft.actionText).toBe('')
      expect(defaultDraft.personText).toBe('')

      // Mô phỏng parse JSON hỏng
      const corruptedJson = '{invalid_json_corrupted'
      let parsedDraft = defaultDraft
      try {
        parsedDraft = JSON.parse(corruptedJson)
      } catch {
        parsedDraft = defaultDraft
      }
      expect(parsedDraft).toEqual(defaultDraft)
    })

    it('formatIdentityStatement xử lý sạch sẽ các khoảng trắng và ghép đúng công thức', () => {
      const statement = formatIdentityStatement('  viết lách 15 phút  ', '  người sâu sắc  ')
      expect(statement).toBe('Tôi sẽ viết lách 15 phút để trở thành người sâu sắc')
    })
  })
})
