'use client'

import React, { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import type { HabitScorecardItem, HabitScorecardRating } from '@/lib/habit'

export interface StepMentorProps {
  scorecard: HabitScorecardItem[]
  anchorHabit: string
  onAddHabit: (text: string, rating: HabitScorecardRating) => void
  onUpdateTime: (index: number, timeVal: string) => void
  onSelectAnchor: (habitText: string) => void
  onRemoveHabit: (index: number) => void
  onUpdateRating: (index: number, rating: HabitScorecardRating) => void
  onError: (msg: string | null) => void
}

export function StepMentor({
  scorecard,
  anchorHabit,
  onAddHabit,
  onUpdateTime,
  onSelectAnchor,
  onRemoveHabit,
  onUpdateRating,
  onError,
}: StepMentorProps) {
  const [newHabitText, setNewHabitText] = useState('')
  const [newHabitRating, setNewHabitRating] = useState<HabitScorecardRating>('neutral')
  const habitInputId = useId()

  const handleAdd = (textToAdd?: string, ratingToAdd?: HabitScorecardRating) => {
    const text = (textToAdd ?? newHabitText).trim()
    const rating = ratingToAdd ?? newHabitRating
    if (!text) {
      onError(vi.habit.wizard.errors.habitRequired)
      return
    }
    onAddHabit(text, rating)
    if (textToAdd === undefined) {
      setNewHabitText('')
    }
    onError(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
          {vi.habit.wizard.step1.title}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">{vi.habit.wizard.step1.subtitle}</p>
      </div>

      {/* Ô thêm thói quen */}
      <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist">
        <label
          htmlFor={habitInputId}
          className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-2"
        >
          {vi.habit.wizard.step1.addPlaceholder}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id={habitInputId}
            type="text"
            value={newHabitText}
            onChange={(e) => setNewHabitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder={vi.habit.wizard.step1.addPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
          />
          <div className="flex gap-2">
            <select
              value={newHabitRating}
              onChange={(e) => setNewHabitRating(e.target.value as HabitScorecardRating)}
              className="px-3 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
              aria-label={vi.habit.wizard.errors.ratingAria}
            >
              <option value="good">{vi.habit.wizard.step1.goodLabel}</option>
              <option value="neutral">{vi.habit.wizard.step1.neutralLabel}</option>
              <option value="bad">{vi.habit.wizard.step1.badLabel}</option>
            </select>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleAdd()}
              className="whitespace-nowrap"
            >
              {vi.habit.wizard.step1.addButton}
            </Button>
          </div>
        </div>

        {/* Gợi ý mẫu */}
        <div className="mt-4 pt-3 border-t border-lavender-mist/40">
          <span className="text-xs text-deep-navy/70 block mb-2 font-medium">
            {vi.habit.wizard.step1.samplesPrompt}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {vi.habit.wizard.step1.sampleHabits.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleAdd(sample, 'neutral')}
                className="text-xs px-2.5 py-1 rounded-full bg-white border border-lavender-mist text-deep-navy hover:bg-soft-pink hover:border-accent-pink transition-colors"
              >
                + {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách thói quen hiện tại */}
      <div className="space-y-3">
        {scorecard.length > 0 && (
          <>
            {scorecard.some((item) => item.rating === 'good') ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-warm-ivory border border-lavender-mist text-xs text-deep-navy">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-bright-magenta">
                    {vi.hb09.step1.anchorSectionTitle}:
                  </span>
                  <span>{vi.hb09.step1.anchorHint}</span>
                </div>
                {anchorHabit ? (
                  <button
                    type="button"
                    onClick={() => onSelectAnchor(anchorHabit)}
                    className="text-xs text-deep-navy/70 hover:text-bright-magenta underline font-medium text-left"
                  >
                    {vi.hb09.step1.clearAnchor}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-warm-ivory border border-lavender-mist text-xs text-deep-navy/80">
                💡 {vi.hb09.step1.noGoodHabitHint}
              </div>
            )}
          </>
        )}

        {scorecard.length === 0 ? (
          <p className="text-center py-8 text-deep-navy/60 italic text-sm">
            {vi.habit.wizard.step1.emptyPrompt}
          </p>
        ) : (
          scorecard.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border border-lavender-mist bg-white hover:bg-warm-ivory transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* anchorHabit is capped at 120 chars in habitPlans – longer habits cannot be the anchor */}
                {item.rating === 'good' && item.habit.length <= 120 ? (
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none">
                    <input
                      type="radio"
                      name="anchorHabit"
                      checked={anchorHabit === item.habit}
                      onChange={() => onSelectAnchor(item.habit)}
                      className="w-4 h-4 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
                      aria-label={`${vi.hb09.step1.anchorRadioLabel}: ${item.habit}`}
                    />
                    {anchorHabit === item.habit && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-butter-cream text-deep-navy border border-butter-cream/80">
                        {vi.hb09.step1.anchorBadge}
                      </span>
                    )}
                  </label>
                ) : (
                  <div className="w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="text-sm font-medium text-deep-navy break-words min-w-0 flex-1">
                  {item.habit}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <label htmlFor={`scorecard-time-${index}`} className="sr-only">
                    {vi.hb09.step1.timeAriaLabel(item.habit)}
                  </label>
                  <input
                    id={`scorecard-time-${index}`}
                    type="time"
                    value={item.time || ''}
                    onChange={(e) => onUpdateTime(index, e.target.value)}
                    aria-label={vi.hb09.step1.timeAriaLabel(item.habit)}
                    className="px-2 py-1 text-xs rounded border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-1 focus:ring-bright-magenta w-24"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateRating(index, 'good')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      item.rating === 'good'
                        ? 'bg-mint-haze text-deep-navy ring-2 ring-deep-navy/20'
                        : 'bg-warm-ivory text-deep-navy/70 hover:bg-mint-haze/50'
                    }`}
                    aria-label={vi.hb09.step1.ratingAria(item.habit, 'good')}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRating(index, 'neutral')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      item.rating === 'neutral'
                        ? 'bg-butter-cream text-deep-navy ring-2 ring-deep-navy/20'
                        : 'bg-warm-ivory text-deep-navy/70 hover:bg-butter-cream/50'
                    }`}
                    aria-label={vi.hb09.step1.ratingAria(item.habit, 'neutral')}
                  >
                    =
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRating(index, 'bad')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      item.rating === 'bad'
                        ? 'bg-soft-pink text-deep-navy ring-2 ring-deep-navy/20'
                        : 'bg-warm-ivory text-deep-navy/70 hover:bg-soft-pink/50'
                    }`}
                    aria-label={vi.hb09.step1.ratingAria(item.habit, 'bad')}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveHabit(index)}
                    className="ml-2 p-1 text-deep-navy/70 hover:text-deep-navy text-sm"
                    aria-label={vi.habit.wizard.step1.deleteButton}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

