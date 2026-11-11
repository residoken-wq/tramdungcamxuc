import React, { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import {
  addVietnamDays,
  formatVietnamDate,
  formatVietnamShortDate,
  formatTimeAmPm,
  parse24hTime,
  to24hTime,
} from '@/lib/habit/tracker-stats'
import { TimePickerAmPm } from '@/components/habit/TimePickerAmPm'

afterEach(cleanup)

function ControlledTimePicker({
  initialValue = '',
  onValueChange,
}: {
  initialValue?: string
  onValueChange: (val: string) => void
}) {
  const [val, setVal] = useState(initialValue)
  return (
    <TimePickerAmPm
      id="test-controlled-time"
      value={val}
      onChange={(next) => {
        setVal(next)
        onValueChange(next)
      }}
    />
  )
}

describe('AU-01 Mục 1: Định dạng ngày về đích theo giờ Việt Nam', () => {
  it('định dạng ngày có giờ, không bị vỡ chuỗi T00:00', () => {
    const isoString = '2026-12-07T00:00:00+07:00'
    expect(formatVietnamDate(isoString)).toBe('07/12/2026')
    expect(formatVietnamShortDate(isoString)).toBe('07/12')
  })

  it('định dạng ngày có giờ phút bất kỳ theo đúng múi giờ VN (UTC+7)', () => {
    // 2026-10-28 23:30 UTC = 2026-10-29 06:30 VN
    const utcDate = new Date('2026-10-28T23:30:00Z')
    expect(formatVietnamDate(utcDate)).toBe('29/10/2026')
  })

  it('định dạng ngày nhảy qua tháng', () => {
    const endOfMonth = addVietnamDays('2026-01-20', 15) // 2026-02-04
    expect(formatVietnamDate(endOfMonth)).toBe('04/02/2026')
    expect(formatVietnamShortDate(endOfMonth)).toBe('04/02')
  })

  it('định dạng ngày nhảy qua năm mới', () => {
    // 28 ngày bắt đầu từ 15/12/2026 -> về đích 11/01/2027
    const nextYear = addVietnamDays('2026-12-15', 27)
    expect(formatVietnamDate(nextYear)).toBe('11/01/2027')
    expect(formatVietnamShortDate(nextYear)).toBe('11/01')
  })

  it('trả về chuỗi rỗng khi ngày thiếu, null, undefined hoặc không hợp lệ', () => {
    expect(formatVietnamDate(null)).toBe('')
    expect(formatVietnamDate(undefined)).toBe('')
    expect(formatVietnamDate('')).toBe('')
    expect(formatVietnamDate('invalid-date')).toBe('')
    expect(formatVietnamShortDate(null)).toBe('')
    expect(formatVietnamShortDate(undefined)).toBe('')
    expect(formatVietnamShortDate('')).toBe('')
  })
})

describe('AU-01 Mục 2: Ô chọn giờ AM/PM', () => {
  it('chuyển đổi 12h + AM/PM sang 24h và ngược lại', () => {
    // 6 AM -> 06:00, 6 PM -> 18:00
    expect(to24hTime(6, '00', 'AM')).toBe('06:00')
    expect(to24hTime(6, '00', 'PM')).toBe('18:00')
    // 12 AM -> 00:00, 12 PM -> 12:00
    expect(to24hTime(12, '00', 'AM')).toBe('00:00')
    expect(to24hTime(12, '00', 'PM')).toBe('12:00')

    // Parse ngược lại
    expect(parse24hTime('06:00')).toEqual({ hour12: 6, minute: '00', period: 'AM' })
    expect(parse24hTime('18:00')).toEqual({ hour12: 6, minute: '00', period: 'PM' })
    expect(parse24hTime('00:00')).toEqual({ hour12: 12, minute: '00', period: 'AM' })
    expect(parse24hTime('12:00')).toEqual({ hour12: 12, minute: '00', period: 'PM' })

    // formatTimeAmPm
    expect(formatTimeAmPm('06:00')).toBe('6:00 AM')
    expect(formatTimeAmPm('18:00')).toBe('6:00 PM')
    expect(formatTimeAmPm('00:00')).toBe('12:00 AM')
    expect(formatTimeAmPm('12:00')).toBe('12:00 PM')
    expect(formatTimeAmPm('')).toBe('')
    expect(formatTimeAmPm(null)).toBe('')
  })

  it('component TimePickerAmPm: chọn 6 + AM -> lưu 06:00, chọn 6 + PM -> lưu 18:00', () => {
    const handleChange = vi.fn()
    render(<ControlledTimePicker onValueChange={handleChange} />)

    const hourSelect = screen.getByLabelText('Giờ')
    const periodSelect = screen.getByLabelText('Buổi (AM hoặc PM)')

    // Chọn 6 khi đang là AM mặc định -> gọi onChange('06:00')
    fireEvent.change(hourSelect, { target: { value: '6' } })
    expect(handleChange).toHaveBeenLastCalledWith('06:00')

    // Đổi sang PM -> gọi onChange('18:00')
    fireEvent.change(periodSelect, { target: { value: 'PM' } })
    expect(handleChange).toHaveBeenLastCalledWith('18:00')
  })

  it('component TimePickerAmPm: 12 AM = 00:00, 12 PM = 12:00', () => {
    const handleChange = vi.fn()
    render(<ControlledTimePicker onValueChange={handleChange} />)

    const hourSelect = screen.getByLabelText('Giờ')
    const periodSelect = screen.getByLabelText('Buổi (AM hoặc PM)')

    // Chọn 12 + AM -> 00:00
    fireEvent.change(hourSelect, { target: { value: '12' } })
    expect(handleChange).toHaveBeenLastCalledWith('00:00')

    // Đổi sang PM -> 12:00
    fireEvent.change(periodSelect, { target: { value: 'PM' } })
    expect(handleChange).toHaveBeenLastCalledWith('12:00')
  })

  it('component TimePickerAmPm: hiển thị đúng giá trị truyền vào', () => {
    render(<TimePickerAmPm id="test-display" value="18:30" />)

    const hourSelect = screen.getByLabelText('Giờ') as HTMLSelectElement
    const minuteSelect = screen.getByLabelText('Phút') as HTMLSelectElement
    const periodSelect = screen.getByLabelText('Buổi (AM hoặc PM)') as HTMLSelectElement

    expect(hourSelect.value).toBe('6')
    expect(minuteSelect.value).toBe('30')
    expect(periodSelect.value).toBe('PM')
  })
})

