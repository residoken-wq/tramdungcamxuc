import { describe, expect, it } from 'vitest'
import {
  fillBoardingCaption,
  scoreFlowDiagnose,
  unknownCaptionPlaceholders,
  type FlowDiagnoseQuestion,
} from '../../src/lib/habit/flow-content'
import { habitFlowSeedPatch } from '../../seed/seed'

const questions: FlowDiagnoseQuestion[] = [
  { statement: '[MẪU] 1', stage: 'cue' },
  { statement: '[MẪU] 2', stage: 'cue' },
  { statement: '[MẪU] 3', stage: 'craving' },
  { statement: '[MẪU] 4', stage: 'craving' },
  { statement: '[MẪU] 5', stage: 'response' },
  { statement: '[MẪU] 6', stage: 'response' },
  { statement: '[MẪU] 7', stage: 'reward' },
  { statement: '[MẪU] 8', stage: 'reward' },
]

describe('HB-24: scoreFlowDiagnose', () => {
  it('counts answered questions and gives no result until all are answered', () => {
    const score = scoreFlowDiagnose([5, 4, null, 3], questions)
    expect(score.answeredCount).toBe(3)
    expect(score.totalCount).toBe(8)
    expect(score.isComplete).toBe(false)
    expect(score.topStage).toBeNull()
  })

  it('picks the stage with the highest average once complete', () => {
    const score = scoreFlowDiagnose([1, 2, 2, 2, 5, 4, 3, 3], questions)
    expect(score.isComplete).toBe(true)
    expect(score.averageScores.response).toBe(4.5)
    expect(score.topStage).toBe('response')
  })

  it('breaks ties Cue → Craving → Response → Reward', () => {
    expect(scoreFlowDiagnose([4, 4, 4, 4, 1, 1, 1, 1], questions).topStage).toBe('cue')
    expect(scoreFlowDiagnose([1, 1, 3, 3, 1, 1, 3, 3], questions).topStage).toBe('craving')
  })

  it('clamps scores to 1–5 and ignores non-numbers', () => {
    const score = scoreFlowDiagnose([9, 9, 1, 1, 1, 1, 1, Number.NaN], questions)
    expect(score.averageScores.cue).toBe(5)
    expect(score.answeredCount).toBe(7)
  })

  it('never completes without questions', () => {
    expect(scoreFlowDiagnose([], []).isComplete).toBe(false)
  })
})

describe('HB-24: Boarding Pass caption', () => {
  it('lists unknown placeholders only', () => {
    expect(unknownCaptionPlaceholders('{tuyen_ngon} {so_ngay} {ngay_bat_dau}')).toEqual([])
    expect(unknownCaptionPlaceholders('{ly_do_rieng} và {ten} {ten}')).toEqual([
      '{ly_do_rieng}',
      '{ten}',
    ])
  })

  it('fills known placeholders and drops empty ones without leaving "undefined"', () => {
    const caption = fillBoardingCaption('Tôi: {tuyen_ngon} – {so_ngay} ngày từ {ngay_bat_dau}', {
      tuyen_ngon: 'Tôi sẽ đọc 2 trang để trở thành người ham học',
      so_ngay: 28,
    })
    expect(caption).toBe('Tôi: Tôi sẽ đọc 2 trang để trở thành người ham học – 28 ngày từ')
    expect(caption).not.toContain('undefined')
  })

  it('keeps line breaks and leaves unknown placeholders untouched', () => {
    expect(fillBoardingCaption('A {so_ngay}\n\n{khac}', { so_ngay: 28 })).toBe('A 28\n\n{khac}')
  })
})

describe('HB-24: seed [MẪU] for the new flow', () => {
  it('fills every empty section with [MẪU] content', () => {
    const patch = habitFlowSeedPatch(null)
    expect(patch).not.toBeNull()
    const json = JSON.stringify(patch)
    expect(json).toContain('[MẪU]')
    const diagnose = patch?.diagnose as { questions: unknown[]; results: unknown[] }
    expect(diagnose.questions).toHaveLength(8)
    expect(diagnose.results).toHaveLength(4)
    // No unsourced stats or quotes in the seed (AGENTS §14).
    expect(json).not.toContain('"stats"')
    expect(json).not.toContain('"quote"')
  })

  it('never overwrites content Hana already wrote', () => {
    const patch = habitFlowSeedPatch({
      onePercent: { title: 'x', unknowns: [{ title: 'Của Hana' }] },
      diagnose: { questions: [{ statement: 'Của Hana', stage: 'cue' }] },
      loop: { stages: [{ stage: 'cue', title: 'a', explanation: 'b' }] },
      boardingPass: { captionTemplate: 'Của Hana' },
      privacyNote: 'Của Hana',
    })
    expect(patch).toBeNull()
  })

  it('keeps existing results / rules when only questions / stages are missing', () => {
    const results = [{ stage: 'cue', title: 'Của Hana', suggestion: 'Của Hana' }]
    const patch = habitFlowSeedPatch({ diagnose: { results }, loop: { rules: [{ title: 'R' }] } })
    expect((patch?.diagnose as { results: unknown }).results).toBe(results)
    expect((patch?.loop as { rules: unknown[] }).rules).toEqual([{ title: 'R' }])
  })
})
