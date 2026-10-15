import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HabitLoopWizard } from '@/components/habit/HabitLoopWizard'
import { HABIT_LOOP_STORAGE_KEY } from '@/lib/habit'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('HabitLoopWizard Draft Management (T2-03)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('bỏ qua name và email khi đọc lại từ nháp cũ trong localStorage', async () => {
    // Nháp cũ có lưu name và email
    const legacyDraft = {
      step: 4,
      actionText: 'thiền 10 phút',
      personText: 'người điềm tĩnh',
      identityStatement: 'Tôi sẽ thiền 10 phút để trở thành người điềm tĩnh',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      consent: true,
      scorecard: [],
      chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
    }
    localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(legacyDraft))

    render(<HabitLoopWizard techniques={[]} />)

    // Đợi timeout 0 load nháp
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Ở bước 4, kiểm tra input name và email có rỗng không
    const nameInput = screen.getByLabelText(
      viStrings.habit.wizard.step4.nameLabel,
    ) as HTMLInputElement
    const emailInput = screen.getByLabelText(
      viStrings.habit.wizard.step4.emailLabel,
    ) as HTMLInputElement
    const consentCheckbox = screen.getByRole('checkbox', {
      name: new RegExp(viStrings.habit.wizard.step4.consentLabel, 'i'),
    }) as HTMLInputElement

    expect(nameInput.value).toBe('')
    expect(emailInput.value).toBe('')
    expect(consentCheckbox.checked).toBe(false)
  })

  it('không lưu name, email hoặc consent vào localStorage khi người dùng nhập', async () => {
    const initialDraft = {
      step: 4,
      actionText: 'thiền 10 phút',
      personText: 'người điềm tĩnh',
      identityStatement: 'Tôi sẽ thiền 10 phút để trở thành người điềm tĩnh',
      scorecard: [],
      chosenTechniques: { cue: [], craving: [], response: [], reward: [] },
    }
    localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(initialDraft))

    render(<HabitLoopWizard techniques={[]} />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    const nameInput = screen.getByLabelText(viStrings.habit.wizard.step4.nameLabel)
    const emailInput = screen.getByLabelText(viStrings.habit.wizard.step4.emailLabel)

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Hana Lương' } })
      fireEvent.change(emailInput, { target: { value: 'hana@tramdungcamxuc.com' } })
    })

    const stored = localStorage.getItem(HABIT_LOOP_STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.name).toBeUndefined()
    expect(parsed.email).toBeUndefined()
    expect(parsed.consent).toBeUndefined()
    expect(parsed.actionText).toBe('thiền 10 phút')
  })
})
