'use client'

import React, { useId } from 'react'
import { vi } from '@/lib/i18n/vi'
import { parseTitleWords, toggleTitleWordAt, type TitleWordItem } from './title-word-chips'
import { FieldLabelWithAa } from './text-style/FieldLabelWithAa'
import { CurrentFieldContext } from './text-style/current-field-context'
import { useStylePanel } from './style-context'
import { isFieldVisible } from '@/puck/style/field-groups'

export interface TitleHighlightInputProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  readOnly?: boolean
  id?: string
  name?: string
}

export function TitleHighlightInput({
  value = '',
  onChange,
  placeholder = 'Dùng *từ* để tô màu, ~từ~ để gạch ngang',
  readOnly = false,
  id: propId,
  name,
  label = 'Tiêu đề',
}: TitleHighlightInputProps) {
  const generatedId = useId()
  const inputId = propId || generatedId

  // Tab filter: only show on 'content' tab
  const { tab } = useStylePanel()
  if (name && !isFieldVisible(name, tab)) {
    return null
  }

  const { words } = parseTitleWords(value)

  const handleChipClick = (index: number) => {
    if (readOnly) return
    const updated = toggleTitleWordAt(value, index)
    onChange(updated)
  }

  const getChipAriaLabel = (item: TitleWordItem) => {
    if (item.state === 'highlight') {
      return `Chữ "${item.word}" – Đang nhấn (*). Bấm để chuyển sang gạch ngang (~).`
    }
    if (item.state === 'strike') {
      return `Chữ "${item.word}" – Đang gạch ngang (~). Bấm để bỏ chọn.`
    }
    return `Chữ "${item.word}" – Bình thường. Bấm để nhấn (*).`
  }

  return (
    <div className="flex flex-col w-full">
      <CurrentFieldContext.Provider value={name}>
        <FieldLabelWithAa
          label={label}
          el="label"
          htmlFor={inputId}
          readOnly={readOnly}
          className={words.length > 0 ? 'mb-1.5' : 'mb-3'}
        >
          <input
            type="text"
            id={inputId}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            aria-label={label}
            title={label}
            className="w-full h-9 px-3 text-xs rounded-lg border border-deep-navy/20 bg-white text-deep-navy focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition"
          />
        </FieldLabelWithAa>
      </CurrentFieldContext.Provider>

      {words.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3 pt-0.5">
          <div
            className="flex flex-wrap gap-1.5 items-center"
            role="group"
            aria-label="Chọn từ để nhấn hoặc gạch ngang"
          >
            {words.map((item) => {
              const isHighlight = item.state === 'highlight'
              const isStrike = item.state === 'strike'

              const baseStyles =
                'px-2 py-1 text-xs rounded-md border transition-all cursor-pointer flex items-center gap-1 select-none'

              let stateStyles =
                'bg-white text-deep-navy border-lavender-mist/80 hover:bg-lavender-mist/30 hover:border-deep-navy/30'
              if (isHighlight) {
                stateStyles =
                  'bg-bright-magenta text-white border-bright-magenta font-semibold shadow-xs'
              } else if (isStrike) {
                stateStyles =
                  'bg-lavender-mist text-deep-navy/70 line-through border-deep-navy/30 hover:bg-lavender-mist/80'
              }

              return (
                <button
                  key={`${item.word}-${item.index}`}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleChipClick(item.index)}
                  aria-label={getChipAriaLabel(item)}
                  title={getChipAriaLabel(item)}
                  className={`${baseStyles} ${stateStyles}`}
                >
                  <span>{item.word}</span>
                  {isHighlight && (
                    <span
                      aria-hidden="true"
                      className="text-[10px] opacity-90 font-bold ml-0.5"
                    >
                      *
                    </span>
                  )}
                  {isStrike && (
                    <span
                      aria-hidden="true"
                      className="text-[10px] opacity-90 font-bold ml-0.5"
                    >
                      ~
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-[10px] text-deep-navy/60 font-ui italic">
            {vi.bx04?.chipHelp || 'Bấm chip: lần 1 nhấn (*), lần 2 gạch ngang (~), lần 3 bỏ.'}
          </p>
        </div>
      )}
    </div>
  )
}
