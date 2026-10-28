import { describe, expect, it } from 'vitest'
import {
  buildTrackerView,
  splitJourneyIntoStations,
  type TrackerViewCheckin,
} from '@/lib/habit/tracker-view'
import type { PlanLike } from '@/lib/habit/rhythm'

describe('Habit Tracker View (HB-11)', () => {
  describe('1. Thuật toán splitJourneyIntoStations', () => {
    it('chia 28 ngày cho 4 trạm -> 7-7-7-7', () => {
      const ranges = splitJourneyIntoStations(28, 4)
      expect(ranges).toEqual([
        { index: 0, fromDay: 1, toDay: 7 },
        { index: 1, fromDay: 8, toDay: 14 },
        { index: 2, fromDay: 15, toDay: 21 },
        { index: 3, fromDay: 22, toDay: 28 },
      ])
    })

    it('chia 30 ngày cho 4 trạm -> 8-8-7-7', () => {
      const ranges = splitJourneyIntoStations(30, 4)
      expect(ranges).toEqual([
        { index: 0, fromDay: 1, toDay: 8 },
        { index: 1, fromDay: 9, toDay: 16 },
        { index: 2, fromDay: 17, toDay: 23 },
        { index: 3, fromDay: 24, toDay: 30 },
      ])
    })

    it('xử lý số ngày hoặc số trạm <= 0', () => {
      expect(splitJourneyIntoStations(0, 4)).toEqual([])
      expect(splitJourneyIntoStations(28, 0)).toEqual([])
      expect(splitJourneyIntoStations(-5, 4)).toEqual([])
    })
  })

  describe('2. buildTrackerView', () => {
    // 2026-10-26 là Thứ Hai (UTC+7)
    const startDate = '2026-10-26T00:00:00.000Z'
    const plan28MonFri: PlanLike = {
      startDate,
      journeyDays: 28,
      rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    }

    it('kế hoạch 28 ngày nhịp T2–T6 bắt đầu T2 -> 4 trạm 7 ngày', () => {
      const today = '2026-10-26T12:00:00.000Z' // Day 1
      const view = buildTrackerView(plan28MonFri, [], today, ['Chặng 1', 'Chặng 2', 'Chặng 3', 'Chặng 4'])

      expect(view.stations).toHaveLength(4)
      expect(view.stations[0].fromDay).toBe(1)
      expect(view.stations[0].toDay).toBe(7)
      expect(view.stations[0].name).toBe('Chặng 1')
      expect(view.stations[1].fromDay).toBe(8)
      expect(view.stations[1].toDay).toBe(14)
      expect(view.stations[1].name).toBe('Chặng 2')
      expect(view.stations[2].fromDay).toBe(15)
      expect(view.stations[2].toDay).toBe(21)
      expect(view.stations[3].fromDay).toBe(22)
      expect(view.stations[3].toDay).toBe(28)
      expect(view.votingDaysTotal).toBe(20) // 4 tuần x 5 ngày
    })

    it('T7 / CN là rest theo nhịp', () => {
      const today = '2026-10-26T12:00:00.000Z' // Day 1
      const view = buildTrackerView(plan28MonFri, [], today)

      const st1 = view.stations[0]
      // Day 1: T2 -> today (chưa check-in)
      expect(st1.days[0].day).toBe(1)
      expect(st1.days[0].isVotingDay).toBe(true)
      expect(st1.days[0].state).toBe('today')

      // Day 6: T7 -> rest
      expect(st1.days[5].day).toBe(6)
      expect(st1.days[5].isVotingDay).toBe(false)
      expect(st1.days[5].state).toBe('rest')

      // Day 7: CN -> rest
      expect(st1.days[6].day).toBe(7)
      expect(st1.days[6].isVotingDay).toBe(false)
      expect(st1.days[6].state).toBe('rest')
    })

    it('minimal tính vào votedCount', () => {
      const today = '2026-10-28T12:00:00.000Z' // Day 3 (Wed)
      const checkins: TrackerViewCheckin[] = [
        { day: 1, status: 'voted' },
        { day: 2, status: 'minimal' },
      ]

      const view = buildTrackerView(plan28MonFri, checkins, today)
      expect(view.votedCount).toBe(2)
      expect(view.streak).toBe(2)
    })

    it('check-in voted vào ngày nghỉ không tính vào votedCount', () => {
      // Day 6 là Thứ 7 (ngày nghỉ)
      const today = '2026-11-02T12:00:00.000Z' // Day 8 (Mon)
      const checkins: TrackerViewCheckin[] = [
        { day: 1, status: 'voted' },
        { day: 6, status: 'voted' }, // Check-in voted trên ngày nghỉ
      ]

      const view = buildTrackerView(plan28MonFri, checkins, today)
      // Chỉ tính Day 1 vào votedCount, Day 6 là ngày nghỉ không được tính điểm 90%
      expect(view.votedCount).toBe(1)
    })

    it('missedRun bỏ qua ngày nghỉ', () => {
      // Lỡ Day 4 (T5) và Day 5 (T6), Day 6 (T7) & Day 7 (CN) là ngày nghỉ
      // Hôm nay là Day 8 (Thứ Hai tuần sau)
      const today = '2026-11-02T12:00:00.000Z'
      const checkins: TrackerViewCheckin[] = [
        { day: 1, status: 'voted' },
        { day: 2, status: 'voted' },
        { day: 3, status: 'voted' },
        // Day 4 missed
        // Day 5 missed
        // Day 6, 7 nghỉ
      ]

      const view = buildTrackerView(plan28MonFri, checkins, today)
      expect(view.missedRun.count).toBe(2)
      expect(view.missedRun.startDay).toBe(4)
    })

    it('trạm không tên hoặc thiếu tên -> "Trạm n"', () => {
      const today = '2026-10-26T12:00:00.000Z'
      // Truyền mảng 4 phần tử nhưng các trạm sau rỗng/thiếu
      const view = buildTrackerView(plan28MonFri, [], today, ['Khởi đầu', '', undefined, null])

      expect(view.stations).toHaveLength(4)
      expect(view.stations[0].name).toBe('Khởi đầu')
      expect(view.stations[1].name).toBe('Trạm 2')
      expect(view.stations[2].name).toBe('Trạm 3')
      expect(view.stations[3].name).toBe('Trạm 4')

      // Không truyền stationNames -> mặc định 4 trạm fallback
      const defaultView = buildTrackerView(plan28MonFri, [], today)
      expect(defaultView.stations).toHaveLength(4)
      expect(defaultView.stations[0].name).toBe('Trạm 1')
      expect(defaultView.stations[1].name).toBe('Trạm 2')
      expect(defaultView.stations[2].name).toBe('Trạm 3')
      expect(defaultView.stations[3].name).toBe('Trạm 4')
    })
  })
})
