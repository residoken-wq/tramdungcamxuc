'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import type { WorkshopAudienceProductOption } from '@/lib/cms/workshop-wizard.server'

interface Step1AudienceProps {
  title: string
  selectedAudienceIds: (number | string)[]
  availableProducts: WorkshopAudienceProductOption[]
  onChange: (fields: {
    title?: string
    selectedAudienceIds?: (number | string)[]
  }) => void
}

export function Step1Audience({
  title,
  selectedAudienceIds,
  availableProducts,
  onChange,
}: Step1AudienceProps) {
  const toggleProduct = (productId: number | string) => {
    const isSelected = selectedAudienceIds.some((id) => String(id) === String(productId))
    let nextIds: (number | string)[]

    if (isSelected) {
      nextIds = selectedAudienceIds.filter((id) => String(id) !== String(productId))
    } else {
      nextIds = [...selectedAudienceIds, productId]
    }

    onChange({ selectedAudienceIds: nextIds })
  }

  const selectAll = () => {
    onChange({ selectedAudienceIds: availableProducts.map((p) => p.id) })
  }

  const clearAll = () => {
    onChange({ selectedAudienceIds: [] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
          {vi.cms.workshopWizard.steps.step1.title}
        </h2>
        <p className="mt-1 font-ui text-sm text-deep-navy/70">
          {vi.cms.workshopWizard.steps.step1.description}
        </p>
      </div>

      <div className="space-y-6">
        {/* Tên buổi workshop */}
        <div>
          <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
            {vi.cms.workshopWizard.labels.title} <span className="text-accent-pink">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={vi.cms.workshopWizard.labels.titlePlaceholder}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 font-ui text-sm text-deep-navy shadow-sm focus:border-bright-magenta focus:outline-none"
            required
          />
        </div>

        {/* Danh sách sản phẩm được tham gia */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="font-ui text-xs font-bold text-deep-navy">
                {vi.cms.workshopWizard.labels.audience} <span className="text-accent-pink">*</span>
              </label>
              <p className="font-ui text-[11px] text-deep-navy/60">
                {vi.cms.workshopWizard.labels.audienceHint}
              </p>
            </div>

            {availableProducts.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-ui">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-bright-magenta hover:underline font-semibold"
                >
                  Chọn tất cả
                </button>
                <span className="text-deep-navy/30">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-deep-navy/60 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>

          {availableProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-lavender-mist bg-white p-6 text-center">
              <p className="font-ui text-xs text-deep-navy/70">
                Chưa có sản phẩm gói hoặc workshop nào trong danh mục. Vui lòng tạo sản phẩm trước.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableProducts.map((prod) => {
                const isSelected = selectedAudienceIds.some((id) => String(id) === String(prod.id))
                return (
                  <button
                    key={prod.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleProduct(prod.id)}
                    className={`group relative flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-bright-magenta bg-soft-pink/20 shadow-sm ring-2 ring-bright-magenta/20'
                        : 'border-lavender-mist/60 bg-white hover:border-lavender-mist hover:bg-warm-ivory/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by button click
                      className="mt-1 h-4 w-4 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-lavender-mist/60 px-2 py-0.5 font-ui text-[10px] font-bold text-deep-navy">
                          {prod.type === 'package' ? 'Gói đồng hành' : 'Workshop'}
                        </span>
                      </div>
                      <h4 className="mt-1 font-ui text-xs font-bold text-deep-navy group-hover:text-bright-magenta">
                        {prod.name}
                      </h4>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedAudienceIds.length > 0 && (
            <p className="mt-2 font-ui text-xs font-semibold text-bright-magenta">
              ✓ Đã chọn {selectedAudienceIds.length} gói / sản phẩm được cấp quyền tham gia
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
