import React from 'react'

export interface StoryHighlightItem {
  title: string
  text?: string
}

export interface StoryHighlightsProps {
  items?: StoryHighlightItem[]
  isDark?: boolean
}

export function StoryHighlights({ items, isDark = false }: StoryHighlightsProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.slice(0, 4).map((hl, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-card border ${
            isDark
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
          }`}
        >
          <span
            className={`block font-display text-2xl sm:text-3xl ${
              isDark ? 'text-soft-pink' : 'text-bright-magenta'
            }`}
          >
            {String(idx + 1).padStart(2, '0')}
          </span>
          <h4 className="mt-1 font-ui font-bold text-sm sm:text-base leading-snug">{hl.title}</h4>
          {hl.text && (
            <p
              className={`mt-1 font-ui text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                isDark ? 'text-white/80' : 'text-deep-navy/75'
              }`}
            >
              {hl.text}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
