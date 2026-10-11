import type { Product } from '@/payload-types'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'

export interface EffectivePrice {
  price: number | null
  salePrice: number | null
}

export type ProductPricingInput = Partial<Pick<Product, 'price' | 'salePrice' | 'saleEndsAt'>>

export type ProductCtaKind =
  'external' | 'internal' | 'notify' | 'trial' | 'buy' | 'free' | 'consult'

export interface ProductCta {
  kind: ProductCtaKind
  label: string
  href: string
  external?: boolean
  event?: string
}

export type ProductCtaInput = {
  slug: string
  saleStatus: Product['saleStatus']
  type?: Product['type'] | null
  trialDays?: number | null
  externalUrl?: string | null
  externalLabel?: string | null
  ctaLabel?: string | null
}

export const GROWTH_MIRROR_PATH = '/coaching/growth-mirror'
export const BOOKING_PATH = '/dat-phien-trai-nghiem'

export function getBookingPath(productId?: string | number | null): string {
  if (!productId) return BOOKING_PATH
  return `${BOOKING_PATH}?san-pham=${encodeURIComponent(String(productId))}`
}

export interface PublicProductCoverImage {
  url?: string | null
  alt?: string | null
}

export interface PublicProductComponent {
  label?: string | null
  quantity?: number | null
  unitValue?: number | null
}

export interface PublicProduct {
  id: number | string
  name: string
  slug: string
  web?: Product['web'] | null
  type?: Product['type'] | null
  journeyStep?: Product['journeyStep'] | null
  shortDescription?: string | null
  includes?: readonly (string | { text?: string | null })[] | null
  price: number | null
  salePrice: number | null
  saleEndsAt?: string | null
  saleStatus: Product['saleStatus']
  trialDays?: number | null
  externalUrl?: string | null
  externalLabel?: string | null
  ctaLabel?: string | null
  components?: readonly PublicProductComponent[] | null
  coverImage?: PublicProductCoverImage | null
}

/**
 * Hàm thuần (pure function) chuyển đổi tài liệu Product (từ Payload Local API hoặc REST API)
 * thành PublicProduct DTO chứa ĐÚNG các trường công khai cần hiển thị.
 *
 * Triệt tiêu hoàn toàn rò rỉ dữ liệu bảo mật (Anti-data-leak):
 * - Tuyệt đối KHÔNG chứa trường `files` (tài liệu/ebook trả phí chỉ mở khi có entitlement).
 * - Tuyệt đối KHÔNG chứa `description`, `faq`, `relatedProducts`, trường hệ thống (`createdAt`, `updatedAt`, `_status`).
 * - Chuẩn hóa `coverImage` chỉ còn `{ url, alt }`.
 * - Chuẩn hóa `components` chỉ còn `{ label, quantity, unitValue }`.
 */
export function toPublicProduct(doc: unknown): PublicProduct {
  if (!doc || typeof doc !== 'object') {
    throw new Error('toPublicProduct: doc must be an object')
  }

  const p = doc as Record<string, unknown>

  const id = (p.id as string | number) ?? ''
  const name = typeof p.name === 'string' ? p.name : ''
  const slug = typeof p.slug === 'string' ? p.slug : ''
  const web = (p.web as 'site' | 'habit' | 'eq') ?? null
  const type = (p.type as Product['type']) ?? null
  const journeyStep = (p.journeyStep as PublicProduct['journeyStep']) ?? null
  const shortDescription = typeof p.shortDescription === 'string' ? p.shortDescription : null
  const price = typeof p.price === 'number' ? p.price : null
  const salePrice = typeof p.salePrice === 'number' ? p.salePrice : null
  const saleEndsAt = typeof p.saleEndsAt === 'string' ? p.saleEndsAt : null
  const saleStatus = (p.saleStatus as Product['saleStatus']) || 'on_sale'
  const trialDays = typeof p.trialDays === 'number' ? p.trialDays : null
  const externalUrl = typeof p.externalUrl === 'string' ? p.externalUrl : null
  const externalLabel = typeof p.externalLabel === 'string' ? p.externalLabel : null
  const ctaLabel = typeof p.ctaLabel === 'string' ? p.ctaLabel : null

  let includes: readonly (string | { text?: string | null })[] | null = null
  if (Array.isArray(p.includes)) {
    includes = p.includes.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        return { text: typeof item.text === 'string' ? item.text : null }
      }
      return { text: null }
    })
  }

  let components: readonly PublicProductComponent[] | null = null
  if (Array.isArray(p.components)) {
    components = p.components.map((c) => ({
      label: typeof c?.label === 'string' ? c.label : null,
      quantity: typeof c?.quantity === 'number' ? c.quantity : null,
      unitValue: typeof c?.unitValue === 'number' ? c.unitValue : null,
    }))
  }

  let coverImage: PublicProductCoverImage | null = null
  if (p.coverImage && typeof p.coverImage === 'object') {
    const img = p.coverImage as Record<string, unknown>
    coverImage = {
      url: typeof img.url === 'string' ? img.url : null,
      alt: typeof img.alt === 'string' ? img.alt : name || null,
    }
  }

  return {
    id,
    name,
    slug,
    web,
    type,
    journeyStep,
    shortDescription,
    includes,
    price,
    salePrice,
    saleEndsAt,
    saleStatus,
    trialDays,
    externalUrl,
    externalLabel,
    ctaLabel,
    components,
    coverImage,
  }
}

/**
 * Tính giá hiển thị hiệu lực theo thời điểm hiện tại (`now`).
 *
 * Hàm thuần (pure function):
 * - Không import Payload runtime.
 * - Không tự ý gọi `new Date()` bên trong mà nhận `now: Date` làm tham số.
 * - `salePrice` chỉ còn hiệu lực khi có giá trị VÀ (`saleEndsAt` trống HOẶC `now < saleEndsAt`).
 * - Ranh giới `now >= saleEndsAt` coi như đã hết hạn khuyến mãi (chỉ còn giá gốc).
 */
export function getEffectivePrice(product: ProductPricingInput, now: Date): EffectivePrice {
  const price = typeof product.price === 'number' ? product.price : null
  const rawSalePrice = typeof product.salePrice === 'number' ? product.salePrice : null

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
 * Xác định cấu hình nút kêu gọi hành động (CTA) cho sản phẩm theo thứ tự ưu tiên (bảng AGENTS.md 8.1 & T1-18):
 *
 * 1. `saleStatus === 'hidden'` -> null (không hiển thị).
 * 2. Có `externalUrl` (và không hidden):
 *    - Bắt đầu bằng `/` -> loại `internal`, mở cùng tab, không ghi `external_clicked`, không gắn UTM.
 *      Nhãn: `ctaLabel` -> `externalLabel` -> nhãn mặc định theo `saleStatus`.
 *    - Bắt đầu bằng link ngoài (`https://`, `http://`...) -> loại `external`, mở tab mới an toàn (`safeHref`), ghi sự kiện `external_clicked`.
 * 3. `saleStatus === 'coming_soon'` -> loại `notify`, dẫn tới `/sap-ra-mat?san-pham=<slug>`.
 * 4. `saleStatus === 'on_sale'` + `trialDays > 0` -> loại `trial`, dẫn tới `/sap-ra-mat?san-pham=<slug>&loai=dung-thu`.
 * 5. `saleStatus === 'on_sale'` (trialDays <= 0 hoặc không có) -> loại `buy`, dẫn tới `/thanh-toan?san-pham=<slug>`.
 * 6. `saleStatus === 'free'`:
 *    - Nếu `type === 'ebook'` hoặc `type === 'toolkit'` -> loại `free`, dẫn tới `/tai-nguyen/<slug>`.
 *    - Các loại khác (công cụ số `digital_tool`...) không có `externalUrl` -> null (ẩn nút, tránh link 404 chết).
 * 7. `saleStatus === 'consult'` -> loại `consult`, dẫn tới `/coaching/<slug>` nếu là coaching/package, ngược lại `/doanh-nghiep`.
 *
 * Nhãn nút:
 * - `ctaLabel` của sản phẩm (nếu có) luôn ghi đè nhãn mặc định.
 * - Mọi nhãn mặc định lấy từ từ điển `vi.product.cta` (`src/lib/i18n/vi.ts`).
 */
export function resolveProductCta(product: ProductCtaInput, _now?: Date): ProductCta | null {
  const { saleStatus, slug, type, trialDays, externalUrl, externalLabel, ctaLabel } = product

  // 1. saleStatus = hidden -> không hiển thị nút
  if (saleStatus === 'hidden') {
    return null
  }

  const customLabel = ctaLabel?.trim() || null

  // 2. Có externalUrl (và không hidden)
  if (externalUrl && typeof externalUrl === 'string' && externalUrl.trim().length > 0) {
    const safeExternalHref = safeHref(externalUrl)
    // externalUrl không hợp lệ hoặc chứa mã độc (javascript:, //, /\) sẽ bị chặn an toàn
    if (!safeExternalHref) {
      return null
    }

    // Nếu bắt đầu bằng '/' -> đường dẫn nội bộ trong web (internal)
    if (safeExternalHref.startsWith('/')) {
      const defaultInternalLabel = (() => {
        if (saleStatus === 'free') return vi.product.cta.free
        if (saleStatus === 'coming_soon') return vi.product.cta.notify
        if (saleStatus === 'on_sale') {
          return typeof trialDays === 'number' && trialDays > 0
            ? vi.product.cta.trial(trialDays)
            : vi.product.cta.buy
        }
        if (saleStatus === 'consult') return vi.product.cta.consult
        return vi.product.cta.free
      })()

      const label = customLabel || externalLabel?.trim() || defaultInternalLabel

      return {
        kind: 'internal',
        label,
        href: safeExternalHref,
        external: false,
      }
    }

    const label = customLabel || externalLabel?.trim() || vi.product.cta.external

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
    // Chỉ các loại sản phẩm tài nguyên 'ebook' hoặc 'toolkit' mới có trang tải tài nguyên công khai /tai-nguyen/[slug]
    // Các công cụ số (digital_tool) hoặc loại khác chưa có link/externalUrl -> ẩn nút (tránh link 404 chết)
    if (type !== 'ebook' && type !== 'toolkit') {
      return null
    }

    return {
      kind: 'free',
      label: customLabel || vi.product.cta.free,
      href: `/tai-nguyen/${encodedSlug}`,
    }
  }

  // 7. consult
  if (saleStatus === 'consult') {
    if (type === 'package') {
      return {
        kind: 'consult',
        label: customLabel || vi.product.cta.consult,
        href: GROWTH_MIRROR_PATH,
      }
    }

    if (type === 'coaching_trial') {
      return {
        kind: 'consult',
        label: customLabel || vi.product.cta.consult,
        href: `/coaching/${encodedSlug}`,
      }
    }

    return {
      kind: 'consult',
      label: customLabel || vi.product.cta.consult,
      href: '/doanh-nghiep',
    }
  }

  return null
}

export interface PackageComparisonItem {
  id: number | string
  name: string
  slug: string
  price: number | null
  salePrice: number | null
  effectivePrice: EffectivePrice
  totalValue: number
  sellingPrice: number | null
  discountPercent: number | null
}

export interface PackageComparisonCell {
  has: boolean
  quantity: number | null
  text: string
}

export interface PackageComparisonRow {
  label: string
  cells: PackageComparisonCell[]
}

export interface PackageComparisonResult {
  packages: PackageComparisonItem[]
  rows: PackageComparisonRow[]
}

export type ProductPackageInput = {
  id: number | string
  name: string
  slug?: string | null
  price?: number | null
  salePrice?: number | null
  saleEndsAt?: string | null
  components?:
    | readonly {
        label?: string | null
        quantity?: number | null
        unitValue?: number | null
        retailPrice?: number | null
      }[]
    | null
}

/**
 * Hàm thuần (pure function) dựng cấu trúc so sánh các gói Growth Mirror.
 * - Nhận `now: Date` làm tham số để tính giá hiệu lực không phụ thuộc hệ thống.
 * - Gộp cấu phần theo label xuất hiện lần đầu.
 * - Tính tổng giá trị và % ưu đãi từ giá đã qua getEffectivePrice.
 * - Ô không có cấu phần ghi 'Không'.
 * - Ô có cấu phần: ghi số lượng nếu có gói có số lượng > 1, ghi 'Có' nếu mọi gói đều có số lượng <= 1.
 */
export function buildPackageComparison(
  packages: readonly ProductPackageInput[] | null | undefined,
  now: Date,
): PackageComparisonResult {
  if (!packages || !Array.isArray(packages) || packages.length === 0) {
    return { packages: [], rows: [] }
  }

  // Import computePackageValue dynamically or at top level if needed
  type CompType = {
    label?: string | null
    quantity?: number | null
    unitValue?: number | null
    retailPrice?: number | null
  }

  // Process each package
  const processedPackages: PackageComparisonItem[] = packages.map((pkg) => {
    const effectivePrice = getEffectivePrice(pkg, now)
    const sellingPrice = effectivePrice.salePrice ?? effectivePrice.price
    const comps = (pkg.components || []) as readonly CompType[]
    const totalValue = comps.reduce(
      (sum: number, comp: CompType) => sum + (comp.quantity ?? 0) * (comp.unitValue ?? 0),
      0,
    )
    const discountPercent =
      totalValue === 0 || sellingPrice == null
        ? null
        : Math.max(0, Math.round(((totalValue - sellingPrice) / totalValue) * 100))

    return {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug || '',
      price: typeof pkg.price === 'number' ? pkg.price : null,
      salePrice: typeof pkg.salePrice === 'number' ? pkg.salePrice : null,
      effectivePrice,
      totalValue,
      sellingPrice,
      discountPercent,
    }
  })

  // Collect unique component labels preserving order
  const labelOrder: string[] = []
  const labelSet = new Set<string>()

  for (const pkg of packages) {
    const comps = (pkg.components || []) as readonly CompType[]
    for (const comp of comps) {
      const label = comp.label?.trim()
      if (label && !labelSet.has(label)) {
        labelSet.add(label)
        labelOrder.push(label)
      }
    }
  }

  // Find max quantity for each label
  const labelMaxQuantity = new Map<string, number>()
  for (const label of labelOrder) {
    let max = 0
    for (const pkg of packages) {
      const comps = (pkg.components || []) as readonly CompType[]
      const comp = comps.find((c: CompType) => c.label?.trim() === label)
      if (comp && typeof comp.quantity === 'number' && comp.quantity > max) {
        max = comp.quantity
      }
    }
    labelMaxQuantity.set(label, max)
  }

  // Build rows
  const rows: PackageComparisonRow[] = labelOrder.map((label) => {
    const maxQty = labelMaxQuantity.get(label) ?? 0

    const cells: PackageComparisonCell[] = packages.map((pkg) => {
      const comps = (pkg.components || []) as readonly CompType[]
      const comp = comps.find((c: CompType) => c.label?.trim() === label)
      if (!comp || comp.quantity == null || comp.quantity <= 0) {
        return {
          has: false,
          quantity: null,
          text: 'Không',
        }
      }

      const qty = comp.quantity
      const text = maxQty > 1 ? String(qty) : 'Có'

      return {
        has: true,
        quantity: qty,
        text,
      }
    })

    return { label, cells }
  })

  return {
    packages: processedPackages,
    rows,
  }
}
