import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  zipStateToFlowDraft,
  flowDraftToZipState,
  type ZipState,
} from '@/components/habit/zip/draft-adapter'
import { getDefaultHabitFlowDraft } from '@/components/habit/flow/draft'

describe('DP-01 Habit Flow Components & Logic', () => {
  it('enforces brand tokens in created zip habit components', () => {
    const dir = path.join(process.cwd(), 'src/components/habit/zip')
    const files = [
      'HabitTrackerHeader.tsx',
      'HabitTrackerFooter.tsx',
      'StepNavigation.tsx',
      'StepQuoteHeader.tsx',
      'Steps/Step1Diagnose.tsx',
      'Steps/Step2PercentPrinciple.tsx',
      'Steps/Step3FindMentor.tsx',
      'Steps/Step4IdentityHabit.tsx',
      'Steps/Step5LoopDesign.tsx',
      'Result/BoardingPassCard.tsx',
      'HabitTrackerApp.tsx',
    ]

    // Forbidden raw tokens that should have brand prefixes
    const forbiddenPatterns = [
      /(?<![\w-])text-navy(?![\w-])/,
      /(?<![\w-])bg-navy(?![\w-])/,
      /(?<![\w-])border-navy(?![\w-])/,
      /(?<![\w-])text-magenta(?![\w-])/,
      /(?<![\w-])bg-magenta(?![\w-])/,
      /(?<![\w-])border-magenta(?![\w-])/,
      /(?<![\w-])bg-lavender(?![\w-])/,
      /(?<![\w-])border-lavender(?![\w-])/,
      /(?<![\w-])bg-mint(?![\w-])/,
      /(?<![\w-])bg-butter(?![\w-])/,
      /(?<![\w-])bg-ivory(?![\w-])/,
      /(?<![\w-])text-slate-500(?![\w-])/,
    ]

    for (const relPath of files) {
      const fullPath = path.join(dir, relPath)
      expect(fs.existsSync(fullPath)).toBe(true)
      const content = fs.readFileSync(fullPath, 'utf8')

      for (const pattern of forbiddenPatterns) {
        const match = content.match(pattern)
        if (match) {
          throw new Error(`File ${relPath} contains forbidden token "${match[0]}" matching ${pattern}`)
        }
      }
    }
  })

  it('calculates 1% exponential formula accurately for 28 days and 365 days', () => {
    const calcGain = (n: number) => Math.pow(1.01, n)
    const calcLoss = (n: number) => Math.pow(0.99, n)

    expect(Number(calcGain(28).toFixed(2))).toBe(1.32)
    expect(Number(calcLoss(28).toFixed(2))).toBe(0.75)

    expect(Number(calcGain(365).toFixed(2))).toBe(37.78)
    expect(Number(calcLoss(365).toFixed(2))).toBe(0.03)
  })

  it('calculates date range for 28-day habit journey', () => {
    const startDate = '2026-11-04'
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 27) // 28 days total

    const endFormatted = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    expect(endFormatted).toBe('2026-12-01')
  })

  it('generates rateText correctly based on selected days', () => {
    const getRateText = (days: string[]) => {
      if (days.length === 7) return 'Mỗi ngày (cả tuần)'
      if (days.length > 0) return `${days.length} lần một tuần · ${days.join(' · ')}`
      return 'Chưa chọn nhịp'
    }

    expect(getRateText([])).toBe('Chưa chọn nhịp')
    expect(getRateText(['T2', 'T4', 'T6'])).toBe('3 lần một tuần · T2 · T4 · T6')
    expect(getRateText(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'])).toBe('Mỗi ngày (cả tuần)')
  })

  it('preserves technique notes and selections through two-way draft adapter', () => {
    const zipState: ZipState = {
      diagnoseAnswers: { 1: 5, 2: 4, 3: 1 },
      routines: [
        { id: 1, time: '07:00', activity: 'Uống nước', score: '+' },
        { id: 2, time: '07:30', activity: 'Lướt tin tức', score: '-' },
      ],
      identity: {
        identityAction: 'viết bài',
        identityRole: 'người viết sâu sắc',
        postsPerWeek: '3',
        selectedDays: ['T2', 'T4', 'T6'],
        atomicHabit: 'mở Notion gõ 3 dòng',
        selectedMentor: 'Uống nước',
        mentorTime: '07:00',
        companionName: 'Hana',
        startDate: '2026-11-04',
        endDate: '2026-12-01',
      },
      loopTechniques: {
        cues: ['Soi lại nhịp sinh học', 'Ghép thói quen mới'],
        cravings: [],
        responses: ['Quy tắc 2 phút'],
        rewards: ['Ghi nhận mình mỗi lần thực hiện'],
        appliedNotes: {
          'tech-1': 'Buổi sáng 7h năng lượng cao',
          'tech-7': 'Chỉ cần viết 3 câu',
        },
      },
    }

    const baseDraft = getDefaultHabitFlowDraft()
    const flowDraft = zipStateToFlowDraft(zipState, baseDraft)

    expect(flowDraft.actionText).toBe('viết bài')
    expect(flowDraft.personText).toBe('người viết sâu sắc')
    expect(flowDraft.anchorHabit).toBe('Uống nước')
    expect(flowDraft.twoMinuteAction).toBe('mở Notion gõ 3 dòng')
    expect(flowDraft.rhythmDays).toEqual(['mon', 'wed', 'fri'])

    const convertedBack = flowDraftToZipState(flowDraft)
    expect(convertedBack.identity.identityAction).toBe('viết bài')
    expect(convertedBack.identity.identityRole).toBe('người viết sâu sắc')
    expect(convertedBack.identity.selectedMentor).toBe('Uống nước')
    expect(convertedBack.identity.selectedDays).toEqual(['T2', 'T4', 'T6'])
  })
})
