import React from 'react'
import { describe, it, expect, vi as vitestVi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { StepLoop } from '@/components/habit/flow/StepLoop'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import { vi as viStrings } from '@/lib/i18n/vi'
import { HABIT_LOOP_STORAGE_KEY, type PublicTechnique } from '@/lib/habit'
import type { CleanHabitLoop, CleanStepQuote } from '@/lib/habit/journey-content.server'
import { buildBoardingPass } from '@/lib/habit/boarding-pass'

const mockTechniques: PublicTechnique[] = [
  {
    id: 1,
    name: 'Thiết kế môi trường',
    stage: 'cue',
    exampleVideoUrl: 'https://youtube.com/watch?v=example1',
  },
  {
    id: 2,
    name: 'Gắn thẻ thói quen',
    stage: 'cue',
    exampleVideoUrl: 'javascript:alert(1)', // Malicious URL to test safeHref
  },
  {
    id: 3,
    name: 'Tín hiệu trực quan',
    stage: 'cue',
  },
  {
    id: 4,
    name: 'Cặp đôi cám dỗ',
    stage: 'craving',
  },
  {
    id: 5,
    name: 'Quy tắc 2 phút',
    stage: 'response',
  },
  {
    id: 6,
    name: 'Kỷ niệm chiến thắng',
    stage: 'reward',
  },
]

const sampleCmsLoop: CleanHabitLoop = {
  intro: {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Mọi thói quen trong cuộc sống đều vận hành theo vòng lặp 4 bước.',
            },
          ],
        },
      ],
    },
  },
  stages: [
    { stage: 'cue', title: 'Gợi ý / Tín hiệu', explanation: 'Tín hiệu kích hoạt phản xạ tự nhiên' },
    { stage: 'craving', title: 'Khao khát', explanation: 'Động lực thôi thúc bạn hành động' },
    { stage: 'response', title: 'Phản hồi', explanation: 'Hành động thực tế bạn thực hiện' },
    { stage: 'reward', title: 'Phần thưởng', explanation: 'Cảm giác thỏa mãn ghi nhận thành quả' },
  ],
  rules: [
    { title: 'Làm cho rõ ràng', body: 'Đặt tín hiệu ở nơi dễ thấy nhất' },
    { title: 'Làm cho hấp dẫn', body: 'Gắn với điều bạn yêu thích' },
    { title: 'Làm cho dễ dàng', body: 'Hạ thấp rào cản hành động' },
    { title: 'Làm cho thỏa mãn', body: 'Ghi nhận và tự thưởng ngay' },
  ],
  note: 'Hai giai đoạn đầu là nhận thức, hai giai đoạn sau là hành vi.',
  techniqueHint: 'Chỉ kỹ thuật được đánh dấu mới hiện trên Boarding Pass.',
}

const sampleQuote: CleanStepQuote = {
  text: 'Thói quen là giải pháp tin cậy cho những vấn đề thường nhật.',
  author: 'James Clear',
  source: 'Atomic Habits',
  sourceUrl: 'https://example.com/atomic-habits',
}

describe('HB-21: StepLoop & Habit Flow Vòng lặp', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('1. Đánh dấu và bỏ đánh dấu gọi onToggleTechnique đúng kỹ thuật và giai đoạn', () => {
    const handleToggle = vitestVi.fn()
    const handleUpdate = vitestVi.fn()

    render(
      <StepLoop
        techniques={mockTechniques}
        chosenTechniques={{
          cue: [],
          craving: [],
          response: [],
          reward: [],
        }}
        onToggleTechnique={handleToggle}
        onUpdateTechniqueAction={handleUpdate}
      />,
    )

    const cueCheckbox = screen.getByRole('checkbox', {
      name: 'Thiết kế môi trường',
    }) as HTMLInputElement
    expect(cueCheckbox).toBeDefined()
    expect(cueCheckbox.checked).toBe(false)

    fireEvent.click(cueCheckbox)
    expect(handleToggle).toHaveBeenCalledWith('cue', 1, 'Thiết kế môi trường')
  })

  it('2. Vô hiệu hóa (disable) checkbox thứ 3 khi một giai đoạn đã chọn đủ 2 kỹ thuật', () => {
    const handleToggle = vitestVi.fn()
    const handleUpdate = vitestVi.fn()

    render(
      <StepLoop
        techniques={mockTechniques}
        chosenTechniques={{
          cue: [
            { techniqueId: 1, action: 'Hành động 1' },
            { techniqueId: 2, action: 'Hành động 2' },
          ],
          craving: [],
          response: [],
          reward: [],
        }}
        onToggleTechnique={handleToggle}
        onUpdateTechniqueAction={handleUpdate}
      />,
    )

    const tech1Checkbox = screen.getByRole('checkbox', {
      name: 'Thiết kế môi trường',
    }) as HTMLInputElement
    const tech2Checkbox = screen.getByRole('checkbox', {
      name: 'Gắn thẻ thói quen',
    }) as HTMLInputElement
    const tech3Checkbox = screen.getByRole('checkbox', {
      name: 'Tín hiệu trực quan',
    }) as HTMLInputElement

    expect(tech1Checkbox.checked).toBe(true)
    expect(tech1Checkbox.disabled).toBe(false)

    expect(tech2Checkbox.checked).toBe(true)
    expect(tech2Checkbox.disabled).toBe(false)

    // Ô thứ 3 chưa chọn trong giai đoạn đã đủ 2 phải bị disable
    expect(tech3Checkbox.checked).toBe(false)
    expect(tech3Checkbox.disabled).toBe(true)

    // Giai đoạn khác (craving) vẫn bấm được bình thường
    const cravingCheckbox = screen.getByRole('checkbox', {
      name: 'Cặp đôi cám dỗ',
    }) as HTMLInputElement
    expect(cravingCheckbox.disabled).toBe(false)
  })

  it('3. Hiện link "Xem ví dụ" an toàn khi có exampleVideoUrl và loại bỏ link độc hại', () => {
    render(
      <StepLoop
        techniques={mockTechniques}
        chosenTechniques={{
          cue: [],
          craving: [],
          response: [],
          reward: [],
        }}
        onToggleTechnique={vitestVi.fn()}
        onUpdateTechniqueAction={vitestVi.fn()}
      />,
    )

    // Tech 1 có url hợp lệ -> có link 'Xem ví dụ'
    const validLink = screen.getByRole('link', { name: /Xem ví dụ/i })
    expect(validLink.getAttribute('href')).toBe('https://youtube.com/watch?v=example1')
    expect(validLink.getAttribute('target')).toBe('_blank')
    expect(validLink.getAttribute('rel')).toContain('noopener')

    // Tech 2 có javascript:alert(1) -> không được tạo thẻ link href độc hại
    const links = screen.getAllByRole('link', { name: /Xem ví dụ/i })
    expect(links.length).toBe(1) // Chỉ có tech 1
  })

  it('4. Ô "Hành động cụ thể" chỉ xuất hiện khi kỹ thuật được đánh dấu', () => {
    const handleUpdate = vitestVi.fn()

    render(
      <StepLoop
        techniques={mockTechniques}
        chosenTechniques={{
          cue: [{ techniqueId: 1, action: 'Để sách đầu giường' }],
          craving: [],
          response: [],
          reward: [],
        }}
        onToggleTechnique={vitestVi.fn()}
        onUpdateTechniqueAction={handleUpdate}
      />,
    )

    // Ô input xuất hiện cho tech 1
    const input = screen.getByDisplayValue('Để sách đầu giường')
    expect(input).toBeDefined()

    fireEvent.change(input, { target: { value: 'Để sách trên bàn làm việc' } })
    expect(handleUpdate).toHaveBeenCalledWith('cue', 1, 'Để sách trên bàn làm việc')

    // Không có ô input cho các kỹ thuật chưa được chọn
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBe(1)
  })

  it('5. CMS rỗng: ẩn phần giải thích và bước vẫn hiển thị bình thường', () => {
    render(
      <StepLoop
        techniques={mockTechniques}
        chosenTechniques={{
          cue: [],
          craving: [],
          response: [],
          reward: [],
        }}
        onToggleTechnique={vitestVi.fn()}
        onUpdateTechniqueAction={vitestVi.fn()}
        loop={null}
        quote={null}
      />,
    )

    expect(screen.queryByTestId('loop-explanation-section')).toBeNull()
    expect(screen.queryByTestId('loop-intro')).toBeNull()
    expect(screen.queryByTestId('loop-stages-container')).toBeNull()
    expect(screen.queryByTestId('loop-note')).toBeNull()
    expect(screen.queryByTestId('loop-rules-container')).toBeNull()
    expect(screen.queryByTestId('loop-quote')).toBeNull()

    // Danh sách kỹ thuật vẫn hiển thị đầy đủ
    expect(screen.getByText(viStrings.hb21.stepTitle)).toBeDefined()
    expect(screen.getByText('Thiết kế môi trường')).toBeDefined()
  })

  it('6. CMS có nội dung: hiển thị đầy đủ intro, 4 giai đoạn vòng lặp, note, 4 rules, quote', () => {
    render(
      <StepLoop
        techniques={mockTechniques}
        chosenTechniques={{
          cue: [],
          craving: [],
          response: [],
          reward: [],
        }}
        onToggleTechnique={vitestVi.fn()}
        onUpdateTechniqueAction={vitestVi.fn()}
        loop={sampleCmsLoop}
        quote={sampleQuote}
      />,
    )

    expect(screen.getByTestId('loop-explanation-section')).toBeDefined()
    expect(screen.getByTestId('loop-intro')).toBeDefined()
    expect(screen.getByTestId('loop-stages-container')).toBeDefined()

    // 4 stage cards
    expect(screen.getByTestId('loop-stage-card-cue')).toBeDefined()
    expect(screen.getByTestId('loop-stage-card-craving')).toBeDefined()
    expect(screen.getByTestId('loop-stage-card-response')).toBeDefined()
    expect(screen.getByTestId('loop-stage-card-reward')).toBeDefined()

    // Note
    expect(screen.getByTestId('loop-note')).toBeDefined()
    expect(
      screen.getByText('Hai giai đoạn đầu là nhận thức, hai giai đoạn sau là hành vi.'),
    ).toBeDefined()

    // 4 rules
    expect(screen.getByTestId('loop-rules-container')).toBeDefined()
    expect(screen.getByText('Làm cho rõ ràng')).toBeDefined()
    expect(screen.getByText('Làm cho thỏa mãn')).toBeDefined()

    // Quote
    expect(screen.getByTestId('loop-quote')).toBeDefined()
    expect(
      screen.getByText(/Thói quen là giải pháp tin cậy cho những vấn đề thường nhật/i),
    ).toBeDefined()
    expect(screen.getByText(/James Clear/i)).toBeDefined()
  })

  it('7. Boarding Pass chỉ hiển thị các kỹ thuật đã đánh dấu', () => {
    const data = buildBoardingPass(
      {
        identityStatement: 'Tôi sẽ đọc sách',
        techniqueIds: [1, 5], // Chỉ đánh dấu 1 (cue) và 5 (response)
        rhythmDays: ['mon', 'wed', 'fri'],
      },
      {
        journeyDays: 28,
        techniques: mockTechniques,
      },
    )

    const cueStage = data.techniquesByStage.find((s) => s.stage === 'cue')
    expect(cueStage?.techniqueNames).toEqual(['Thiết kế môi trường'])

    const responseStage = data.techniquesByStage.find((s) => s.stage === 'response')
    expect(responseStage?.techniqueNames).toEqual(['Quy tắc 2 phút'])

    // Craving và Reward không có kỹ thuật nào được đánh dấu
    const cravingStage = data.techniquesByStage.find((s) => s.stage === 'craving')
    expect(cravingStage?.techniqueNames).toEqual([])

    const rewardStage = data.techniquesByStage.find((s) => s.stage === 'reward')
    expect(rewardStage?.techniqueNames).toEqual([])
  })

  it('8. HabitFlow B5 validation: báo lỗi khi chưa đánh dấu kỹ thuật nào hoặc chưa nhập hành động', async () => {
    // Lưu nháp đang ở bước 5 với 0 kỹ thuật đã chọn
    localStorage.setItem(
      HABIT_LOOP_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        step: 5,
        scorecard: [],
        actionText: 'uống nước ấm',
        personText: 'người khỏe mạnh',
        identityStatement: 'Tôi sẽ uống nước ấm để trở thành người khỏe mạnh',
        chosenTechniques: {
          cue: [],
          craving: [],
          response: [],
          reward: [],
        },
        rhythmDays: ['mon', 'tue', 'wed'],
        rhythmFrequency: 3,
      }),
    )

    render(<HabitFlow techniques={mockTechniques} journeyDays={28} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(screen.getByText('Bước 5 / 6')).toBeDefined()

    // Bấm Tiếp tục khi chưa đánh dấu kỹ thuật nào -> Báo lỗi
    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i })
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    expect(screen.getByText(viStrings.hb21.errors.atLeastOneTechnique)).toBeDefined()

    // Đánh dấu 1 kỹ thuật nhưng xóa rỗng hành động cụ thể -> Báo lỗi
    const techCheckbox = screen.getByRole('checkbox', { name: 'Thiết kế môi trường' })
    await act(async () => {
      fireEvent.click(techCheckbox)
    })

    const actionInput = screen.getByPlaceholderText(viStrings.hb21.techniques.actionPlaceholder)
    await act(async () => {
      fireEvent.change(actionInput, { target: { value: '   ' } })
      fireEvent.click(nextBtn)
    })

    expect(screen.getByText(viStrings.hb21.errors.actionRequired)).toBeDefined()

    // Điền hành động cụ thể hợp lệ -> sang Bước 6 thành công
    await act(async () => {
      fireEvent.change(actionInput, { target: { value: 'Đặt bình nước ở bàn' } })
      fireEvent.click(nextBtn)
    })

    expect(screen.getByText('Bước 6 / 6')).toBeDefined()
  })
})
