import { describe, it, expect } from 'vitest'
import {
  routineItemsToScorecard,
  scorecardToRoutineItems,
  daysToWeekdays,
  weekdaysToDays,
  recordAnswersToArray,
  arrayAnswersToRecord,
} from '@/components/habit/zip/draft-adapter'

describe('DP-01 draft adapter', () => {
  it('converts routine items to scorecard and back', () => {
    const routines = [
      { id: '1', activity: 'Uống nước', score: '+' as const },
      { id: '2', activity: 'Lướt TikTok', score: '-' as const },
      { id: '3', activity: 'Đi bộ', score: '=' as const },
    ]
    const scorecard = routineItemsToScorecard(routines)
    expect(scorecard).toEqual([
      { habit: 'Uống nước', rating: 'good' },
      { habit: 'Lướt TikTok', rating: 'bad' },
      { habit: 'Đi bộ', rating: 'neutral' },
    ])

    const restored = scorecardToRoutineItems(scorecard)
    expect(restored[0].activity).toBe('Uống nước')
    expect(restored[0].score).toBe('+')
    expect(restored[1].score).toBe('-')
    expect(restored[2].score).toBe('=')
  })

  it('converts days to weekdays and back', () => {
    const days = ['T2', 'T4', 'T6', 'CN']
    const weekdays = daysToWeekdays(days)
    expect(weekdays).toEqual(['mon', 'wed', 'fri', 'sun'])
    expect(weekdaysToDays(weekdays)).toEqual(days)
  })

  it('converts diagnose answers between record and array', () => {
    const rec = { 1: 5, 2: 3, 3: 4 }
    const arr = recordAnswersToArray(rec, 4)
    expect(arr).toEqual([5, 3, 4, null])
    expect(arrayAnswersToRecord(arr)).toEqual(rec)
  })
})

