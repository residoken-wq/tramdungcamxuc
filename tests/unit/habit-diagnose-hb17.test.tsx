import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import { StepBoardingPass } from '@/components/habit/flow/StepBoardingPass'
import { migrateHabitDraft } from '@/components/habit/flow/draft'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import type { Weekday } from '@/lib/habit/rhythm'
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
        value: '[MẪU] 66 ngày',
        label: '[MẪU] Thời gian hình thành hành vi tự động',
        sourceLabel: '[MẪU] Lally et al. (2009)',
        sourceUrl: 'https://example.test/lally',
      },
    ],
    questions: [
      { statement: '[MẪU] Câu 1 (Cue)', stage: 'cue' },
      { statement: '[MẪU] Câu 2 (Cue)', stage: 'cue' },
      { statement: '[MẪU] Câu 3 (Craving)', stage: 'craving' },
      { statement: '[MẪU] Câu 4 (Craving)', stage: 'craving' },
      { statement: '[MẪU] Câu 5 (Response)', stage: 'response' },
      { statement: '[MẪU] Câu 6 (Response)', stage: 'response' },
      { statement: '[MẪU] Câu 7 (Reward)', stage: 'reward' },
      { statement: '[MẪU] Câu 8 (Reward)', stage: 'reward' },
    ],
    scaleMinLabel: 'Hoàn toàn không đúng',
    scaleMaxLabel: 'Rất đúng với tôi',
    results: [
      {
        stage: 'cue',
        title: '[MẪU] Nút thắt ở Tín hiệu (Cue)',
        suggestion: '[MẪU] Chọn kỹ thuật Tín hiệu ở bước 5',
      },
      {
        stage: 'craving',
        title: '[MẪU] Nút thắt ở Khao khát (Craving)',
        suggestion: '[MẪU] Chọn kỹ thuật Khao khát ở bước 5',
      },
      {
        stage: 'response',
        title: '[MẪU] Nút thắt ở Phản hồi (Response)',
        suggestion: '[MẪU] Chọn kỹ thuật Phản hồi ở bước 5',
      },
      {
        stage: 'reward',
        title: '[MẪU] Nút thắt ở Phần thưởng (Reward)',
        suggestion: '[MẪU] Chọn kỹ thuật Phần thưởng ở bước 5',
      },
    ],
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

  it('1. Khi CMS rỗng (chưa có câu hỏi): chỉ hiện mở đầu, nút "Tiếp tục" luôn bật và không có khảo sát', async () => {
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
          scaleMinLabel: null,
          scaleMaxLabel: null,
          results: [],
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

  it('2. Khi có 8 câu: đếm x/8, nút bật khi trả lời đủ, hiện đúng giai đoạn có điểm trung bình cao nhất', async () => {
    const diagnose = buildSample8Diagnose()
    render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnose} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

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

    // Lưu trong nháp v2
    const savedDraft = JSON.parse(localStorage.getItem(HABIT_LOOP_STORAGE_KEY) || '{}')
    expect(savedDraft.diagnoseAnswers).toEqual(scoresByIndex)
    expect(savedDraft.diagnoseQuestionCount).toBe(8)
  })

  it('3. Khi CMS không có dòng results cho giai đoạn đó: chỉ hiện tên giai đoạn, không bịa gợi ý', async () => {
    const diagnoseWithoutResults: CleanHabitDiagnose = {
      ...buildSample8Diagnose(),
      results: [],
    }

    render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnoseWithoutResults} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    const radioGroups = screen.getAllByRole('radiogroup')
    const scoresByIndex = [1, 2, 2, 1, 5, 5, 1, 2] // stage response cao nhất
    for (let i = 0; i < 8; i++) {
      const score = scoresByIndex[i]!
      const radios = radioGroups[i]!.querySelectorAll('input[type="radio"]')
      await act(async () => {
        fireEvent.click(radios[score - 1]!)
      })
    }

    const resultBox = screen.getByTestId('diagnose-result')
    expect(resultBox.textContent).toContain('Phản hồi (Response)')
    expect(resultBox.textContent).not.toContain('Chọn kỹ thuật')
  })

  it('4. Con số có link nguồn; câu trích có tác giả · nguồn', async () => {
    const diagnose = buildSample8Diagnose()
    render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnose} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    // Câu trích
    const quoteEl = screen.getByTestId('diagnose-quote')
    expect(quoteEl.textContent).toContain('[MẪU] Thói quen nhỏ tạo nên thay đổi lớn.')
    expect(quoteEl.textContent).toContain('[MẪU] Tác giả')
    const quoteLink = quoteEl.querySelector('a')
    expect(quoteLink).not.toBeNull()
    expect(quoteLink?.textContent).toBe('[MẪU] Nguồn sách đã kiểm chứng')
    expect(quoteLink?.getAttribute('href')).toBe('https://example.test/source')
    expect(quoteLink?.getAttribute('rel')).toContain('noopener')

    // Con số
    const statsEl = screen.getByTestId('diagnose-stats')
    expect(statsEl.textContent).toContain('[MẪU] 66 ngày')
    expect(statsEl.textContent).toContain('[MẪU] Thời gian hình thành hành vi tự động')
    const statLink = statsEl.querySelector('a')
    expect(statLink).not.toBeNull()
    expect(statLink?.textContent).toBe('[MẪU] Lally et al. (2009)')
    expect(statLink?.getAttribute('href')).toBe('https://example.test/lally')
    expect(statLink?.getAttribute('rel')).toContain('noopener')
  })

  it('5. Đổi số câu: nháp bỏ câu trả lời cũ; nháp HB-16 không có field mới vẫn đọc được; chặn giá trị lạ', () => {
    // 5a. Số câu trong CMS (8) khác diagnoseQuestionCount của nháp (4) -> bỏ câu trả lời cũ
    const rawOldCountDraft = {
      version: 2,
      step: 1,
      diagnoseAnswers: [1, 2, 3, 4],
      diagnoseQuestionCount: 4,
    }
    const migratedOldCount = migrateHabitDraft(rawOldCountDraft, undefined, 8)
    expect(migratedOldCount.diagnoseAnswers).toBeUndefined()

    // 5b. Nháp HB-16 cũ (không có diagnoseAnswers hay diagnoseQuestionCount) vẫn đọc bình thường
    const rawHb16Draft = {
      version: 2,
      step: 3,
      scorecard: [{ habit: 'Uống 1 ly nước', rating: 'good' }],
      anchorHabit: 'Uống 1 ly nước',
    }
    const migratedHb16 = migrateHabitDraft(rawHb16Draft, undefined, 8)
    expect(migratedHb16.diagnoseAnswers).toBeUndefined()
    expect(migratedHb16.diagnoseQuestionCount).toBeUndefined()
    expect(migratedHb16.scorecard).toHaveLength(1)
    expect(migratedHb16.anchorHabit).toBe('Uống 1 ly nước')

    // 5c. Chặn giá trị lạ: ngoài 1..5 -> null
    const rawStrangeDraft = {
      version: 2,
      step: 1,
      diagnoseAnswers: [1, 99, 0, 'invalid', null, 5],
      diagnoseQuestionCount: 6,
    }
    const migratedStrange = migrateHabitDraft(rawStrangeDraft, undefined, 6)
    expect(migratedStrange.diagnoseAnswers).toEqual([1, null, null, null, null, 5])
  })

  it('6. diagnostic_completed chỉ gửi một lần và F5 khôi phục từ nháp không gửi lại', async () => {
    const plausibleMock = vi.fn()
    window.plausible = plausibleMock

    const diagnose = buildSample8Diagnose()
    const { unmount } = render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnose} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    const scoresByIndex = [1, 2, 2, 1, 5, 5, 1, 2]
    const radioGroups = screen.getAllByRole('radiogroup')
    for (let i = 0; i < 8; i++) {
      const score = scoresByIndex[i]!
      const radios = radioGroups[i]!.querySelectorAll('input[type="radio"]')
      await act(async () => {
        fireEvent.click(radios[score - 1]!)
      })
    }

    // Gửi analytics 1 lần khi đủ 8 câu
    expect(plausibleMock).toHaveBeenCalledTimes(1)
    expect(plausibleMock).toHaveBeenCalledWith('diagnostic_completed', {
      props: {
        stage: 'response',
        totalQuestions: 8,
      },
    })

    // Sửa điểm câu 1 -> không gửi lại
    const firstRadios = radioGroups[0]!.querySelectorAll('input[type="radio"]')
    await act(async () => {
      fireEvent.click(firstRadios[1]!)
    })
    expect(plausibleMock).toHaveBeenCalledTimes(1)

    unmount()

    // F5: khôi phục nháp đã hoàn thành từ localStorage -> không gửi lại analytics
    plausibleMock.mockClear()
    render(<HabitFlow techniques={[]} journeyDays={28} diagnose={diagnose} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(plausibleMock).not.toHaveBeenCalled()
  })

  it('7. privacyNote: có thì hiện ở bước 6, rỗng thì không hiện', () => {
    const defaultProps = {
      identityStatement: 'Tôi là người khỏe mạnh',
      actionText: 'Tập thể dục',
      personText: 'Người khỏe mạnh',
      anchorHabit: 'Đánh răng',
      twoMinuteAction: 'Chống đẩy 2 cái',
      rhythmDays: ['mon', 'wed', 'fri'] as Weekday[],
      chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
      selectedTechniqueIds: [],
      journeyDays: 28,
      techniques: [],
      name: 'Nguyen Van A',
      email: 'a@example.test',
      consent: true,
      honeypot: '',
      isSubmitting: false,
      onNameChange: vi.fn(),
      onEmailChange: vi.fn(),
      onConsentChange: vi.fn(),
      onHoneypotChange: vi.fn(),
      onTurnstileVerify: vi.fn(),
      onSubmitPlan: vi.fn(),
    }

    // Có privacyNote
    const { unmount } = render(
      <StepBoardingPass {...defaultProps} privacyNote="Dữ liệu chỉ lưu trên máy bạn." />,
    )
    const noteEl = screen.getByTestId('boarding-pass-privacy-note')
    expect(noteEl.textContent).toBe('Dữ liệu chỉ lưu trên máy bạn.')
    unmount()

    // privacyNote = null
    render(<StepBoardingPass {...defaultProps} privacyNote={null} />)
    expect(screen.queryByTestId('boarding-pass-privacy-note')).toBeNull()
  })

  it('8. Nút "Bỏ qua phần khám" cho phép sang bước 2 ngay cả khi chưa trả lời câu nào', async () => {
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
})
