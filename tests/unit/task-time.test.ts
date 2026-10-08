import { expect, it } from 'vitest'
import { summarize } from '../../scripts/task-time.mjs'

it('counts gaps up to 10 minutes fully and longer gaps (approval / stuck) as 5 seconds each', () => {
  const s = 1000
  const events = [0, 10, 400, 430, 1500, 1530].map((sec) => ({ t: sec * s }))
  // 10 + 390 (editing files) + 30 + 5 (1070 s wait) + 30 = 465 s
  expect(summarize(events)).toEqual({
    activeMs: 465 * s,
    wallMs: 1530 * s,
    stalls: 1,
    laps: 5,
    longestGapMs: 1070 * s,
  })
})

it('returns zero for a single event', () => {
  expect(summarize([{ t: 5 }])).toEqual({
    activeMs: 0,
    wallMs: 0,
    stalls: 0,
    laps: 0,
    longestGapMs: 0,
  })
})
