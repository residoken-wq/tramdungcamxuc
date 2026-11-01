'use client'

import React, { useId, useState } from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { normalizeVi } from './block-search'
import { useStylePanel } from './style-context'
import { FieldLabel, Group } from './style-controls'

interface IconPickerFieldProps {
  value?: string
  onChange?: (val: string) => void
  label?: string
}

export function IconPickerField({
  value = 'star',
  onChange,
  label = 'Chọn biểu tượng',
}: IconPickerFieldProps) {
  const { tab } = useStylePanel()
  const searchId = useId()
  const [query, setQuery] = useState('')

  // Self-filter for Puck tab architecture (only visible on Content tab)
  if (tab !== 'content') return null

  const norm = normalizeVi(query)
  const filtered = norm
    ? BRAND_ICONS.filter(
        (i) => normalizeVi(i.label).includes(norm) || normalizeVi(i.value).includes(norm),
      )
    : BRAND_ICONS

  return (
    <Group title={label}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={searchId}>Tìm biểu tượng</FieldLabel>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Gõ tên biểu tượng (sao, check, tim...)"
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-deep-navy/20 bg-white px-2.5 text-xs text-deep-navy placeholder:text-deep-navy/40 focus:border-bright-magenta focus:outline-none"
          />
        </div>

        <div
          role="radiogroup"
          aria-label={label}
          className="grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto rounded-lg border border-deep-navy/10 bg-warm-ivory/30 p-2"
        >
          {filtered.map((item) => {
            const isSelected = value === item.value
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                title={item.label}
                onClick={() => onChange?.(item.value)}
                className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition ${
                  isSelected
                    ? 'bg-bright-magenta text-white shadow-sm'
                    : 'bg-white text-deep-navy hover:bg-lavender-mist/50'
                }`}
              >
                <BrandIcon name={item.value} size={20} aria-hidden="true" />
                <span className="line-clamp-1 w-full text-center text-[10px] leading-tight">
                  {item.label}
                </span>
              </button>
            )
          })}
          {filtered.length === 0 ? (
            <div className="col-span-4 p-3 text-center text-xs text-deep-navy/60">
              Không tìm thấy biểu tượng phù hợp
            </div>
          ) : null}
        </div>
      </div>
    </Group>
  )
}
