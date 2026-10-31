import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'
import { FlowProgressBar } from '@/components/habit/flow/FlowProgressBar'
import {
  HABIT_FLOW_DRAFT_VERSION,
  migrateHabitDraft,
  mapLegacyStepToFlowStep,
} from '@/components/habit/flow/draft'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('HB-16: Khung flow 3 giai đoạn / 6 bước & chuyển nháp v2', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  describe('1. Hàm chuyển nháp cũ (v1) -> mới (v2)', () => {
    it('chuyển bước cũ (không có version) theo bảng 1->3, 2->4, 3->5, 4->6 và gắn version: 2', () => {
      expect(mapLegacyStepToFlowStep(1, undefined)).toBe(3)
      expect(mapLegacyStepToFlowStep(2, undefined)).toBe(4)
      expect(mapLegacyStepToFlowStep(3, undefined)).toBe(5)
      expect(mapLegacyStepToFlowStep(4, undefined)).toBe(6)
      expect(mapLegacyStepToFlowStep(99, undefined)).toBe(1)

      const legacyStep3 = {
        step: 3,
        scorecard: [{ habit: 'Đọc sách sáng', rating: 'good', time: '06:30' }],
        anchorHabit: 'Đọc sách sáng',
        rhythmDays: ['mon', 'wed', 'fri'],
        twoMinuteAction: 'Đọc 1 trang sách',
        actionText: 'viết nhật ký 5 phút',
        personText: 'người sâu sắc',
        identityStatement: 'Tôi sẽ viết nhật ký 5 phút để trở thành người sâu sắc',
        chosenTechniques: {
          cue: [{ techniqueId: 10, action: 'Để sổ trên bàn' }],
          craving: [],
          response: [],
          reward: [],
        },
        name: 'Tên cũ',
        email: 'cu@example.test',
        consent: true,
      }

      const migrated = migrateHabitDraft(legacyStep3, new Set([10]))
      expect(migrated.version).toBe(HABIT_FLOW_DRAFT_VERSION)
      expect(migrated.step).toBe(5)
      expect(migrated.scorecard).toEqual([
        { habit: 'Đọc sách sáng', rating: 'good', time: '06:30' },
      ])
      expect(migrated.anchorHabit).toBe('Đọc sách sáng')
      expect(migrated.rhythmDays).toEqual(['mon', 'wed', 'fri'])
      expect(migrated.twoMinuteAction).toBe('Đọc 1 trang sách')
      expect(migrated.actionText).toBe('viết nhật ký 5 phút')
      expect(migrated.personText).toBe('người sâu sắc')
      expect(migrated.identityStatement).toBe(
        'Tôi sẽ viết nhật ký 5 phút để trở thành người sâu sắc',
      )
      expect(migrated.chosenTechniques.cue).toEqual([{ techniqueId: 10, action: 'Để sổ trên bàn' }])
      expect(migrated.name).toBe('')
      expect(migrated.email).toBe('')
      expect(migrated.consent).toBe(false)
    })

    it('giữ nguyên bước 1..6 khi nháp đã có version: 2', () => {
      for (const s of [1, 2, 3, 4, 5, 6] as const) {
        const v2Draft = migrateHabitDraft({ version: 2, step: s })
        expect(v2Draft.version).toBe(2)
        expect(v2Draft.step).toBe(s)
      }
    })

    it('mở HabitFlow với nháp cũ đang ở bước 3 -> vào thẳng B5 Vòng lặp và giữ dữ liệu', async () => {
      const legacyDraftAtStep3 = {
        step: 3,
        scorecard: [{ habit: 'Uống nước ấm', rating: 'good', time: '07:00' }],
        anchorHabit: 'Uống nước ấm',
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        twoMinuteAction: 'Rót sẵn cốc nước',
        actionText: 'tập thở 3 phút',
        personText: 'người bình an',
        identityStatement: 'Tôi sẽ tập thở 3 phút để trở thành người bình an',
        chosenTechniques: {
          cue: [{ techniqueId: 1, action: 'Ngồi ngay ngắn trên ghế' }],
          craving: [],
          response: [],
          reward: [],
        },
      }
      localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(legacyDraftAtStep3))

      render(
        <HabitFlow
          techniques={[{ id: 1, name: 'Thiết kế môi trường', stage: 'cue' }]}
          journeyDays={28}
        />,
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(screen.getByText('Bước 5 / 6')).toBeDefined()
      expect(
        screen.getByRole('heading', { name: viStrings.habit.wizard.step3.title }),
      ).toBeDefined()
      expect(screen.getByDisplayValue('Ngồi ngay ngắn trên ghế')).toBeDefined()

      // Nháp lưu lại trong localStorage đã được nâng lên version 2, step 5
      const saved = JSON.parse(localStorage.getItem(HABIT_LOOP_STORAGE_KEY) || '{}')
      expect(saved.version).toBe(2)
      expect(saved.step).toBe(5)
    })
  })

  describe('2. Thanh tiến trình 3 giai đoạn & điều hướng bước', () => {
    it('đánh dấu đúng bước hiện tại (aria-current="step"), bước đã qua bấm được, bước chưa tới bị khóa', () => {
      const selected: number[] = []
      render(
        <FlowProgressBar
          currentStep={3}
          journeyDays={28}
          isPlanSaved={false}
          onSelectStep={(s) => selected.push(s)}
        />,
      )

      const nav = screen.getByRole('navigation', { name: viStrings.hb16.progress.navAria })
      expect(within(nav).getByText(/Giai đoạn 1 · Khám/i)).toBeDefined()
      expect(within(nav).getByText(/Giai đoạn 2 · Xây/i)).toBeDefined()
      expect(within(nav).getByText(/Giai đoạn 3 · Chuyển mình/i)).toBeDefined()

      const step1Btn = within(nav).getByRole('button', { name: /Khám đúng bệnh/i })
      const step2Btn = within(nav).getByRole('button', { name: /Nguyên lý 1%/i })
      const step3Btn = within(nav).getByRole('button', { name: /Tìm Mentor/i })
      const step4Btn = within(nav).getByRole('button', { name: /Gọi tên thói quen/i })

      // Bước 1 & 2 đã qua: không disabled, có chữ "Đã qua"
      expect(step1Btn.hasAttribute('disabled')).toBe(false)
      expect(step1Btn.textContent).toContain(viStrings.hb16.progress.statusCompleted)
      expect(step2Btn.hasAttribute('disabled')).toBe(false)

      // Bước 3 hiện tại: có aria-current="step" và chữ "Bước hiện tại"
      expect(step3Btn.getAttribute('aria-current')).toBe('step')
      expect(step3Btn.textContent).toContain(viStrings.hb16.progress.statusCurrent)

      // Bước 4 chưa tới: disabled và có chữ "Chưa tới"
      expect(step4Btn.hasAttribute('disabled')).toBe(true)
      expect(step4Btn.textContent).toContain(viStrings.hb16.progress.statusUpcoming)

      // Bấm bước đã qua -> gọi onSelectStep; bấm bước chưa tới -> không gọi
      fireEvent.click(step1Btn)
      fireEvent.click(step4Btn)
      expect(selected).toEqual([1])

      // Mục "✦ 28 ngày" khi chưa lưu kế hoạch: để mờ, chưa có link /habit/tracker
      expect(screen.getByTestId('journey-tracker-locked')).toBeDefined()
      expect(screen.queryByTestId('journey-tracker-link')).toBeNull()
    })

    it('mục "✦ N ngày" dẫn tới /habit/tracker khi đã lưu kế hoạch', () => {
      render(
        <FlowProgressBar
          currentStep={6}
          journeyDays={28}
          isPlanSaved={true}
          onSelectStep={() => {}}
        />,
      )

      const trackerLink = screen.getByTestId('journey-tracker-link')
      expect(trackerLink.getAttribute('href')).toBe('/habit/tracker')
      expect(trackerLink.textContent).toContain('✦ 28 ngày')
    })

    it('nút Quay lại và bấm bước đã qua trên thanh tiến trình đều giữ nguyên dữ liệu', async () => {
      render(<HabitFlow techniques={[]} journeyDays={28} />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // B1 -> B2
      expect(screen.getByText(viStrings.hb16.steps.diagnose.samplePlaceholder)).toBeDefined()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
      })

      // B2 -> B3 bằng nút "Sang giai đoạn 2 · Xây thói quen →"
      expect(screen.getByText('Bước 2 / 6')).toBeDefined()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: viStrings.hb16.controls.toStage2 }))
      })

      // B3: thêm thói quen
      expect(screen.getByText('Bước 3 / 6')).toBeDefined()
      const habitInput = screen.getByPlaceholderText(viStrings.habit.wizard.step1.addPlaceholder)
      await act(async () => {
        fireEvent.change(habitInput, { target: { value: '[MẪU] Thiền buổi sáng' } })
        fireEvent.click(
          screen.getByRole('button', { name: viStrings.habit.wizard.step1.addButton }),
        )
      })
      expect(screen.getByText('[MẪU] Thiền buổi sáng')).toBeDefined()

      // Bấm nút Quay lại -> về B2, rồi bấm Tiếp -> lại sang B3 vẫn giữ thói quen
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Quay lại/i }))
      })
      expect(screen.getByText('Bước 2 / 6')).toBeDefined()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: viStrings.hb16.controls.toStage2 }))
      })
      expect(screen.getByText('Bước 3 / 6')).toBeDefined()
      expect(screen.getByText('[MẪU] Thiền buổi sáng')).toBeDefined()
    })
  })

  describe('3. Nhãn số ngày theo journeyDays & B6 không còn lưới xem trước', () => {
    it('không còn chữ "21" trên toàn bộ 6 bước khi journeyDays = 28 và B6 không render ProgressGrid', async () => {
      const { container } = render(<HabitFlow techniques={[]} journeyDays={28} />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Bước 1
      expect(container.textContent).not.toContain('21 ngày')

      // Sang Bước 2
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
      })
      expect(container.textContent).not.toContain('21 ngày')

      // Sang Bước 3
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: viStrings.hb16.controls.toStage2 }))
      })
      expect(container.textContent).not.toContain('21 ngày')

      // Thêm thói quen ở Bước 3 -> sang Bước 4
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText(viStrings.habit.wizard.step1.addPlaceholder), {
          target: { value: '[MẪU] Đọc sách' },
        })
        fireEvent.click(
          screen.getByRole('button', { name: viStrings.habit.wizard.step1.addButton }),
        )
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
      })
      expect(container.textContent).not.toContain('21 ngày')

      // Điền câu định danh ở Bước 4 -> sang Bước 5
      await act(async () => {
        fireEvent.change(
          screen.getByPlaceholderText(viStrings.habit.wizard.step2.actionPlaceholder),
          { target: { value: 'đọc sách 10 phút' } },
        )
        fireEvent.change(
          screen.getByPlaceholderText(viStrings.habit.wizard.step2.identityPlaceholder),
          { target: { value: 'người ham học hỏi' } },
        )
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
      })
      expect(container.textContent).not.toContain('21 ngày')

      // Sang Bước 6
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }))
      })
      expect(screen.getByText('Bước 6 / 6')).toBeDefined()
      expect(container.textContent).not.toContain('21 ngày')
      expect(container.textContent).toContain('28 ngày')

      // B6 không còn lưới xem trước 28 ngày (ProgressGrid)
      expect(screen.queryByRole('region', { name: viStrings.habit.progressGridLabel })).toBeNull()
    })
  })
})

describe('HB-16c: mobile step list and focus on step change', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('the step list toggle shows and hides the stage groups (collapsed on phones)', () => {
    render(<FlowProgressBar currentStep={1} journeyDays={28} onSelectStep={() => {}} />)
    const toggle = screen.getByRole('button', { name: viStrings.hb16.progress.showSteps })
    const list = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(list.className).toContain('hidden')
    expect(list.className).toContain('md:grid')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(list.className).not.toMatch(/(^|\s)hidden(\s|$)/)
  })

  it('moving to the next step focuses the step card', () => {
    render(<HabitFlow techniques={[]} journeyDays={28} />)
    fireEvent.click(screen.getAllByRole('button', { name: /Tiếp tục/ }).at(-1)!)
    const card = screen.getByRole('region', { name: viStrings.habit.wizard.stepIndicator(2, 6) })
    expect(document.activeElement).toBe(card)
  })
})
