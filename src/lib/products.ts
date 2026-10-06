import type { Product } from '@/payload-types'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'

export interface EffectivePrice {
  price: number | null
  salePrice: number | null
}

export type ProductPricingInput = Partial<
  Pick<Product, 'price' | 'salePrice' | 'saleEndsAt'>
>

export type ProductCtaKind =
  | 'external'
  | 'notify'
  | 'trial'
  | 'buy'
  | 'free'
  | 'consult'

export interface ProductCta {
  kind: ProductCtaKind
  label: string
  href: string
  external?: boolean
  event?: string
}

export type ProductCtaInput = Pick<Product, 'slug' | 'saleStatus'> &
  Partial<
    Pick<
      Product,
      | 'type'
      | 'trialDays'
      | 'externalUrl'
      | 'externalLabel'
      | 'ctaLabel'
    >
  >

/**
 * Tính giá hiển thị hiệu lực theo thời điểm hiện tại (`now`).
 *
 * Hàm thuần (pure function):
 * - Không import Payload runtime.
 * - Không tự ý gọi `new Date()` bên trong mà nhận `now: Date` làm tham số.
 * - `salePrice` chỉ còn hiệu lực khi có giá trị VÀ (`saleEndsAt` trống HOẶC `now < saleEndsAt`).
 * - Ranh giới `now >= saleEndsAt` coi như đã hết hạn khuyến mãi (chỉ còn giá gốc).
 */
export function getEffectivePrice(
  product: ProductPricingInput,
  now: Date,
): EffectivePrice {
  const price = typeof product.price === 'number' ? product.price : null
  const rawSalePrice =
    typeof product.salePrice === 'number' ? product.salePrice : null

  if (rawSalePrice == null) {
    return { price, salePrice: null }
  }

  const saleEndsAt = product.saleEndsAt?.trim()
  if (!saleEndsAt) {
    return { price, salePrice: rawSalePrice }
  }

  const endsAtMs = Date.parse(saleEndsAt)
  if (Number.isNaN(endsAtMs)) {
    return { price, salePrice: null }
  }

  if (now.getTime() < endsAtMs) {
    return { price, salePrice: rawSalePrice }
  }

  return { price, salePrice: null }
}

/**
 * Xác định cấu hình nút kêu gọi hành động (CTA) cho sản phẩm theo thứ tự ưu tiên (bảng AGENTS.md 8.1):
 *
 * 1. `saleStatus === 'hidden'` -> null (không hiển thị).
 * 2. Có `externalUrl` (và không hidden) -> loại `external`, mở link ngoài an toàn (`safeHref`), ghi sự kiện `external_clicked`.
 * 3. `saleStatus === 'coming_soon'` -> loại `notify`, dẫn tới `/sap-ra-mat?san-pham=<slug>`.
 * 4. `saleStatus === 'on_sale'` + `trialDays > 0` -> loại `trial`, dẫn tới `/sap-ra-mat?san-pham=<slug>&loai=dung-thu`.
 * 5. `saleStatus === 'on_sale'` (trialDays <= 0 hoặc không có) -> loại `buy`, dẫn tới `/thanh-toan?san-pham=<slug>`.
 * 6. `saleStatus === 'free'` -> loại `free`, dẫn tới `/tai-nguyen/<slug>`.
 * 7. `saleStatus === 'consult'` -> loại `consult`, dẫn tới `/coaching/<slug>` nếu là coaching/package, ngược lại `/doanh-nghiep`.
 *
 * Nhãn nút:
 * - `ctaLabel` của sản phẩm (nếu có) luôn ghi đè nhãn mặc định.
 * - Mọi nhãn mặc định lấy từ từ điển `vi.product.cta` (`src/lib/i18n/vi.ts`).
 */
export function resolveProductCta(
  product: ProductCtaInput,
  _now?: Date,
): ProductCta | null {
  const {
    saleStatus,
    slug,
    type,
    trialDays,
    externalUrl,
    externalLabel,
    ctaLabel,
  } = product

  // 1. saleStatus = hidden -> không hiển thị nút
  if (saleStatus === 'hidden') {
    return null
  }

  const customLabel = ctaLabel?.trim() || null

  // 2. Có externalUrl (và không hidden)
  if (
    externalUrl &&
    typeof externalUrl === 'string' &&
    externalUrl.trim().length > 0
  ) {
    const safeExternalHref = safeHref(externalUrl)
    // externalUrl không hợp lệ hoặc chứa mã độc (javascript:) sẽ bị chặn an toàn
    if (!safeExternalHref) {
      return null
    }

    const label =
      customLabel ||
      externalLabel?.trim() ||
      vi.product.cta.external

    return {
      kind: 'external',
      label,
      href: safeExternalHref,
      external: true,
      event: 'external_clicked',
    }
  }

  const encodedSlug = encodeURIComponent(slug?.trim() || '')

  // 3. coming_soon
  if (saleStatus === 'coming_soon') {
    return {
      kind: 'notify',
      label: customLabel || vi.product.cta.notify,
      href: `/sap-ra-mat?san-pham=${encodedSlug}`,
    }
  }

  // 4 & 5. on_sale
  if (saleStatus === 'on_sale') {
    if (typeof trialDays === 'number' && trialDays > 0) {
      return {
        kind: 'trial',
        label: customLabel || vi.product.cta.trial(trialDays),
        href: `/sap-ra-mat?san-pham=${encodedSlug}&loai=dung-thu`,
      }
    }

    return {
      kind: 'buy',
      label: customLabel || vi.product.cta.buy,
      href: `/thanh-toan?san-pham=${encodedSlug}`,
    }
  }

  // 6. free
  if (saleStatus === 'free') {
    return {
      kind: 'free',
      label: customLabel || vi.product.cta.free,
      href: `/tai-nguyen/${encodedSlug}`,
    }
  }

  // 7. consult
  if (saleStatus === 'consult') {
    const isCoachingOrPackage =
      type === 'coaching_trial' || type === 'package'

    return {
      kind: 'consult',
      label: customLabel || vi.product.cta.consult,
      href: isCoachingOrPackage
        ? `/coaching/${encodedSlug}`
        : '/doanh-nghiep',
    }
  }

  return null
}
