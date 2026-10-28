/**
 * Hàm thuần tính toán góc nhìn hiển thị cho Habit Tracker (HB-11).
 * Không phụ thuộc cơ sở dữ liệu, chạy được trên cả client và server.
 */

import { vi } from '@/lib/i18n/vi'
import {
  currentStreak,
  getDayState,
  getJourneyDays,
  getVotingDays,
  isVotingDay,
  missedVotingRun,
  type CheckinLike,
  type DayState,
  type PlanLike,
} from './rhythm'
import { countCompletedVotingDays } from './journey'

export interface StationRange {
  index: number
  fromDay: number
  toDay: number
}

/**
 * Chia đều số ngày hành trình cho các trạm, phần dư dồn vào các trạm đầu.
 * Nếu số trạm > số ngày, mỗi trạm tối thiểu 1 ngày và bớt số trạm.
 * Hàm thuần túy, không đọc cơ sở dữ liệu.
 */
export function splitJourneyIntoStations(
  journeyDays: number,
  stationCount: number,
): StationRange[] {
  if (journeyDays <= 0 || stationCount <= 0) {
    return []
  }

  const effectiveStations = Math.min(stationCount, journeyDays)
  const baseDays = Math.floor(journeyDays / effectiveStations)
  const remainder = journeyDays % effectiveStations

  const ranges: StationRange[] = []
  let currentFromDay = 1

  for (let i = 0; i < effectiveStations; i++) {
    const daysInStation = baseDays + (i < remainder ? 1 : 0)
    const toDay = currentFromDay + daysInStation - 1
    ranges.push({
      index: i,
      fromDay: currentFromDay,
      toDay,
    })
    currentFromDay = toDay + 1
  }

  return ranges
}

export interface TrackerViewDay {
  day: number
  state: DayState
  isVotingDay: boolean
  emotionKey?: string
  note?: string
}

export interface TrackerStationView {
  name: string | null
  fromDay: number
  toDay: number
  votedCount: number
  votingDaysTotal: number
  days: TrackerViewDay[]
}

export interface TrackerViewResult {
  stations: TrackerStationView[]
  streak: number
  votedCount: number
  votingDaysTotal: number
  missedRun: {
    count: number
    startDay: number | null
  }
}

export interface TrackerViewCheckin extends CheckinLike {
  emotion?: string | null
  note?: string | null
}

/**
 * Tạo dữ liệu hiển thị hoàn chỉnh cho giao diện Tracker theo nhịp tuần và trạm.
 */
export function buildTrackerView(
  plan: PlanLike | null | undefined,
  checkins: TrackerViewCheckin[] | null | undefined,
  today: Date | string,
  stationNames?: (string | null | undefined)[] | null,
): TrackerViewResult {
  const journeyDays = getJourneyDays(plan)
  const effectiveStationCount = Math.max(1, stationNames?.length || 4)
  const stationRanges = splitJourneyIntoStations(journeyDays, effectiveStationCount)

  const stations: TrackerStationView[] = stationRanges.map((range) => {
    const rawName = stationNames?.[range.index]
    const trimmedName = typeof rawName === 'string' ? rawName.trim() : ''
    const name = trimmedName.length > 0 ? trimmedName : vi.hb11.stationFallback(range.index + 1)

    const days: TrackerViewDay[] = []
    let stationVotedCount = 0
    let stationVotingTotal = 0

    for (let d = range.fromDay; d <= range.toDay; d++) {
      const checkin = checkins?.find((c) => c.day === d)
      const state = getDayState(plan, checkins, d, today)
      const voting = isVotingDay(plan, d)

      if (voting) {
        stationVotingTotal++
        if (state === 'voted' || state === 'minimal') {
          stationVotedCount++
        }
      }

      days.push({
        day: d,
        state,
        isVotingDay: voting,
        emotionKey: checkin?.emotion || undefined,
        note: checkin?.note || undefined,
      })
    }

    return {
      name,
      fromDay: range.fromDay,
      toDay: range.toDay,
      votedCount: stationVotedCount,
      votingDaysTotal: stationVotingTotal,
      days,
    }
  })

  const streak = currentStreak(plan, checkins, today)
  const votedCount = countCompletedVotingDays(plan, checkins)
  const votingDaysTotal = getVotingDays(plan).length
  const missedRun = missedVotingRun(plan, checkins, today)

  return {
    stations,
    streak,
    votedCount,
    votingDaysTotal,
    missedRun,
  }
}

