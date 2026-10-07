import { vi } from '@/lib/i18n/vi'
import { formatVnd } from '@/lib/format'
import { safeHref } from '@/lib/safe-href'
import { toPublicProduct, type PublicProduct } from '@/lib/products'
import { parseVideoUrl, type ParsedVideo } from '@/components/site/VideoEmbed'

export interface PublicTestimonialPhoto {
  src: string
  alt: string
}

export interface PublicTestimonial {
  id: number | string
  name: string
  role: string | null
  quote: string
  photo: PublicTestimonialPhoto | null
  consent: true
}

export interface PublicService {
  id: number | string
  name: string
  slug: string
  audience: string | null
  situations: string[]
  outcomes: string[]
  process: string[]
  duration: string | null
  format: string | null
  priceMode: 'fixed' | 'quote' | null
  price: number | null
  displayPrice: string | null
  bookingUrl: string | null
  ctaLabel: string | null
  saleStatus: 'coming_soon' | 'on_sale' | 'free' | 'consult' | 'hidden'
  testimonials: PublicTestimonial[]
}

export interface PublicProgram {
  id: number | string
  name: string
  slug: string
  targetBehaviors: string[]
  learnerGroup: string | null
  format: string | null
  duration: string | null
  deliverables: string[]
  followUp: string | null
  measurement: string | null
  caseStudies: string[]
  ctaLabel: string | null
  saleStatus: 'coming_soon' | 'on_sale' | 'free' | 'consult' | 'hidden'
}

export interface PublicPost {
  id: number | string
  title: string
  slug: string
  series: string | null
  topic: 'eq' | 'habit' | 'career' | null
  format: 'article' | 'video' | null
  thumbnail: { src: string; alt: string } | null
  videoUrl: string | null
  parsedVideo: ParsedVideo
  content: unknown | null
  ctaProduct: PublicProduct | null
}

export const SERVICE_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  audience: true,
  situations: true,
  outcomes: true,
  process: true,
  duration: true,
  format: true,
  priceMode: true,
  price: true,
  bookingUrl: true,
  testimonials: true,
  ctaLabel: true,
  saleStatus: true,
  _status: true,
} as const

export const PROGRAM_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  targetBehaviors: true,
  learnerGroup: true,
  format: true,
  duration: true,
  deliverables: true,
  followUp: true,
  measurement: true,
  caseStudies: true,
  ctaLabel: true,
  saleStatus: true,
  _status: true,
} as const

export const POST_PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  series: true,
  topic: true,
  format: true,
  thumbnail: true,
  videoUrl: true,
  content: true,
  ctaProduct: true,
  _status: true,
} as const

export const TESTIMONIAL_PUBLIC_SELECT = {
  id: true,
  name: true,
  role: true,
  quote: true,
  consent: true,
  photo: true,
  _status: true,
} as const

export function buildServiceWhere(slug: string) {
  return {
    and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
  }
}

export function buildProgramWhere(slug: string) {
  return {
    and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
  }
}

export function buildPostWhere(slug: string) {
  return {
    and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
  }
}

export function buildPublishedPuckPageWhere(pageSlug: string) {
  return {
    and: [{ slug: { equals: pageSlug } }, { _status: { equals: 'published' } }],
  }
}

/**
 * Lọc mảng các mục text hoặc { text: string } từ Payload array field.
 * Bỏ qua phần tử rỗng hoặc chỉ có khoảng trắng.
 */
export function cleanStringList(items: unknown): string[] {
  if (!Array.isArray(items)) return []

  const results: string[] = []
  for (const item of items) {
    if (typeof item === 'string') {
      const trimmed = item.trim()
      if (trimmed.length > 0) results.push(trimmed)
    } else if (item && typeof item === 'object') {
      const textVal = (item as { text?: unknown }).text
      if (typeof textVal === 'string') {
        const trimmed = textVal.trim()
        if (trimmed.length > 0) results.push(trimmed)
      }
    }
  }
  return results
}

/**
 * Định dạng giá cho dịch vụ Coaching theo nguyên tắc spec:
 * - Khi priceMode === 'quote' -> "Liên hệ báo giá" (tuyệt đối KHÔNG hiện số, kể cả khi có trường price).
 * - Khi priceMode === 'fixed' -> Hiển thị formatVnd(price) nếu có số hợp lệ.
 * - Trường hợp khác -> null hoặc chuỗi format nếu có giá.
 */
export function formatServicePrice(
  priceMode?: string | null,
  price?: number | null,
): string | null {
  if (priceMode === 'quote') {
    return vi.detail.service.quotePrice
  }

  if (typeof price === 'number' && !Number.isNaN(price) && price >= 0) {
    return formatVnd(price)
  }

  return null
}

/**
 * Quyết định nguồn render cho route động:
 * - Ưu tiên 1: Trang Puck nếu có bản published với slug tương ứng (VD: coaching/growth-mirror).
 * - Ưu tiên 2: Collection tương ứng nếu tìm thấy bản ghi published.
 * - Không có cả hai: not_found.
 */
export function decideDetailSource(
  hasPuckPage: boolean,
  hasCollectionDoc: boolean,
): 'puck' | 'collection' | 'not_found' {
  if (hasPuckPage) {
    return 'puck'
  }
  if (hasCollectionDoc) {
    return 'collection'
  }
  return 'not_found'
}

/**
 * Chuyển đổi và kiểm tra lời chia sẻ (Testimonial DTO):
 * - BẮT BUỘC consent === true. Nếu false/null -> loại bỏ.
 * - Chỉ chấp nhận bản ghi đã xuất bản (nếu có trường _status thì phải là published).
 * - role chỉ hiển thị khi consent === true và chuỗi không rỗng.
 */
export function toPublicTestimonial(doc: unknown): PublicTestimonial | null {
  if (!doc || typeof doc !== 'object') return null
  const t = doc as Record<string, unknown>

  // AGENTS.md §7: Testimonials phải có consent = true
  if (t.consent !== true) return null

  // Nếu có _status thì phải là published
  if (t._status && t._status !== 'published') return null

  const name = typeof t.name === 'string' ? t.name.trim() : ''
  const quote = typeof t.quote === 'string' ? t.quote.trim() : ''
  if (!name || !quote) return null

  const id = (t.id as string | number) ?? ''
  const role = typeof t.role === 'string' && t.role.trim().length > 0 ? t.role.trim() : null

  let photo: PublicTestimonialPhoto | null = null
  if (t.photo && typeof t.photo === 'object') {
    const p = t.photo as Record<string, unknown>
    if (typeof p.url === 'string' && p.url.trim().length > 0) {
      photo = {
        src: p.url.trim(),
        alt: typeof p.alt === 'string' && p.alt.trim().length > 0 ? p.alt.trim() : name,
      }
    }
  }

  return {
    id,
    name,
    role,
    quote,
    photo,
    consent: true,
  }
}

/**
 * Chuyển đổi dữ liệu Service thành PublicService DTO sạch sẽ.
 */
export function toPublicService(doc: unknown, testimonialsList?: unknown[]): PublicService {
  if (!doc || typeof doc !== 'object') {
    throw new Error('toPublicService: doc must be an object')
  }
  const s = doc as Record<string, unknown>

  const id = (s.id as string | number) ?? ''
  const name = typeof s.name === 'string' ? s.name.trim() : ''
  const slug = typeof s.slug === 'string' ? s.slug.trim() : ''
  const audience =
    typeof s.audience === 'string' && s.audience.trim().length > 0 ? s.audience.trim() : null
  const duration =
    typeof s.duration === 'string' && s.duration.trim().length > 0 ? s.duration.trim() : null
  const format = typeof s.format === 'string' && s.format.trim().length > 0 ? s.format.trim() : null
  const priceMode = (s.priceMode as 'fixed' | 'quote') || null
  const price = typeof s.price === 'number' ? s.price : null
  const ctaLabel =
    typeof s.ctaLabel === 'string' && s.ctaLabel.trim().length > 0 ? s.ctaLabel.trim() : null
  const saleStatus = (s.saleStatus as PublicService['saleStatus']) || 'consult'

  const rawBookingUrl = typeof s.bookingUrl === 'string' ? s.bookingUrl.trim() : ''
  const bookingUrl = rawBookingUrl ? safeHref(rawBookingUrl) : null

  const situations = cleanStringList(s.situations)
  const outcomes = cleanStringList(s.outcomes)
  const process = cleanStringList(s.process)
  const displayPrice = formatServicePrice(priceMode, price)

  // Danh sách testimonials: ưu tiên danh sách được truyền vào (nếu fetch riêng), hoặc từ relationship
  const rawTestimonials = Array.isArray(testimonialsList)
    ? testimonialsList
    : Array.isArray(s.testimonials)
      ? s.testimonials
      : []

  const testimonials = rawTestimonials
    .map((t) => toPublicTestimonial(t))
    .filter((t): t is PublicTestimonial => t !== null)

  return {
    id,
    name,
    slug,
    audience,
    situations,
    outcomes,
    process,
    duration,
    format,
    priceMode,
    price,
    displayPrice,
    bookingUrl,
    ctaLabel,
    saleStatus,
    testimonials,
  }
}

/**
 * Chuyển đổi dữ liệu Program thành PublicProgram DTO sạch sẽ.
 */
export function toPublicProgram(doc: unknown): PublicProgram {
  if (!doc || typeof doc !== 'object') {
    throw new Error('toPublicProgram: doc must be an object')
  }
  const p = doc as Record<string, unknown>

  const id = (p.id as string | number) ?? ''
  const name = typeof p.name === 'string' ? p.name.trim() : ''
  const slug = typeof p.slug === 'string' ? p.slug.trim() : ''
  const learnerGroup =
    typeof p.learnerGroup === 'string' && p.learnerGroup.trim().length > 0
      ? p.learnerGroup.trim()
      : null
  const format = typeof p.format === 'string' && p.format.trim().length > 0 ? p.format.trim() : null
  const duration =
    typeof p.duration === 'string' && p.duration.trim().length > 0 ? p.duration.trim() : null
  const followUp =
    typeof p.followUp === 'string' && p.followUp.trim().length > 0 ? p.followUp.trim() : null
  const measurement =
    typeof p.measurement === 'string' && p.measurement.trim().length > 0
      ? p.measurement.trim()
      : null
  const ctaLabel =
    typeof p.ctaLabel === 'string' && p.ctaLabel.trim().length > 0 ? p.ctaLabel.trim() : null
  const saleStatus = (p.saleStatus as PublicProgram['saleStatus']) || 'consult'

  const targetBehaviors = cleanStringList(p.targetBehaviors)
  const deliverables = cleanStringList(p.deliverables)
  const caseStudies = cleanStringList(p.caseStudies)

  return {
    id,
    name,
    slug,
    targetBehaviors,
    learnerGroup,
    format,
    duration,
    deliverables,
    followUp,
    measurement,
    caseStudies,
    ctaLabel,
    saleStatus,
  }
}

/**
 * Chuyển đổi dữ liệu Post thành PublicPost DTO sạch sẽ.
 */
export function toPublicPost(doc: unknown, ctaProductDoc?: unknown): PublicPost {
  if (!doc || typeof doc !== 'object') {
    throw new Error('toPublicPost: doc must be an object')
  }
  const p = doc as Record<string, unknown>

  const id = (p.id as string | number) ?? ''
  const title = typeof p.title === 'string' ? p.title.trim() : ''
  const slug = typeof p.slug === 'string' ? p.slug.trim() : ''
  const series = typeof p.series === 'string' && p.series.trim().length > 0 ? p.series.trim() : null
  const topic = (p.topic as PublicPost['topic']) || null
  const format = (p.format as PublicPost['format']) || 'article'
  const videoUrl =
    typeof p.videoUrl === 'string' && p.videoUrl.trim().length > 0 ? p.videoUrl.trim() : null
  const parsedVideo = parseVideoUrl(videoUrl || undefined)

  let thumbnail: { src: string; alt: string } | null = null
  if (p.thumbnail && typeof p.thumbnail === 'object') {
    const thumb = p.thumbnail as Record<string, unknown>
    if (typeof thumb.url === 'string' && thumb.url.trim().length > 0) {
      thumbnail = {
        src: thumb.url.trim(),
        alt:
          typeof thumb.alt === 'string' && thumb.alt.trim().length > 0 ? thumb.alt.trim() : title,
      }
    }
  }

  let ctaProduct: PublicProduct | null = null
  const rawCtaProduct = ctaProductDoc ?? p.ctaProduct
  if (rawCtaProduct && typeof rawCtaProduct === 'object') {
    try {
      const pub = toPublicProduct(rawCtaProduct)
      if (pub.saleStatus !== 'hidden') {
        ctaProduct = pub
      }
    } catch {
      ctaProduct = null
    }
  }

  return {
    id,
    title,
    slug,
    series,
    topic,
    format,
    thumbnail,
    videoUrl,
    parsedVideo,
    content: p.content ?? null,
    ctaProduct,
  }
}
