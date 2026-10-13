'use client'

import React, { useRef, useId } from 'react'
import { EMOTIONS, type EmotionKey } from '@/lib/emotions'
import { vi } from '@/lib/i18n/vi'

// Q14: Uses the 10 fixed emotions with emojis defined in src/lib/emotions.ts

export interface EmotionPickerProps {
  value?: string | null
  onChange?: (key: EmotionKey) => void
  disabled?: boolean
  label?: string
  className?: string
}

export function EmotionPicker({
  value,
  onChange,
  disabled = false,
  label,
  className = '',
}: EmotionPickerProps) {
  const id = useId()
  const labelId = `${id}-label`
  const containerRef = useRef<HTMLDivElement>(null)
  const groupLabel = label || vi.emotionPicker.label

  // Handle arrow key navigation across radio options
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (disabled) return

    let nextIndex = currentIndex

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % EMOTIONS.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + EMOTIONS.length) % EMOTIONS.length
    } else {
      return
    }

    const nextEmotion = EMOTIONS[nextIndex]
    if (nextEmotion && onChange) {
      onChange(nextEmotion.key)
    }

    // Focus the target radio button
    const buttons =
      containerRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
    if (buttons && buttons[nextIndex]) {
      buttons[nextIndex].focus()
    }
  }

  // Determine which item receives tabIndex 0
  const selectedIndex = EMOTIONS.findIndex((em) => em.key === value)
  const activeTabIndex = selectedIndex >= 0 ? selectedIndex : 0

  return (
    <div className={`w-full ${className}`}>
      {groupLabel && (
        <span id={labelId} className="block text-sm font-bold text-deep-navy mb-2.5 font-ui">
          {groupLabel}
        </span>
      )}

      <div
        ref={containerRef}
        role="radiogroup"
        aria-labelledby={groupLabel ? labelId : undefined}
        aria-label={groupLabel ? undefined : vi.emotionPicker.label}
        className="grid grid-cols-5 gap-1.5 sm:gap-2"
      >
        {EMOTIONS.map((emotion, index) => {
          const isSelected = value === emotion.key
          const tabIndex = disabled
            ? -1
            : isSelected || (selectedIndex === -1 && index === activeTabIndex)
              ? 0
              : -1

          return (
            <button
              key={emotion.key}
              role="radio"
              type="button"
              id={`${id}-radio-${emotion.key}`}
              aria-checked={isSelected}
              disabled={disabled}
              tabIndex={tabIndex}
              onClick={() => {
                if (!disabled && onChange) {
                  onChange(emotion.key)
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                'min-h-[44px] min-w-[44px] p-1.5 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all motion-reduce:transition-none duration-200 select-none cursor-pointer',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy',
                isSelected
                  ? 'border-accent-pink bg-soft-pink text-deep-navy font-bold shadow-sm ring-1 ring-accent-pink/50'
                  : 'border-deep-navy/15 bg-warm-ivory text-deep-navy/80 hover:bg-lavender-mist/30 hover:border-deep-navy/30',
                disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className="text-xl sm:text-2xl leading-none select-none mb-1"
                role="img"
                aria-hidden="true"
              >
                {emotion.emoji}
              </span>
              <span className="text-[11px] sm:text-xs font-ui text-center leading-tight tracking-tight">
                {emotion.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
