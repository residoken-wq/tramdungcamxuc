// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { habitChosenTechniqueSchema, habitPlanSubmissionSchema } from '@/lib/forms/schemas'
import { zipStateToFlowDraft, flowDraftToZipState, type ZipState } from '@/components/habit/zip/draft-adapter'
import { ZIP_11_TECHNIQUES } from '@/lib/habit/dp01d-content-patch'
import { getDefaultHabitFlowDraft } from '@/components/habit/flow/draft'

describe('DP-01d: Unit tests for Techniques, Adapter & Submission Schema', () => {
  const baseValidPlan = {
    scorecard: [{ habit: 'Uống nước ấm', rating: 'good' as const }],
    identityStatement: 'Tôi sẽ uống nước ấm để trở thành người có sức khỏe',
    anchorHabit: 'Uống nước ấm',
    rhythmDays: ['mon', 'wed', 'fri'] as const,
    startDate: '2026-11-05',
    email: 'test@example.com',
    consent: true,
  }

  it('1. 3 kỹ thuật Cue + ghi chú rỗng -> schema hợp lệ và lưu được', () => {
    const chosenTechniques = [
      { techniqueId: 1, stage: 'cue' as const, action: '' },
      { techniqueId: 2, stage: 'cue' as const, action: '   ' },
      { techniqueId: 3, stage: 'cue' as const, action: 'Ghi chú cụ thể' },
    ]

    for (const item of chosenTechniques) {
      const parsedItem = habitChosenTechniqueSchema.parse(item)
      expect(parsedItem.techniqueId).toBe(item.techniqueId)
      expect(parsedItem.stage).toBe('cue')
    }

    const plan = {
      ...baseValidPlan,
      chosenTechniques,
    }

    const res = habitPlanSubmissionSchema.safeParse(plan)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.chosenTechniques).toHaveLength(3)
      expect(res.data.chosenTechniques[0].action).toBe('')
      expect(res.data.chosenTechniques[1].action).toBe('')
      expect(res.data.chosenTechniques[2].action).toBe('Ghi chú cụ thể')
    }
  })

  it('2. ID giả hoặc không hợp lệ (<= 0, số âm, không phải số nguyên) -> bị chặn', () => {
    const invalidTechnique1 = { techniqueId: 0, stage: 'cue', action: '' }
    const invalidTechnique2 = { techniqueId: -5, stage: 'cue', action: 'Ghi chú' }
    const invalidTechnique3 = { techniqueId: 1.5, stage: 'cue', action: 'Ghi chú' }

    expect(habitChosenTechniqueSchema.safeParse(invalidTechnique1).success).toBe(false)
    expect(habitChosenTechniqueSchema.safeParse(invalidTechnique2).success).toBe(false)
    expect(habitChosenTechniqueSchema.safeParse(invalidTechnique3).success).toBe(false)
  })

  it('3. draft-adapter đi - về giữ đúng techniqueId thật và ghi chú', () => {
    const initialZipState: ZipState = {
      diagnoseAnswers: { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 2, 7: 3, 8: 4 },
      routines: [
        { id: '1', activity: 'Thức dậy 6h', score: '+' },
        { id: '2', activity: 'Tập thể dục', score: '+' },
      ],
      identity: {
        creatorName: 'Hana',
        identityAction: 'uống 1 cốc nước ấm',
        identityRole: 'người chăm sóc bản thân',
        postsPerWeek: 3,
        selectedDays: ['T2', 'T4', 'T6'],
        atomicHabit: 'rót sẵn nước ấm',
        selectedMentor: 'Thức dậy 6h',
        mentorTime: '06:00',
        whyImportant: 'Để có sức khỏe tốt',
        startDate: '2026-11-05',
        endDate: '2026-12-03',
        partnerName: '',
        companionName: 'Bạn đồng hành',
      },
      loopTechniques: {
        cues: ['1', '2', '3'],
        cravings: ['4'],
        responses: ['7'],
        rewards: ['10'],
        appliedNotes: {
          '1': 'Nhịp sinh học sáng',
          '2': '', // Ghi chú rỗng
          '3': 'Hẹn lúc 6h15',
          '4': 'Để cốc nước gần giường',
          '7': 'Chỉ cần rót nửa cốc',
          '10': '', // Ghi chú rỗng
        },
      },
    }

    // Convert zipState -> flowDraft
    const flowDraft = zipStateToFlowDraft(initialZipState, getDefaultHabitFlowDraft())

    expect(flowDraft.chosenTechniques.cue).toHaveLength(3)
    expect(flowDraft.chosenTechniques.cue[0]).toEqual({ techniqueId: 1, action: 'Nhịp sinh học sáng' })
    expect(flowDraft.chosenTechniques.cue[1]).toEqual({ techniqueId: 2, action: '' })
    expect(flowDraft.chosenTechniques.cue[2]).toEqual({ techniqueId: 3, action: 'Hẹn lúc 6h15' })
    expect(flowDraft.chosenTechniques.craving[0]).toEqual({ techniqueId: 4, action: 'Để cốc nước gần giường' })
    expect(flowDraft.chosenTechniques.response[0]).toEqual({ techniqueId: 7, action: 'Chỉ cần rót nửa cốc' })
    expect(flowDraft.chosenTechniques.reward[0]).toEqual({ techniqueId: 10, action: '' })

    // Convert flowDraft back -> restoredZipState
    const restoredZipState = flowDraftToZipState(flowDraft)

    expect(restoredZipState.loopTechniques.cues).toEqual(['1', '2', '3'])
    expect(restoredZipState.loopTechniques.cravings).toEqual(['4'])
    expect(restoredZipState.loopTechniques.responses).toEqual(['7'])
    expect(restoredZipState.loopTechniques.rewards).toEqual(['10'])

    expect(restoredZipState.loopTechniques.appliedNotes?.['1']).toBe('Nhịp sinh học sáng')
    expect(restoredZipState.loopTechniques.appliedNotes?.['2']).toBe('')
    expect(restoredZipState.loopTechniques.appliedNotes?.['3']).toBe('Hẹn lúc 6h15')
    expect(restoredZipState.loopTechniques.appliedNotes?.['4']).toBe('Để cốc nước gần giường')
    expect(restoredZipState.loopTechniques.appliedNotes?.['7']).toBe('Chỉ cần rót nửa cốc')
    expect(restoredZipState.loopTechniques.appliedNotes?.['10']).toBe('')
  })

  it('4. Dữ liệu 11 kỹ thuật zip định danh duy nhất theo name, chạy 2 lần không nhân đôi', () => {
    const existing = [...ZIP_11_TECHNIQUES]
    const names = existing.map((t) => t.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(11)

    // Giả lập logic idempotent trong script nạp:
    const simulateUpsert = (currentDocs: { id: number; name: string }[]) => {
      let created = 0
      let updated = 0
      const resultDocs = [...currentDocs]

      for (const target of ZIP_11_TECHNIQUES) {
        const found = resultDocs.find((d) => d.name.trim() === target.name.trim())
        if (found) {
          updated++
        } else {
          created++
          resultDocs.push({ id: resultDocs.length + 1, name: target.name })
        }
      }
      return { created, updated, total: resultDocs.length, docs: resultDocs }
    }

    // Lần 1: từ DB trống (0 docs)
    const run1 = simulateUpsert([])
    expect(run1.created).toBe(11)
    expect(run1.updated).toBe(0)
    expect(run1.total).toBe(11)

    // Lần 2: chạy lại trên kết quả lần 1 -> 0 created, 11 updated, total vẫn là 11 (không nhân đôi)
    const run2 = simulateUpsert(run1.docs)
    expect(run2.created).toBe(0)
    expect(run2.updated).toBe(11)
    expect(run2.total).toBe(11)
  })
})
