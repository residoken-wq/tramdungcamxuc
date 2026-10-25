// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  currentStreak,
  getDayState,
  getJourneyDays,
  getVotingDays,
  isVotingDay,
  missedVotingRun,
  shouldNudgeMissed,
  weekdayOfDay,
} from '../../src/lib/habit/rhythm'

describe('HB-05: Bộ luật nhịp tuần và trạng thái ngày (habit/rhythm.ts)', () => {
  describe('1. weekdayOfDay', () => {
    it('ngày 1 = startDate; trả mon..sun theo giờ Việt Nam', () => {
      // 2026-10-26 là Thứ Hai
      const monDate = '2026-10-26T00:00:00+07:00'
      expect(weekdayOfDay(monDate, 1)).toBe('mon')
      expect(weekdayOfDay(monDate, 2)).toBe('tue')
      expect(weekdayOfDay(monDate, 3)).toBe('wed')
      expect(weekdayOfDay(monDate, 4)).toBe('thu')
      expect(weekdayOfDay(monDate, 5)).toBe('fri')
      expect(weekdayOfDay(monDate, 6)).toBe('sat')
      expect(weekdayOfDay(monDate, 7)).toBe('sun')
      expect(weekdayOfDay(monDate, 8)).toBe('mon')
    })

    it('ngày bắt đầu là Chủ Nhật', () => {
      // 2026-10-25 là Chủ Nhật
      const sunDate = '2026-10-25T00:00:00+07:00'
      expect(weekdayOfDay(sunDate, 1)).toBe('sun')
      expect(weekdayOfDay(sunDate, 2)).toBe('mon')
      expect(weekdayOfDay(sunDate, 7)).toBe('sat')
      expect(weekdayOfDay(sunDate, 8)).toBe('sun')
    })

    it('giờ Việt Nam qua nửa đêm: 23:30 tối và 00:30 sáng tính đúng ngày lịch', () => {
      // 23:30 tối 2026-10-24 (Thứ Bảy)
      const lateNightSaturday = '2026-10-24T23:30:00+07:00'
      expect(weekdayOfDay(lateNightSaturday, 1)).toBe('sat')
      expect(weekdayOfDay(lateNightSaturday, 2)).toBe('sun')

      // 00:30 sáng 2026-10-25 (Chủ Nhật)
      // Tương đương UTC: 2026-10-24T17:30:00Z
      const earlyMorningSunday = '2026-10-24T17:30:00.000Z'
      expect(weekdayOfDay(earlyMorningSunday, 1)).toBe('sun')
      expect(weekdayOfDay(earlyMorningSunday, 2)).toBe('mon')
    })

    it('vượt qua ranh giới tháng và năm nhuận', () => {
      // 2024 là năm nhuận: 2024-02-28 là Thứ Tư
      const leapStart = '2024-02-28T00:00:00+07:00'
      expect(weekdayOfDay(leapStart, 1)).toBe('wed') // 28/2
      expect(weekdayOfDay(leapStart, 2)).toBe('thu') // 29/2
      expect(weekdayOfDay(leapStart, 3)).toBe('fri') // 1/3
    })

    it('day ngoài phạm vi: day 0 và day âm tính lùi ngày lịch', () => {
      const monDate = '2026-10-26T00:00:00+07:00'
      expect(weekdayOfDay(monDate, 0)).toBe('sun') // hôm trước thứ 2
      expect(weekdayOfDay(monDate, -1)).toBe('sat') // 2 hôm trước thứ 2
    })
  })

  describe('2. isVotingDay & getVotingDays', () => {
    it('rhythmDays rỗng hoặc thiếu -> mọi ngày 1..journeyDays là ngày bỏ phiếu', () => {
      const planNoRhythm = { journeyDays: 28 }
      expect(isVotingDay(planNoRhythm, 1)).toBe(true)
      expect(isVotingDay(planNoRhythm, 28)).toBe(true)
      expect(isVotingDay(planNoRhythm, 0)).toBe(false)
      expect(isVotingDay(planNoRhythm, 29)).toBe(false)

      const planEmptyRhythm = { journeyDays: 28, rhythmDays: [] }
      expect(isVotingDay(planEmptyRhythm, 5)).toBe(true)
      expect(getVotingDays(planEmptyRhythm)).toHaveLength(28)

      const planNull = null
      expect(getVotingDays(planNull)).toHaveLength(21) // fallback 21 ngày
    })

    it('nhịp 7 ngày đủ -> mọi ngày trong tuần là ngày bỏ phiếu', () => {
      const planAll7 = {
        journeyDays: 28,
        startDate: '2026-10-26', // Thứ 2
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      }
      expect(getVotingDays(planAll7)).toHaveLength(28)
    })

    it('nhịp 3 ngày (mon, wed, fri) trong 28 ngày: đúng 12 ngày bỏ phiếu', () => {
      // 4 tuần x 3 ngày/tuần = 12 ngày
      const plan3Days = {
        journeyDays: 28,
        startDate: '2026-10-26', // Thứ 2
        rhythmDays: ['mon', 'wed', 'fri'],
      }
      expect(isVotingDay(plan3Days, 1)).toBe(true) // Mon
      expect(isVotingDay(plan3Days, 2)).toBe(false) // Tue
      expect(isVotingDay(plan3Days, 3)).toBe(true) // Wed
      expect(isVotingDay(plan3Days, 4)).toBe(false) // Thu
      expect(isVotingDay(plan3Days, 5)).toBe(true) // Fri
      expect(isVotingDay(plan3Days, 6)).toBe(false) // Sat
      expect(isVotingDay(plan3Days, 7)).toBe(false) // Sun

      const votingDays = getVotingDays(plan3Days)
      expect(votingDays).toHaveLength(12)
      expect(votingDays).toEqual([1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26])
    })

    it('nhịp 1 ngày (sun): chỉ các ngày Chủ Nhật là ngày bỏ phiếu', () => {
      const planSun = {
        journeyDays: 28,
        startDate: '2026-10-26', // Thứ 2
        rhythmDays: ['sun'],
      }
      const votingDays = getVotingDays(planSun)
      expect(votingDays).toEqual([7, 14, 21, 28])
    })

    it('day ngoài phạm vi 1..journeyDays trả về false', () => {
      const plan = { journeyDays: 28, rhythmDays: ['mon', 'tue'] }
      expect(isVotingDay(plan, 0)).toBe(false)
      expect(isVotingDay(plan, -5)).toBe(false)
      expect(isVotingDay(plan, 29)).toBe(false)
    })
  })

  describe('3. getDayState', () => {
    const plan = {
      journeyDays: 28,
      startDate: '2026-10-26', // Thứ 2 (Day 1)
      rhythmDays: ['mon', 'wed', 'fri'], // Days: 1, 3, 5, 8, 10, ...
    }
    const today = '2026-10-30T10:00:00+07:00' // Thứ 6 (Day 5 của plan)

    it('có check-in: trả về status tương ứng', () => {
      expect(getDayState(plan, [{ day: 1, status: 'voted' }], 1, today)).toBe('voted')
      expect(getDayState(plan, [{ day: 3, status: 'minimal' }], 3, today)).toBe('minimal')
      expect(getDayState(plan, [{ day: 5, status: 'missed' }], 5, today)).toBe('missed')
      expect(getDayState(plan, [{ day: 2, status: 'rest' }], 2, today)).toBe('rest')
    })

    it('có check-in thiếu status (API cũ): suy từ done', () => {
      expect(getDayState(plan, [{ day: 1, done: true }], 1, today)).toBe('voted')
      expect(getDayState(plan, [{ day: 3, done: false }], 3, today)).toBe('missed')
    })

    it('không check-in, không phải ngày bỏ phiếu -> rest', () => {
      // Day 2 (Thứ Ba), Day 4 (Thứ Năm), Day 6 (Thứ Bảy) đều không nằm trong rhythmDays
      expect(getDayState(plan, [], 2, today)).toBe('rest')
      expect(getDayState(plan, [], 4, today)).toBe('rest')
      expect(getDayState(plan, [], 6, today)).toBe('rest')
    })

    it('không check-in, ngày bỏ phiếu: trước hôm nay -> missed, hôm nay -> today, sau hôm nay -> upcoming', () => {
      // Day 1 (Thứ Hai, quá khứ) -> missed
      expect(getDayState(plan, [], 1, today)).toBe('missed')
      // Day 3 (Thứ Tư, quá khứ) -> missed
      expect(getDayState(plan, [], 3, today)).toBe('missed')
      // Day 5 (Thứ Sáu, hôm nay) -> today
      expect(getDayState(plan, [], 5, today)).toBe('today')
      // Day 8 (Thứ Hai tuần sau, tương lai) -> upcoming
      expect(getDayState(plan, [], 8, today)).toBe('upcoming')
    })
  })

  describe('4. currentStreak', () => {
    const plan = {
      journeyDays: 28,
      startDate: '2026-10-26', // Thứ 2 (Day 1)
      rhythmDays: ['mon', 'wed', 'fri'], // Days: 1, 3, 5, 8, ...
    }

    it('chuỗi qua ngày nghỉ không bị đứt', () => {
      // Hôm nay là Day 5 (Thứ 6). Khách chưa check-in hôm nay.
      // Day 1: voted. Day 2: rest. Day 3: minimal. Day 4: rest.
      const today = '2026-10-30T10:00:00+07:00' // Day 5
      const checkins = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'minimal' as const },
      ]
      // Đếm lùi từ hôm qua: Day 4 (rest) bỏ qua; Day 3 (minimal) +1; Day 2 (rest) bỏ qua; Day 1 (voted) +1 -> 2
      expect(currentStreak(plan, checkins, today)).toBe(2)
    })

    it('hôm nay đã check-in voted hoặc minimal: tính cả hôm nay vào chuỗi', () => {
      const today = '2026-10-30T10:00:00+07:00' // Day 5
      const checkins = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'minimal' as const },
        { day: 5, status: 'voted' as const },
      ]
      expect(currentStreak(plan, checkins, today)).toBe(3)

      const checkinsMinimal = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'minimal' as const },
        { day: 5, status: 'minimal' as const },
      ]
      expect(currentStreak(plan, checkinsMinimal, today)).toBe(3)
    })

    it('khách tự ghi rest vào ngày bỏ phiếu làm đứt chuỗi', () => {
      const today = '2026-10-30T10:00:00+07:00' // Day 5
      const checkins = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'rest' as const }, // Khách ghi rest vào thứ Tư (ngày bỏ phiếu)
      ]
      // Day 3 là rest trên ngày bỏ phiếu -> đứt chuỗi!
      expect(currentStreak(plan, checkins, today)).toBe(0)
    })

    it('ngày bỏ phiếu missed làm đứt chuỗi', () => {
      const today = '2026-11-02T10:00:00+07:00' // Day 8 (Thứ 2 tuần sau)
      const checkins = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'missed' as const },
        { day: 5, status: 'voted' as const },
      ]
      // Day 8 chưa check-in -> xét từ Day 7 về:
      // Day 7 (Sun), Day 6 (Sat) bỏ qua
      // Day 5 (Fri) voted -> streak = 1
      // Day 4 (Thu) bỏ qua
      // Day 3 (Wed) missed -> đứt chuỗi!
      expect(currentStreak(plan, checkins, today)).toBe(1)
    })

    it('hôm nay check-in missed hoặc rest vào ngày bỏ phiếu -> streak = 0', () => {
      const today = '2026-10-30T10:00:00+07:00' // Day 5 (Thứ 6, voting day)
      const checkins = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'voted' as const },
        { day: 5, status: 'missed' as const },
      ]
      expect(currentStreak(plan, checkins, today)).toBe(0)

      const checkinsRest = [
        { day: 1, status: 'voted' as const },
        { day: 3, status: 'voted' as const },
        { day: 5, status: 'rest' as const },
      ]
      expect(currentStreak(plan, checkinsRest, today)).toBe(0)
    })

    it('hành trình đã qua ngày cuối: đếm lùi từ ngày cuối cùng', () => {
      const today = '2026-11-25T10:00:00+07:00' // Day 31 > 28
      const checkins = [
        { day: 24, status: 'voted' as const },
        { day: 26, status: 'voted' as const }, // Day 26 là Friday cuối
      ]
      // Day 28 (Sun), Day 27 (Sat) bỏ qua
      // Day 26 (Fri) voted -> 1
      // Day 25 (Thu) bỏ qua
      // Day 24 (Wed) voted -> 2
      // Day 22 (Mon) không checkin -> missed -> đứt chuỗi
      expect(currentStreak(plan, checkins, today)).toBe(2)
    })

    it('hành trình chưa bắt đầu (currentDay < 1): streak = 0', () => {
      const today = '2026-10-20T10:00:00+07:00' // Trước ngày bắt đầu 2026-10-26
      expect(currentStreak(plan, [], today)).toBe(0)
    })
  })

  describe('5. missedVotingRun & shouldNudgeMissed', () => {
    const plan = {
      journeyDays: 28,
      startDate: '2026-10-26', // Thứ 2 (Day 1)
      rhythmDays: ['mon', 'wed', 'fri'], // Days: 1, 3, 5, 8, ...
    }

    it('lỡ 2 ngày bỏ phiếu cách nhau 1 ngày nghỉ vẫn tính là liên tiếp', () => {
      // Hôm nay là Day 5 (Thứ Sáu).
      // Day 1 (Mon): missed (không check-in)
      // Day 2 (Tue): rest
      // Day 3 (Wed): missed (không check-in)
      // Day 4 (Thu): rest
      const today = '2026-10-30T10:00:00+07:00'
      const run = missedVotingRun(plan, [], today)
      expect(run.count).toBe(2)
      expect(run.startDay).toBe(1)
      expect(shouldNudgeMissed(plan, [], today)).toBe(true)
    })

    it('ngày hôm qua có check-in voted -> run.count = 0 và không nhắc', () => {
      const today = '2026-10-30T10:00:00+07:00' // Day 5
      const checkins = [
        { day: 1, status: 'missed' as const },
        { day: 3, status: 'voted' as const }, // Day 3 hoàn thành
      ]
      const run = missedVotingRun(plan, checkins, today)
      expect(run.count).toBe(0)
      expect(run.startDay).toBeNull()
      expect(shouldNudgeMissed(plan, checkins, today)).toBe(false)
    })

    it('chỉ lỡ 1 ngày bỏ phiếu: run.count = 1 và shouldNudgeMissed = false', () => {
      const today = '2026-10-30T10:00:00+07:00' // Day 5
      const checkins = [
        { day: 1, status: 'voted' as const }, // Day 1 voted
        // Day 3 missed
      ]
      const run = missedVotingRun(plan, checkins, today)
      expect(run.count).toBe(1)
      expect(run.startDay).toBe(3)
      expect(shouldNudgeMissed(plan, checkins, today)).toBe(false)
    })

    it('hành trình đã qua ngày cuối: shouldNudgeMissed luôn trả về false', () => {
      const today = '2026-11-25T10:00:00+07:00' // Day 31 > 28
      // Kế hoạch không check-in gì cả
      expect(shouldNudgeMissed(plan, [], today)).toBe(false)
    })

    it('ngày đầu tiên của hành trình (currentDay = 1): không có ngày nào trước hôm nay', () => {
      const today = '2026-10-26T10:00:00+07:00' // Day 1
      const run = missedVotingRun(plan, [], today)
      expect(run.count).toBe(0)
      expect(run.startDay).toBeNull()
      expect(shouldNudgeMissed(plan, [], today)).toBe(false)
    })
  })

  describe('6. getJourneyDays fallback', () => {
    it('trả về 28 nếu có, 21 nếu null/undefined/0/âm', () => {
      expect(getJourneyDays({ journeyDays: 28 })).toBe(28)
      expect(getJourneyDays({ journeyDays: null })).toBe(21)
      expect(getJourneyDays({ journeyDays: 0 })).toBe(21)
      expect(getJourneyDays({ journeyDays: -5 })).toBe(21)
      expect(getJourneyDays(null)).toBe(21)
    })
  })
})
