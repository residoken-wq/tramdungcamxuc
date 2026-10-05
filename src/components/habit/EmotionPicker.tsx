'use client'

import React, { useRef, useId } from 'react'
import { EMOTIONS, type EmotionKey } from '@/lib/emotions'
import { vi } from '@/lib/i18n/vi'

// PENDING Q14: Uses the sample emotions defined in src/lib/emotions.ts

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
    if (disabled || EMOTIONS.length === 0) return

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
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
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
        className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3"
      >
        {EMOTIONS.map((emotion, index) => {
          const isSelected = value === emotion.key
          const Icon = emotion.icon
          const tabIndex = disabled ? -1 : isSelected || (selectedIndex === -1 && index === activeTabIndex) ? 0 : -1

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
                'min-h-[44px] min-w-[44px] p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy',
                isSelected
                  ? 'border-accent-pink bg-soft-pink text-deep-navy font-bold shadow-sm ring-1 ring-accent-pink/50'
                  : 'border-deep-navy/15 bg-white text-deep-navy/80 hover:bg-lavender-mist/30 hover:border-deep-navy/30',
                disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="w-6 h-6 flex items-center justify-center mb-1 text-current">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-xs font-ui text-center leading-tight tracking-tight">
                {emotion.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
