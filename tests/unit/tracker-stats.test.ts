import { describe, expect, it } from 'vitest'
import { planDayDate } from '@/lib/habit/tracker-stats'

describe('planDayDate unit tests (HB-23)', () => {
  it('tính đúng ngày lịch cho startDate theo giờ Việt Nam', () => {
    // 2026-10-30T17:00:00.000Z tương đương 00:00:00 ngày 31/10/2026 tại Việt Nam
    const startDate = '2026-10-30T17:00:00.000Z'

    const day1 = planDayDate(startDate, 1)
    expect(day1).toEqual({ short: '31/10', full: '31/10/2026' })

    const day2 = planDayDate(startDate, 2)
    expect(day2).toEqual({ short: '01/11', full: '01/11/2026' })

    const day28 = planDayDate(startDate, 28)
    expect(day28).toEqual({ short: '27/11', full: '27/11/2026' })
  })

  it('xử lý chính xác trường hợp qua năm mới (cross-year)', () => {
    // 2026-12-30T17:00:00.000Z là ngày 31/12/2026 giờ VN
    const startDate = '2026-12-30T17:00:00.000Z'

    const day1 = planDayDate(startDate, 1)
    expect(day1).toEqual({ short: '31/12', full: '31/12/2026' })

    const day2 = planDayDate(startDate, 2)
    expect(day2).toEqual({ short: '01/01', full: '01/01/2027' })

    const day5 = planDayDate(startDate, 5)
    expect(day5).toEqual({ short: '04/01', full: '04/01/2027' })
  })

  it('chấp nhận startDate kiểu Date object', () => {
    const startDate = new Date('2026-10-30T17:00:00.000Z')
    const day1 = planDayDate(startDate, 1)
    expect(day1).toEqual({ short: '31/10', full: '31/10/2026' })
  })

  it('trả về null khi startDate thiếu hoặc sai định dạng hoặc day < 1', () => {
    expect(planDayDate(null, 1)).toBeNull()
    expect(planDayDate(undefined, 1)).toBeNull()
    expect(planDayDate('', 1)).toBeNull()
    expect(planDayDate('invalid-date-string', 1)).toBeNull()
    expect(planDayDate('2026-10-30T17:00:00.000Z', 0)).toBeNull()
    expect(planDayDate('2026-10-30T17:00:00.000Z', -5)).toBeNull()
    expect(planDayDate('2026-10-30T17:00:00.000Z', undefined as unknown as number)).toBeNull()
  })
})
