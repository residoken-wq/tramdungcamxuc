'use client'

import React from 'react'
import Link from 'next/link'
import {
  buildPackageComparison,
  type ProductPackageInput,
  type PublicProduct,
} from '@/lib/products'
import { formatVnd } from '@/lib/format'
import { useClientProducts } from '@/puck/client-preview'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'

export interface PackageComparisonProps {
  version?: number
  packages?: Array<{ packageId?: string | number }>
  packageIds?: Array<string | number>
  showTotalValue?: boolean
  showDiscountPercent?: boolean
  note?: string
  showPaymentPolicyLink?: boolean
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    packages?: PublicProduct[]
  }
  puck?: {
    isEditing?: boolean
  }
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function PackageComparison({
  packages: rawPackages,
  packageIds,
  showTotalValue = true,
  showDiscountPercent = true,
  note,
  showPaymentPolicyLink = false,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: PackageComparisonProps) {
  const isEditing = puck?.isEditing ?? false
  const sectionRef = React.useRef<HTMLElement | null>(null)
  const hasTrackedView = React.useRef(false)

  const resolvedIds = React.useMemo(() => {
    return (rawPackages?.map((p) => p?.packageId).filter(Boolean) ?? packageIds ?? []) as Array<
      string | number
    >
  }, [rawPackages, packageIds])

  const { products: loadedPackages, loading } = useClientProducts({
    productIds: resolvedIds.slice(0, 3),
    mode: 'manual',
    initialProducts: _resolved?.packages,
  })

  React.useEffect(() => {
    if (isEditing || hasTrackedView.current || !loadedPackages || loadedPackages.length === 0) {
      return
    }

    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && !hasTrackedView.current) {
          hasTrackedView.current = true
          const slugs = loadedPackages.map((p) => p.slug).filter(Boolean)
          track('package_viewed', {
            packageIds: resolvedIds,
            ...(slugs.length > 0 ? { packages: slugs } : {}),
          })
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [isEditing, loadedPackages, resolvedIds])

  if (!isEditing && (!loadedPackages || loadedPackages.length === 0)) {
    return null
  }

  if (loading && loadedPackages.length === 0) {
    return (
      <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-5xl py-8 text-center text-sm font-ui text-deep-navy/60">
          Đang tải dữ liệu các gói...
        </div>
      </section>
    )
  }

  if (loadedPackages.length === 0) {
    if (isEditing) {
      return (
        <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
          <div className="mx-auto max-w-5xl py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
            Chưa có gói nào được chọn. Vui lòng chọn từ 1 đến 3 gói Growth Mirror trong thanh bên
            phải.
          </div>
        </section>
      )
    }
    return null
  }

  const now = new Date()
  const comparison = buildPackageComparison(loadedPackages as ProductPackageInput[], now)
  const pkgs = comparison.packages
  const rows = comparison.rows

  return (
    <section
      ref={sectionRef}
      className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
    >
      <div className="mx-auto max-w-5xl">
        {/* Desktop Comparison Table (Hidden on small screens) */}
        <div className="hidden md:block overflow-hidden rounded-card border border-deep-navy/15 bg-white shadow-soft">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-deep-navy/10 bg-lavender-mist/30">
                <th
                  scope="col"
                  className="py-5 px-6 font-ui text-sm font-bold uppercase tracking-wider text-deep-navy w-1/3 text-left"
                >
                  Cấu phần & Quyền lợi
                </th>
                {pkgs.map((pkg) => (
                  <th
                    key={pkg.id}
                    scope="col"
                    className="py-5 px-6 font-display text-2xl uppercase tracking-tight text-deep-navy text-center"
                  >
                    {pkg.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-navy/10 font-ui text-sm">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-warm-ivory/50 transition-colors">
                  <th
                    scope="row"
                    className="py-4 px-6 font-medium text-deep-navy text-left font-normal"
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-4 px-6 text-center">
                      {cell.text === 'Có' ? (
                        <span className="font-bold text-accent-pink text-base">Có</span>
                      ) : cell.text === 'Không' ? (
                        <span className="text-deep-navy/40 font-medium">Không</span>
                      ) : (
                        <span className="font-bold text-deep-navy text-base">{cell.text}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Total Value Row */}
              {showTotalValue && (
                <tr className="bg-lavender-mist/10 border-t-2 border-deep-navy/15">
                  <th
                    scope="row"
                    className="py-4 px-6 font-ui font-semibold text-deep-navy/75 text-left"
                  >
                    Tổng giá trị thực tế
                  </th>
                  {pkgs.map((pkg) => (
                    <td key={pkg.id} className="py-4 px-6 text-center">
                      <span className="line-through font-ui font-medium text-deep-navy/60 text-sm">
                        {formatVnd(pkg.totalValue)}
                      </span>
                    </td>
                  ))}
                </tr>
              )}

              {/* Selling Price Row */}
              <tr className="bg-lavender-mist/20 font-bold">
                <th
                  scope="row"
                  className="py-5 px-6 font-ui text-base text-deep-navy text-left font-bold"
                >
                  Giá gói đồng hành
                </th>
                {pkgs.map((pkg) => (
                  <td key={pkg.id} className="py-5 px-6 text-center">
                    <span className="font-ui text-xl font-bold text-deep-navy">
                      {formatVnd(pkg.sellingPrice)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Discount Percent Row */}
              {showDiscountPercent && (
                <tr className="bg-soft-pink/30">
                  <th
                    scope="row"
                    className="py-4 px-6 font-ui font-semibold text-bright-magenta text-left"
                  >
                    Mức ưu đãi
                  </th>
                  {pkgs.map((pkg) => (
                    <td key={pkg.id} className="py-4 px-6 text-center">
                      {pkg.discountPercent != null && pkg.discountPercent > 0 ? (
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-accent-pink text-white shadow-sm">
                          Ưu đãi {pkg.discountPercent}%
                        </span>
                      ) : (
                        <span className="text-deep-navy/40 text-xs">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Vertical Cards on <= 768px (Không bảng tràn ngang) */}
        <div className="block md:hidden space-y-6">
          {pkgs.map((pkg, pkgIndex) => (
            <div
              key={pkg.id}
              className="rounded-card border border-deep-navy/15 bg-white p-6 shadow-soft flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex items-baseline justify-between border-b border-deep-navy/10 pb-4">
                <h3 className="font-display text-3xl uppercase tracking-tight text-deep-navy">
                  {pkg.name}
                </h3>
                {showDiscountPercent && pkg.discountPercent != null && pkg.discountPercent > 0 && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-accent-pink text-white">
                    Ưu đãi {pkg.discountPercent}%
                  </span>
                )}
              </div>

              {/* Components List */}
              <div className="space-y-3 font-ui text-sm">
                {rows.map((row, rIdx) => {
                  const cell = row.cells[pkgIndex]
                  if (!cell.has) {
                    return (
                      <div
                        key={rIdx}
                        className="flex items-center justify-between text-deep-navy/40 line-through"
                      >
                        <span>{row.label}</span>
                        <span className="text-xs font-semibold no-underline">Không</span>
                      </div>
                    )
                  }
                  return (
                    <div key={rIdx} className="flex items-center justify-between text-deep-navy">
                      <span className="font-medium">{row.label}</span>
                      <span className="font-bold text-accent-pink">{cell.text}</span>
                    </div>
                  )
                })}
              </div>

              {/* Price section */}
              <div className="border-t border-deep-navy/10 pt-4 flex items-baseline justify-between">
                <div>
                  {showTotalValue && (
                    <div className="text-xs line-through text-deep-navy/60 font-ui mb-0.5">
                      Trị giá {formatVnd(pkg.totalValue)}
                    </div>
                  )}
                  <div className="font-ui text-xl font-bold text-deep-navy">
                    {formatVnd(pkg.sellingPrice)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Optional note and payment policy link */}
        {(Boolean(note?.trim()) || showPaymentPolicyLink) && (
          <div className="mt-8 sm:mt-10 rounded-card border border-deep-navy/10 bg-warm-ivory/60 p-4 sm:p-5 text-center text-sm font-ui text-deep-navy/80 space-y-2 shadow-xs">
            {note?.trim() && <p className="whitespace-pre-line leading-relaxed">{note.trim()}</p>}
            {showPaymentPolicyLink && (
              <div>
                <Link
                  href="/gia-thanh-toan"
                  className="inline-flex items-center gap-1 font-semibold text-bright-magenta hover:text-accent-pink hover:underline transition-colors"
                >
                  {vi.builder.packageComparison?.paymentPolicyLabel ||
                    'Xem Chính sách giá & thanh toán'}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
