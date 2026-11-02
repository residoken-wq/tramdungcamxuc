// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import type { Payload } from 'payload'
import {
  withDiagnoseFallback,
  type CleanHabitDiagnose,
} from '../../src/lib/habit/journey-content.server'

const emptyDiagnose: CleanHabitDiagnose = {
  title: null,
  intro: null,
  quote: null,
  stats: [],
  questions: [],
  scaleMinLabel: null,
  scaleMaxLabel: null,
  results: [],
}

/** Stand-in for the Local API: only `find` on `diagnosticQuestions` is used. */
const fakePayload = (docs: unknown[]) => {
  const find = vi.fn(async () => ({ docs }))
  return { payload: { find } as unknown as Payload, find }
}

describe('Habit Loop bước 1: dùng "Câu hỏi chẩn đoán" khi khảo sát trong global còn trống', () => {
  it('uses published diagnosticQuestions, in order, when the global survey is empty', async () => {
    const { payload, find } = fakePayload([
      { id: 2, statement: ' Câu B ', stage: 'response', order: 2 },
      { id: 1, statement: 'Câu A', stage: 'cue', order: 1 },
      { id: 3, statement: 'Câu lỗi', stage: 'unknown', order: 3 },
    ])
    const result = await withDiagnoseFallback({ ...emptyDiagnose, title: 'Tiêu đề' }, payload)
    expect(result.questions).toEqual([
      { statement: 'Câu A', stage: 'cue' },
      { statement: 'Câu B', stage: 'response' },
    ])
    expect(result.title).toBe('Tiêu đề')
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'diagnosticQuestions',
        where: { _status: { equals: 'published' } },
      }),
    )
  })

  it('keeps the global survey when it has questions (no collection read)', async () => {
    const { payload, find } = fakePayload([{ id: 1, statement: 'Câu A', stage: 'cue', order: 1 }])
    const own = {
      ...emptyDiagnose,
      questions: [{ statement: 'Câu riêng', stage: 'reward' as const }],
    }
    expect(await withDiagnoseFallback(own, payload)).toBe(own)
    expect(find).not.toHaveBeenCalled()
  })

  it('works when the journey content could not be read at all', async () => {
    const { payload } = fakePayload([{ id: 1, statement: 'Câu A', stage: 'craving', order: 1 }])
    const result = await withDiagnoseFallback(null, payload)
    expect(result.questions).toEqual([{ statement: 'Câu A', stage: 'craving' }])
    expect(result.results).toEqual([])
  })

  it('stays empty when neither place has questions', async () => {
    const { payload } = fakePayload([])
    expect((await withDiagnoseFallback(emptyDiagnose, payload)).questions).toEqual([])
  })
})
