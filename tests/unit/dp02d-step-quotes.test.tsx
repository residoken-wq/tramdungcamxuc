import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Step3FindMentor } from '@/components/habit/zip/Steps/Step3FindMentor'

describe('Step3FindMentor stepQuotes overrides', () => {
  const defaultRoutines = [{ id: '1', activity: 'Uống nước', score: '+' as const }]

  it('renders default zip quote and author when stepQuote is not provided', () => {
    render(
      <Step3FindMentor
        routines={defaultRoutines}
        selectedMentor=""
        onRoutinesChange={() => {}}
        onMentorSelect={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )

    expect(
      screen.getByText('“Môi trường là bàn tay vô hình định hình hành vi của con người.”'),
    ).not.toBeNull()
    expect(screen.getByText('— James Clear, Atomic Habits —')).not.toBeNull()
  })

  it('renders CMS quote and author when stepQuote is provided', () => {
    const customQuote = {
      text: 'Môi trường tạo nên số phận con người.',
      author: 'Tác giả Tùy Chỉnh',
      source: 'Sách Hay',
    }

    render(
      <Step3FindMentor
        routines={defaultRoutines}
        selectedMentor=""
        stepQuote={customQuote}
        onRoutinesChange={() => {}}
        onMentorSelect={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    )

    expect(screen.getByText('“Môi trường tạo nên số phận con người.”')).not.toBeNull()
    expect(screen.getByText('Tác giả Tùy Chỉnh')).not.toBeNull()
  })
})
