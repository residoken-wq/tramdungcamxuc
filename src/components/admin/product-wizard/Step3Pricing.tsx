'use client'

import React from 'react'
import { showFor, type ProductType } from '@/lib/cms/product-form'
import { computePackageValue } from '@/lib/pricing'
import type { ProductOption } from '@/lib/cms/product-wizard.server'
import { vi } from '@/lib/i18n/vi'

interface PackageComponentItem {
  label: string
  quantity: number
  unitValue: number
  retailPrice?: number | null
  grantsProduct?: number | string | null
}

interface Step3PricingProps {
  type: ProductType
  saleStatus: 'on_sale' | 'free' | 'coming_soon' | 'consult' | 'hidden'
  price?: number | null
  salePrice?: number | null
  saleEndsAt?: string | null
  trialDays?: number | null
  accessDurationDays?: number | null
  externalUrl?: string | null
  externalLabel?: string | null
  components?: PackageComponentItem[] | null
  availableProducts: ProductOption[]
  onChange: (fields: {
    saleStatus?: 'on_sale' | 'free' | 'coming_soon' | 'consult' | 'hidden'
    price?: number | null
    salePrice?: number | null
    saleEndsAt?: string | null
    trialDays?: number | null
    accessDurationDays?: number | null
    externalUrl?: string | null
    externalLabel?: string | null
    components?: PackageComponentItem[] | null
  }) => void
}

export function Step3Pricing({
  type,
  saleStatus,
  price,
  salePrice,
  saleEndsAt,
  trialDays,
  accessDurationDays,
  externalUrl,
  externalLabel,
  components,
  availableProducts,
  onChange,
}: Step3PricingProps) {
  // Dùng chính các điều kiện showFor của CM-03
  const isPriceApplicable = showFor([
    'digital_tool',
    'ebook',
    'toolkit',
    'package',
    'coaching_trial',
    'workshop',
    'community',
    'b2b',
  ])({ type })

  const isSalePriceApplicable = showFor(['digital_tool'])({ type })
  const isTrialApplicable = showFor(['digital_tool'])({ type })
  const isExternalApplicable = showFor([
    'physical_external',
    'coaching_trial',
    'workshop',
    'community',
    'b2b',
  ])({ type })
  const isPackageApplicable = showFor(['package'])({ type })

  // Tính toán gói bằng đúng hàm computePackageValue của dự án
  const packageMetrics = isPackageApplicable
    ? computePackageValue({
        components: components || [],
        price: price ?? null,
        salePrice: salePrice ?? null,
      })
    : { totalValue: 0, discountPercent: null }

  // Thêm cấu phần mới
  const handleAddComponent = () => {
    const current = components ? [...components] : []
    current.push({
      label: '',
      quantity: 1,
      unitValue: 500000,
      retailPrice: null,
      grantsProduct: null,
    })
    onChange({ components: current })
  }

  // Xóa cấu phần
  const handleRemoveComponent = (index: number) => {
    if (!components) return
    const updated = components.filter((_, i) => i !== index)
    onChange({ components: updated })
  }

  // Sửa cấu phần
  const handleUpdateComponent = (
    index: number,
    field: keyof PackageComponentItem,
    val: unknown,
  ) => {
    if (!components) return
    const updated = components.map((comp, i) => {
      if (i === index) {
        return { ...comp, [field]: val }
      }
      return comp
    })
    onChange({ components: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-ui text-lg font-bold text-deep-navy">
          {vi.cms.wizard.steps.step3.title}
        </h2>
        <p className="text-sm text-deep-navy/70">
          {vi.cms.wizard.steps.step3.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Trạng thái mở bán */}
        <div className="md:col-span-2">
          <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
            {vi.cms.wizard.labels.saleStatus} <span className="text-red-500">*</span>
          </label>
          <select
            value={saleStatus}
            onChange={(e) =>
              onChange({
                saleStatus: e.target.value as
                  | 'on_sale'
                  | 'free'
                  | 'coming_soon'
                  | 'consult'
                  | 'hidden',
              })
            }
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
          >
            <option value="on_sale">Đang mở bán (on_sale)</option>
            <option value="free">Miễn phí (free)</option>
            <option value="coming_soon">Sắp ra mắt (coming_soon)</option>
            <option value="consult">Liên hệ tư vấn (consult)</option>
            <option value="hidden">Ẩn (hidden)</option>
          </select>
          <p className="mt-1 text-xs text-deep-navy/60">
            {vi.cms.productForm.sidebar.saleStatus}
          </p>
        </div>

        {/* Giá niêm yết */}
        {isPriceApplicable && (
          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.price}{' '}
              {saleStatus === 'on_sale' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={price != null ? price : ''}
              onChange={(e) =>
                onChange({
                  price: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={vi.cms.wizard.labels.pricePlaceholder}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.price}
            </p>
          </div>
        )}

        {/* Giá ưu đãi */}
        {isSalePriceApplicable && (
          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.salePrice}
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={salePrice != null ? salePrice : ''}
              onChange={(e) =>
                onChange({
                  salePrice: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={vi.cms.wizard.labels.salePricePlaceholder}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.salePrice}
            </p>
          </div>
        )}

        {/* Hạn ưu đãi */}
        {isSalePriceApplicable && (
          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.saleEndsAt}
            </label>
            <input
              type="datetime-local"
              value={saleEndsAt || ''}
              onChange={(e) => onChange({ saleEndsAt: e.target.value || null })}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.saleEndsAt}
            </p>
          </div>
        )}

        {/* Số ngày dùng thử */}
        {isTrialApplicable && (
          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.trialDays}
            </label>
            <input
              type="number"
              min="0"
              value={trialDays != null ? trialDays : ''}
              onChange={(e) =>
                onChange({
                  trialDays: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={vi.cms.wizard.labels.trialDaysPlaceholder}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.trialDays}
            </p>
          </div>
        )}

        {/* Thời hạn sử dụng */}
        {isTrialApplicable && (
          <div>
            <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
              {vi.cms.wizard.labels.accessDurationDays}
            </label>
            <input
              type="number"
              min="0"
              value={accessDurationDays != null ? accessDurationDays : ''}
              onChange={(e) =>
                onChange({
                  accessDurationDays: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={vi.cms.wizard.labels.accessDurationPlaceholder}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            />
            <p className="mt-1 text-xs text-deep-navy/60">
              {vi.cms.productForm.descriptions.accessDurationDays}
            </p>
          </div>
        )}

        {/* Liên kết ngoài & nhãn nút */}
        {isExternalApplicable && (
          <>
            <div>
              <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
                {vi.cms.wizard.labels.externalUrl}{' '}
                {type === 'physical_external' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={externalUrl || ''}
                onChange={(e) => onChange({ externalUrl: e.target.value })}
                placeholder={vi.cms.wizard.labels.externalUrlPlaceholder}
                className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
              />
              <p className="mt-1 text-xs text-deep-navy/60">
                {vi.cms.productForm.descriptions.externalUrl}
              </p>
            </div>

            <div>
              <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
                {vi.cms.wizard.labels.externalLabel}
              </label>
              <input
                type="text"
                value={externalLabel || ''}
                onChange={(e) => onChange({ externalLabel: e.target.value })}
                placeholder={vi.cms.wizard.labels.externalLabelPlaceholder}
                className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
              />
              <p className="mt-1 text-xs text-deep-navy/60">
                {vi.cms.productForm.descriptions.externalLabel}
              </p>
            </div>
          </>
        )}

        {/* Cấu phần của gói đồng hành */}
        {isPackageApplicable && (
          <div className="md:col-span-2 space-y-4 rounded-2xl border border-lavender-mist bg-soft-pink/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-ui text-base font-bold text-deep-navy">
                  {vi.cms.wizard.labels.packageComponents}
                </h3>
                <p className="text-xs text-deep-navy/70">
                  {vi.cms.productForm.descriptions.components}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddComponent}
                className="inline-flex items-center gap-1.5 rounded-xl bg-bright-magenta px-3.5 py-1.5 font-ui text-xs font-bold text-white shadow-sm hover:bg-accent-pink transition-all"
              >
                + {vi.cms.wizard.buttons.addComponent}
              </button>
            </div>

            {/* Bảng cấu phần */}
            {(!components || components.length === 0) && (
              <div className="rounded-xl border border-dashed border-lavender-mist bg-white p-6 text-center text-sm text-deep-navy/60">
                Chưa có cấu phần nào trong gói. Nhấn <strong>"Thêm cấu phần"</strong> để bắt đầu.
              </div>
            )}

            {components && components.length > 0 && (
              <div className="space-y-3">
                {components.map((comp, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-lavender-mist bg-white p-4 sm:grid-cols-12 items-center"
                  >
                    {/* Tên cấu phần */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-deep-navy/70 mb-1">
                        {vi.cms.wizard.labels.packageComponentName}
                      </label>
                      <input
                        type="text"
                        value={comp.label}
                        onChange={(e) =>
                          handleUpdateComponent(idx, 'label', e.target.value)
                        }
                        placeholder="Ví dụ: Coaching 1:1"
                        className="w-full rounded-lg border border-lavender-mist px-3 py-1.5 text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                        required
                      />
                    </div>

                    {/* Số lượng */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-deep-navy/70 mb-1">
                        {vi.cms.wizard.labels.packageComponentQty}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={comp.quantity}
                        onChange={(e) =>
                          handleUpdateComponent(
                            idx,
                            'quantity',
                            Number(e.target.value) || 1,
                          )
                        }
                        className="w-full rounded-lg border border-lavender-mist px-3 py-1.5 text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                      />
                    </div>

                    {/* Đơn giá */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-deep-navy/70 mb-1">
                        {vi.cms.wizard.labels.packageComponentUnitValue}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={comp.unitValue}
                        onChange={(e) =>
                          handleUpdateComponent(
                            idx,
                            'unitValue',
                            Number(e.target.value) || 0,
                          )
                        }
                        className="w-full rounded-lg border border-lavender-mist px-3 py-1.5 text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                      />
                    </div>

                    {/* Cấp quyền sản phẩm */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-deep-navy/70 mb-1">
                        {vi.cms.wizard.labels.packageComponentGrants}
                      </label>
                      <select
                        value={comp.grantsProduct ? String(comp.grantsProduct) : ''}
                        onChange={(e) =>
                          handleUpdateComponent(
                            idx,
                            'grantsProduct',
                            e.target.value ? Number(e.target.value) || e.target.value : null,
                          )
                        }
                        className="w-full rounded-lg border border-lavender-mist px-3 py-1.5 text-xs text-deep-navy focus:border-bright-magenta focus:outline-none"
                      >
                        <option value="">-- Không cấp quyền --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nút xóa */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 p-1"
                        title="Xóa cấu phần này"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bảng tổng kết giá trị tính tự động */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-bright-magenta/20 bg-white p-4 shadow-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-deep-navy/60">
                  {vi.cms.wizard.labels.totalPackageValue}
                </div>
                <div className="font-ui text-xl font-bold text-deep-navy">
                  {packageMetrics.totalValue.toLocaleString('vi-VN')} đ
                </div>
              </div>

              {packageMetrics.discountPercent != null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-deep-navy/70">
                    {vi.cms.wizard.labels.packageDiscount}:
                  </span>
                  <span className="inline-flex items-center rounded-full bg-mint-haze px-3 py-1 font-ui text-sm font-extrabold text-deep-navy">
                    Ưu đãi {packageMetrics.discountPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
