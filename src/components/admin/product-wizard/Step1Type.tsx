'use client'

import React from 'react'
import { PRODUCT_TYPES, type ProductType } from '@/lib/cms/product-form'
import { vi } from '@/lib/i18n/vi'

interface Step1TypeProps {
  selectedType: ProductType
  onSelectType: (type: ProductType) => void
}

export function Step1Type({ selectedType, onSelectType }: Step1TypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-ui text-lg font-bold text-deep-navy">
          {vi.cms.wizard.steps.step1.title}
        </h2>
        <p className="text-sm text-deep-navy/70">{vi.cms.wizard.steps.step1.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_TYPES.map((type) => {
          const typeInfo = vi.cms.wizard.types[type]
          const isSelected = selectedType === type

          return (
            <button
              key={type}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectType(type)}
              className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${
                isSelected
                  ? 'border-bright-magenta bg-soft-pink/30 ring-2 ring-bright-magenta/20 shadow-sm'
                  : 'border-lavender-mist/70 bg-white hover:border-lavender-mist hover:bg-warm-ivory/50'
              }`}
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
                      isSelected
                        ? 'bg-bright-magenta text-white'
                        : 'bg-lavender-mist/60 text-deep-navy/70 group-hover:bg-soft-pink group-hover:text-bright-magenta'
                    }`}
                  >
                    {typeInfo.tag}
                  </span>

                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bright-magenta text-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <h3 className="font-ui text-base font-bold text-deep-navy group-hover:text-bright-magenta transition-colors">
                  {typeInfo.label}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-deep-navy/70">
                  {typeInfo.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-lavender-mist/30 text-[11px] font-semibold text-bright-magenta">
                {isSelected ? '✓ Đang chọn loại này' : 'Nhấn để chọn →'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
