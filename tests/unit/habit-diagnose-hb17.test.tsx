import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import { migrateHabitDraft } from '@/components/habit/flow/draft'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import type { CleanHabitDiagnose } from '@/lib/habit/journey-content.server'
import { vi as viStrings } from '@/lib/i18n/vi'

function buildSample8Diagnose(): CleanHabitDiagnose {
  return {
    title: '[MẪU] Khám đúng bệnh | Nhận diện nút thắt',
    intro: null,
    quote: {
      text: '[MẪU] Thói quen nhỏ tạo nên thay đổi lớn.',
      author: '[MẪU] Tác giả',
      source: '[MẪU] Nguồn sách đã kiểm chứng',
      sourceUrl: 'https://example.test/source',
    },
    stats: [
      {
        id: 'stat-1',
        value: '[MẪU] 66 ngày',
        label: '[MẪU] Thời gian hình thành hành vi tự động',
        source: '[MẪU] Lally et al. (2009)',
      },
    ],
    questions: [
      { id: 'q1', statement: '[MẪU] Câu 1 (Cue)', stage: 'cue', isActive: true },
      { id: 'q2', statement: '[MẪU] Câu 2 (Cue)', stage: 'cue', isActive: true },
      { id: 'q3', statement: '[MẪU] Câu 3 (Craving)', stage: 'craving', isActive: true },
      { id: 'q4', statement: '[MẪU] Câu 4 (Craving)', stage: 'craving', isActive: true },
      { id: 'q5', statement: '[MẪU] Câu 5 (Response)', stage: 'response', isActive: true },
      { id: 'q6', statement: '[MẪU] Câu 6 (Response)', stage: 'response', isActive: true },
      { id: 'q7', statement: '[MẪU] Câu 7 (Reward)', stage: 'reward', isActive: true },
      { id: 'q8', statement: '[MẪU] Câu 8 (Reward)', stage: 'reward', isActive: true },
    ],
    stageResults: {
      cue: {
        title: '[MẪU] Nút thắt ở Tín hiệu (Cue)',
        suggestion: null,
        nextStepHint: '[MẪU] Chọn kỹ thuật Tín hiệu ở bước 5',
      },
      craving: {
        title: '[MẪU] Nút thắt ở Khao khát (Craving)',
        suggestion: null,
        nextStepHint: '[MẪU] Chọn kỹ thuật Khao khát ở bước 5',
      },
      response: {
        title: '[MẪU] Nút thắt ở Phản hồi (Response)',
        suggestion: null,
        nextStepHint: '[MẪU] Chọn kỹ thuật Phản hồi ở bước 5',
      },
      reward: {
        title: '[MẪU] Nút thắt ở Phần thưởng (Reward)',
        suggestion: null,
        nextStepHint: '[MẪU] Chọn kỹ thuật Phần thưởng ở bước 5',
      },
    },
  }
}

describe('HB-17: Bước 1 Khám đúng bệnh – 8 câu khám, kết quả nút thắt, nháp & analytics', () => {
  beforeEach(() => {
    localStorage.clear()
    delete (window as unknown as { plausible?: unknown }).plausible
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    delete (window as unknown as { plausible?: unknown }).plausible
  })

  it('1. Khi CMS rỗng (chưa có câu hỏi): chỉ hiện mở đầu, nút "Tiếp tục" luôn bật và không lộ chữ kỹ thuật', async () => {
    const { container } = render(
      <HabitFlow
        techniques={[]}
        journeyDays={28}
        diagnose={{
          title: null,
          intro: null,
          quote: null,
          stats: [],
          questions: [],
          stageResults: {
            cue: {},
            craving: {},
            response: {},
            reward: {},
          },
        }}
      />,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    expect(screen.getByRole('heading', { name: viStrings.hb16.steps.diagnose.title })).toBeDefined()
    expect(container.textContent).not.toContain('HB-17')
    expect(screen.queryByTestId('diagnose-counter')).toBeNull()

    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i })
    expect(nextBtn.hasAttribute('disabled')).toBe(false)

    await act(async () => {
      fireEvent.click(nextBtn)
    })
    expect(screen.getByText('Bước 2 / 6')).toBeDefined()
  })

  it('2. Khi có 8 câu: đếm x/8, nút bật khi trả lời đủ, hiện đúng giai đoạn có điểm trung bình cao nhất và gửi analytics 1 lần', async () => {
    const plausibleMock = vi.fn()
    window.plausible = plausibleMock

    const diagnose = buildSample8Diagnose()
    render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnose} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    // Mở đầu hiện câu trích và con số kèm nguồn
    expect(screen.getByTestId('diagnose-quote').textContent).toContain(
      '[MẪU] Nguồn sách đã kiểm chứng',
    )
    expect(screen.getByTestId('diagnose-stats').textContent).toContain('[MẪU] Lally et al. (2009)')

    // Ban đầu 0/8, nút Tiếp tục bị khoá
    const counter = screen.getByTestId('diagnose-counter')
    expect(counter.textContent).toBe('0/8')
    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i })
    expect(nextBtn.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('diagnose-result')).toBeNull()

    // Chọn điểm cho 8 câu: cho stage 'response' (q5, q6) điểm 5, các câu khác điểm 1-2
    const scoresByIndex = [1, 2, 2, 1, 5, 5, 1, 2]
    const radioGroups = screen.getAllByRole('radiogroup')
    expect(radioGroups).toHaveLength(8)

    for (let i = 0; i < 8; i++) {
      const score = scoresByIndex[i]!
      const radios = radioGroups[i]!.querySelectorAll('input[type="radio"]')
      await act(async () => {
        fireEvent.click(radios[score - 1]!)
      })
      expect(screen.getByTestId('diagnose-counter').textContent).toBe(`${i + 1}/8`)
    }

    // Trả lời đủ 8/8 -> nút Tiếp tục bật, hiện ngay kết quả của giai đoạn 'response' (TB 5.0)
    expect(nextBtn.hasAttribute('disabled')).toBe(false)
    const resultBox = screen.getByTestId('diagnose-result')
    expect(resultBox.textContent).toContain('[MẪU] Nút thắt ở Phản hồi (Response)')
    expect(resultBox.textContent).toContain('[MẪU] Chọn kỹ thuật Phản hồi ở bước 5')
    expect(resultBox.textContent).toContain('5.0/5')

    // Analytics diagnostic_completed gửi đúng 1 lần, chỉ gửi stage & totalQuestions, không gửi điểm từng câu
    expect(plausibleMock).toHaveBeenCalledTimes(1)
    expect(plausibleMock).toHaveBeenCalledWith('diagnostic_completed', {
      props: {
        stage: 'response',
        totalQuestions: 8,
      },
    })

    // Lưu trong nháp v2
    const savedDraft = JSON.parse(localStorage.getItem(HABIT_LOOP_STORAGE_KEY) || '{}')
    expect(savedDraft.diagnoseTopStage).toBe('response')
    expect(savedDraft.diagnoseAnswers.q5).toBe(5)
    expect(savedDraft.diagnoseAnswers.q6).toBe(5)
  })

  it('3. Nút "Bỏ qua phần khám" cho phép sang bước 2 ngay cả khi chưa trả lời đủ 8 câu', async () => {
    const diagnose = buildSample8Diagnose()
    render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnose} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    const skipBtn = screen.getByRole('button', { name: viStrings.hb17.skipButton })
    await act(async () => {
      fireEvent.click(skipBtn)
    })

    expect(screen.getByText('Bước 2 / 6')).toBeDefined()
  })

  it('4. Nháp có câu hỏi đã xoá hoặc tắt trong CMS thì bị lọc bỏ khi đọc nháp', () => {
    const rawDraft = {
      version: 2,
      step: 1,
      diagnoseAnswers: {
        q1: 4,
        q2: 5,
        deleted_question: 3,
        invalid_score: 99,
      },
      diagnoseTopStage: 'cue',
    }

    const activeQuestionIds = new Set(['q1', 'q2', 'q3', 'q4'])
    const migrated = migrateHabitDraft(rawDraft, undefined, activeQuestionIds)

    expect(migrated.diagnoseAnswers).toEqual({
      q1: 4,
      q2: 5,
    })
    // Vì mới trả lời 2/4 câu active nên diagnoseTopStage được làm sạch
    expect(migrated.diagnoseTopStage).toBeUndefined()
  })
})
