import { expect, it } from 'vitest'
import { summarize } from '../../scripts/task-time.mjs'

it('counts short gaps fully and long gaps (approval / stuck) as 5 seconds each', () => {
  const s = 1000
  const events = [0, 10, 40, 400, 430, 2000, 2030].map((sec) => ({ t: sec * s }))
  // 10 + 30 + 5 (360 s wait) + 30 + 5 (1570 s wait) + 30 = 110 s
  expect(summarize(events)).toEqual({ activeMs: 110 * s, wallMs: 2030 * s, stalls: 2, laps: 6 })
})

it('returns zero for a single event', () => {
  expect(summarize([{ t: 5 }])).toEqual({ activeMs: 0, wallMs: 0, stalls: 0, laps: 0 })
})
