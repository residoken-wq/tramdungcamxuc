// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { HabitJourneyContent } from '../../src/payload-types'
import {
  getHabitJourneyContent,
  getHabitSiteSettings,
} from '../../src/lib/habit/journey-content.server'

type GlobalData = Omit<HabitJourneyContent, 'id' | 'updatedAt' | 'createdAt'>

describe('HB-24: habitJourneyContent – nội dung flow mới (bước 1, 2, 5, 6)', () => {
  let payload: Payload
  let before: HabitJourneyContent | null = null

  const write = (data: Partial<GlobalData>) =>
    payload.updateGlobal({ slug: 'habitJourneyContent', data, overrideAccess: true })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    before = (await payload.findGlobal({
      slug: 'habitJourneyContent',
      depth: 0,
    })) as HabitJourneyContent
  })

  afterAll(async () => {
    if (!before) return
    const { id: _id, updatedAt: _u, createdAt: _c, ...rest } = before
    await write(rest)
  })

  it('returns empty, safe defaults when nothing is entered', async () => {
    await write({
      diagnose: { questions: [], results: [], stats: [] },
      loop: { stages: [], rules: [] },
      boardingPass: { captionTemplate: null },
      privacyNote: null,
      onePercent: { ...before?.onePercent, unknowns: [] },
    })
    const content = await getHabitJourneyContent(payload)
    expect(content.diagnose.questions).toEqual([])
    expect(content.diagnose.quote).toBeNull()
    expect(content.loop.stages).toEqual([])
    expect(content.onePercentUnknowns).toEqual([])
    expect(content.boardingPassCaption).toBeNull()
    expect(content.privacyNote).toBeNull()
  })

  it('stores and cleans step 1, 2, 5, 6 content', async () => {
    await write({
      diagnose: {
        title: ' [MẪU] Khám ',
        quote: { text: '[MẪU] Câu', author: '[MẪU] Tác giả', source: '[MẪU] Sách test' },
        stats: [{ value: '[MẪU] 1%', label: '[MẪU] ý nghĩa', sourceLabel: '[MẪU] Nguồn test' }],
        questions: [
          { statement: '[MẪU] Câu 1', stage: 'reward' },
          { statement: '[MẪU] Câu 2', stage: 'cue' },
        ],
        results: [
          { stage: 'reward', title: '[MẪU] R', suggestion: '[MẪU] gợi ý R' },
          { stage: 'cue', title: '[MẪU] C', suggestion: '[MẪU] gợi ý C' },
        ],
      },
      onePercent: { ...before?.onePercent, unknowns: [{ title: '[MẪU] Ý 1', body: null }] },
      loop: {
        stages: [{ stage: 'craving', title: '[MẪU] K', explanation: '[MẪU] giải thích' }],
        rules: [{ title: '[MẪU] Quy tắc 1' }],
      },
      boardingPass: { captionTemplate: '[MẪU] {tuyen_ngon} – {so_ngay} ngày' },
      privacyNote: '[MẪU] Dữ liệu',
    })
    const content = await getHabitJourneyContent(payload)
    expect(content.diagnose.title).toBe('[MẪU] Khám')
    expect(content.diagnose.quote?.source).toBe('[MẪU] Sách test')
    expect(content.diagnose.stats).toHaveLength(1)
    // Question order is kept; results are ordered Cue → Reward.
    expect(content.diagnose.questions.map((q) => q.stage)).toEqual(['reward', 'cue'])
    expect(content.diagnose.results.map((r) => r.stage)).toEqual(['cue', 'reward'])
    expect(content.onePercentUnknowns).toEqual([{ title: '[MẪU] Ý 1', body: null }])
    expect(content.loop.stages[0]?.stage).toBe('craving')
    expect(content.loop.rules).toEqual([{ title: '[MẪU] Quy tắc 1', body: null }])
    expect(content.boardingPassCaption).toBe('[MẪU] {tuyen_ngon} – {so_ngay} ngày')
    expect(content.privacyNote).toBe('[MẪU] Dữ liệu')
  })

  it('is readable without login (public flow)', async () => {
    const doc = (await payload.findGlobal({
      slug: 'habitJourneyContent',
      overrideAccess: false,
    })) as HabitJourneyContent
    expect(doc.diagnose?.questions?.length).toBeGreaterThan(0)
  })

  it('rejects a stat without a source', async () => {
    await expect(
      write({ diagnose: { stats: [{ value: '80%', label: 'x', sourceLabel: '' }] } }),
    ).rejects.toThrow()
  })

  it('rejects a quote without author or source', async () => {
    await expect(
      write({ diagnose: { quote: { text: 'x', author: 'y', source: null } } }),
    ).rejects.toThrow()
    await expect(
      write({ diagnose: { quote: { text: 'x', author: null, source: 'y' } } }),
    ).rejects.toThrow()
  })

  it('rejects two results / explanations for the same stage', async () => {
    await expect(
      write({
        diagnose: {
          results: [
            { stage: 'cue', title: 'a', suggestion: 'a' },
            { stage: 'cue', title: 'b', suggestion: 'b' },
          ],
        },
      }),
    ).rejects.toThrow()
    await expect(
      write({
        loop: {
          stages: [
            { stage: 'reward', title: 'a', explanation: 'a' },
            { stage: 'reward', title: 'b', explanation: 'b' },
          ],
        },
      }),
    ).rejects.toThrow()
  })

  it('rejects a caption with an unknown placeholder (e.g. private reason)', async () => {
    const error = await write({ boardingPass: { captionTemplate: 'Vì {ly_do_rieng}' } }).then(
      () => null,
      (err: unknown) => err,
    )
    expect(JSON.stringify((error as { data?: unknown } | null)?.data)).toContain('{ly_do_rieng}')
  })

  it('rejects more than 3 unknowns in step 2', async () => {
    await expect(
      write({
        onePercent: {
          ...before?.onePercent,
          unknowns: [{ title: '1' }, { title: '2' }, { title: '3' }, { title: '4' }],
        },
      }),
    ).rejects.toThrow()
  })

  it('HB-18: rejects a stepQuote without author or source when text is present', async () => {
    await expect(
      write({
        stepQuotes: {
          onePercent: { text: 'Quote', author: 'Author', source: null },
        },
      }),
    ).rejects.toThrow()
    await expect(
      write({
        stepQuotes: {
          tracker: { text: 'Quote', author: null, source: 'Source' },
        },
      }),
    ).rejects.toThrow()
  })

  it('HB-18: stores and cleans stepQuotes, closing, note, techniqueHint, tracker, and reads siteSettings', async () => {
    await write({
      onePercent: {
        ...before?.onePercent,
        closing: '  [MẪU] Câu kết  ',
      },
      loop: {
        ...before?.loop,
        note: '  [MẪU] Ghi chú loop  ',
        techniqueHint: '  [MẪU] Gợi ý kỹ thuật  ',
      },
      stepQuotes: {
        onePercent: {
          text: '  [MẪU] Câu trích B2  ',
          author: '  [MẪU] Tác giả B2  ',
          source: '  [MẪU] Nguồn B2  ',
          sourceUrl: 'https://example.com/b2',
        },
      },
      tracker: {
        afterJourneyTitle: '  [MẪU] Đồng hành sau 28 ngày  ',
        afterJourneyText: '  [MẪU] Nội dung đồng hành  ',
      },
    })

    const content = await getHabitJourneyContent(payload)
    expect(content.onePercent.closing).toBe('[MẪU] Câu kết')
    expect(content.loop.note).toBe('[MẪU] Ghi chú loop')
    expect(content.loop.techniqueHint).toBe('[MẪU] Gợi ý kỹ thuật')
    expect(content.tracker.afterJourneyTitle).toBe('[MẪU] Đồng hành sau 28 ngày')
    expect(content.tracker.afterJourneyText).toBe('[MẪU] Nội dung đồng hành')
    expect(content.stepQuotes.onePercent).toEqual({
      text: '[MẪU] Câu trích B2',
      author: '[MẪU] Tác giả B2',
      source: '[MẪU] Nguồn B2',
      sourceUrl: 'https://example.com/b2',
    })
    expect(content.stepQuotes.mentor).toBeNull()

    // Test getHabitSiteSettings
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        habitCoachBookingUrl: 'https://cal.com/coach',
        habitDonationEnabled: true,
        habitDonationUrl: 'https://donate.example.com',
      },
      overrideAccess: true,
    })
    const siteSettings = await getHabitSiteSettings(payload)
    expect(siteSettings.habitCoachBookingUrl).toBe('https://cal.com/coach')
    expect(siteSettings.habitDonationEnabled).toBe(true)
    expect(siteSettings.habitDonationUrl).toBe('https://donate.example.com')
  })
})
