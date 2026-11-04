'use client'

import React, { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { TrackerDayItem } from '../types'
import { CONFIDENCE_EMOTIONS, type EmotionKey } from '@/lib/emotions'
import { DEFAULT_DP01_CONTENT, type Dp01CheckInContent } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

interface DayCheckInModalProps {
  dayItem: TrackerDayItem | null
  atomicHabitTitle?: string
  checkInContent?: Dp01CheckInContent
  onClose: () => void
  onSave: (updated: TrackerDayItem) => void
  onDelete?: (dayNumber: number) => void
}

const CONFIDENCE_MOODS = [
  { key: 'insecure', emoji: '😫', label: 'Tự ti' },
  { key: 'unconfident', emoji: '😣', label: 'Chưa tự tin' },
  { key: 'somewhat_confident', emoji: '😊', label: 'Hơi tự tin' },
  { key: 'very_confident', emoji: '🥰', label: 'Rất tự tin' },
  { key: 'wonderful', emoji: '😍', label: 'Tuyệt vời' },
] as const

export function DayCheckInModal({
  dayItem,
  atomicHabitTitle = 'Thói quen hạt nhân',
  checkInContent = DEFAULT_DP01_CONTENT.checkIn,
  onClose,
  onSave,
  onDelete,
}: DayCheckInModalProps) {
  const isAlreadyRecorded = Boolean(dayItem?.completed || dayItem?.isMissed)
  const [completed, setCompleted] = useState<boolean>(
    isAlreadyRecorded ? Boolean(dayItem?.completed) : true,
  )
  const [isMinimal, setIsMinimal] = useState<boolean>(Boolean(dayItem?.isMinimal))
  const [isRest, setIsRest] = useState<boolean>(
    Boolean(!dayItem?.isPostDay && !dayItem?.completed && !dayItem?.isMissed),
  )

  // Map existing emotion key to confidence mood or default to somewhat_confident (😊)
  const initialMoodKey = dayItem?.emotion || 'somewhat_confident'
  const matchedMood =
    CONFIDENCE_MOODS.find((m) => m.key === initialMoodKey) ||
    CONFIDENCE_MOODS.find((m) => m.emoji === dayItem?.emoji) ||
    CONFIDENCE_MOODS[2]

  const [selectedKey, setSelectedKey] = useState<string>(matchedMood.key)
  const [selectedEmoji, setSelectedEmoji] = useState<string>(matchedMood.emoji)
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>(matchedMood.label)
  const [note, setNote] = useState<string>(dayItem?.note || '')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!dayItem) return null

  const handleSave = () => {
    onSave({
      ...dayItem,
      completed,
      isMinimal: completed ? isMinimal : false,
      isMissed: !completed && !isRest,
      emoji: selectedEmoji,
      moodLabel: selectedMoodLabel,
      emotion: selectedKey as EmotionKey,
      note,
    })
    onClose()
  }

  const handleResetDay = () => {
    if (onDelete) {
      onDelete(dayItem.dayNumber)
    } else {
      onSave({
        ...dayItem,
        completed: false,
        isMinimal: false,
        isMissed: false,
        emoji: undefined,
        moodLabel: undefined,
        emotion: undefined,
        note: '',
      })
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-lavender-mist shadow-soft-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-deep-navy to-deep-navy/90 text-white flex items-center justify-between">
          <div>
            <h3
              id="checkin-modal-title"
              className="font-ui font-bold text-base sm:text-lg text-white"
            >
              Ngày {dayItem.dayNumber}
              {dayItem.dayNumber % 7 === 0 ? ' · tới trạm' : ''}
            </h3>
            <span className="text-xs text-soft-pink/90 font-ui">
              {dayItem.dayOfWeek} · {dayItem.dateStr}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 font-ui">
          {/* Câu dẫn và tên Thói quen hạt nhân */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist/70">
            <p className="text-xs text-deep-navy/70 leading-relaxed">
              {dayItem.isPostDay ? checkInContent.postDayHint : checkInContent.restDayHint}
            </p>
            <p className="text-sm sm:text-base font-bold text-deep-navy">
              {atomicHabitTitle || 'Thói quen hạt nhân'}
            </p>
          </div>

          {/* Nút trạng thái: ✓ Đã làm, ◐ Bản tối giản, · Lỡ nhịp (+ Nghỉ theo nhịp nếu ngày nghỉ) */}
          <div className={`grid ${!dayItem.isPostDay ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
            <button
              type="button"
              onClick={() => {
                setCompleted(true)
                setIsMinimal(false)
                setIsRest(false)
              }}
              className={`py-2.5 px-2 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                completed && !isMinimal
                  ? 'bg-mint-haze border-deep-navy/30 text-deep-navy shadow-soft-md font-bold ring-2 ring-mint-haze'
                  : 'bg-white border-lavender-mist text-deep-navy/70 hover:bg-warm-ivory'
              }`}
            >
              <span>{vi.dp01.statusDone}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCompleted(true)
                setIsMinimal(true)
                setIsRest(false)
              }}
              className={`py-2.5 px-2 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                completed && isMinimal
                  ? 'bg-butter-cream border-deep-navy/30 text-deep-navy shadow-soft-md font-bold ring-2 ring-butter-cream'
                  : 'bg-white border-lavender-mist text-deep-navy/70 hover:bg-warm-ivory'
              }`}
            >
              <span>{vi.dp01.statusMinimal}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCompleted(false)
                setIsMinimal(false)
                setIsRest(false)
              }}
              className={`py-2.5 px-2 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                !completed && !isRest
                  ? 'bg-warm-ivory border-accent-pink text-accent-pink shadow-soft-md font-bold ring-2 ring-accent-pink/20'
                  : 'bg-white border-lavender-mist text-deep-navy/70 hover:bg-warm-ivory'
              }`}
            >
              <span>{vi.dp01.statusMissed}</span>
            </button>

            {!dayItem.isPostDay && (
              <button
                type="button"
                onClick={() => {
                  setCompleted(false)
                  setIsMinimal(false)
                  setIsRest(true)
                }}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isRest
                    ? 'bg-lavender-mist/60 border-deep-navy/40 text-deep-navy shadow-soft-md font-bold ring-2 ring-lavender-mist'
                    : 'bg-white border-lavender-mist text-deep-navy/70 hover:bg-warm-ivory'
                }`}
              >
                <span>{vi.dp01.statusRest}</span>
              </button>
            )}
          </div>

          {/* 5 nút cảm xúc */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-2">
              Cảm xúc hôm nay
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {CONFIDENCE_MOODS.map((m) => {
                const isSelected = selectedKey === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setSelectedKey(m.key)
                      setSelectedEmoji(m.emoji)
                      setSelectedMoodLabel(m.label)
                    }}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-bright-magenta/10 border-bright-magenta text-deep-navy shadow-soft-md ring-2 ring-bright-magenta/20 font-bold'
                        : 'bg-white border-lavender-mist text-deep-navy/70 hover:bg-warm-ivory hover:border-bright-magenta/40'
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[10px] mt-1 truncate">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ghi chú — không bắt buộc */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-1.5">
              Ghi chú — không bắt buộc
            </label>
            <input
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={checkInContent.notePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-warm-ivory border border-lavender-mist focus:border-bright-magenta outline-none text-xs text-deep-navy"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-warm-ivory border-t border-lavender-mist flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDay}
            className="text-xs text-deep-navy/70 hover:text-accent-pink font-ui transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{vi.dp01.deleteCheckinButton}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-ui font-medium text-deep-navy/70 hover:bg-white cursor-pointer"
            >
              {vi.dp01.close}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-2xl bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs font-ui font-bold shadow-soft-md transition-all active:scale-95 cursor-pointer"
            >
              {vi.dp01.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
