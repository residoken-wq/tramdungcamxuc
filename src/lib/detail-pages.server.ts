import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { resolveServerData } from '@/puck/resolve.server'
import {
  SERVICE_PUBLIC_SELECT,
  PROGRAM_PUBLIC_SELECT,
  POST_PUBLIC_SELECT,
  TESTIMONIAL_PUBLIC_SELECT,
  buildServiceWhere,
  buildProgramWhere,
  buildPostWhere,
  buildPublishedPuckPageWhere,
  toPublicService,
  toPublicProgram,
  toPublicPost,
  type PublicService,
  type PublicProgram,
  type PublicPost,
} from '@/lib/detail-pages'
import { toPublicProduct, type PublicProduct } from '@/lib/products'
import type { Service, Program, Post, Product } from '@/payload-types'

const SAFE_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  web: true,
  type: true,
  journeyStep: true,
  shortDescription: true,
  includes: true,
  price: true,
  salePrice: true,
  saleEndsAt: true,
  saleStatus: true,
  trialDays: true,
  externalUrl: true,
  externalLabel: true,
  ctaLabel: true,
  components: true,
  coverImage: true,
} as const

export interface PuckPageData {
  title: string
  seo?: {
    title?: string | null
    description?: string | null
    ogImage?: unknown | null
  } | null
  puckData: Data
}

/**
 * Kiểm tra và lấy dữ liệu trang Puck đã xuất bản theo đường dẫn đầy đủ (ví dụ: 'coaching/thinking-mirror').
 * Bọc cache() của React để chia sẻ một truy vấn giữa generateMetadata và Page component.
 */
export const getPuckPageBySlug = cache(
  async (
    pageSlug: string,
    options?: { draft?: boolean; previewId?: string | number; user?: unknown },
  ): Promise<PuckPageData | null> => {
    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const result = await payload.find({
        collection: 'pages',
        where: buildPublishedPuckPageWhere(pageSlug) as never,
        limit: 1,
        draft: false,
      })

      const doc = result.docs[0]
      if (!doc || !doc.puckData) {
        return null
      }

      const initialData: Data = (doc.puckData as Data) || {
        content: [],
        root: { props: { title: doc.title || '' } },
      }

      const resolvedData = await resolveServerData(initialData, {
        pageSlug,
        draft: options?.draft,
        previewId: options?.previewId,
        user: options?.user,
      })

      return {
        title: doc.title || '',
        seo: doc.seo || null,
        puckData: resolvedData,
      }
    } catch {
      return null
    }
  },
)

/**
 * Lấy chi tiết dịch vụ Coaching từ collection `services`:
 * - Chỉ đọc bản ghi `_status = 'published'` và `saleStatus != 'hidden'`
 * - Chỉ `select` các trường công khai cần hiển thị (bảo mật dữ liệu)
 * - Lọc lời chia sẻ (testimonials) chỉ lấy bản có `consent = true` và `_status = 'published'`
 */
export const getServiceDetail = cache(async (slug: string): Promise<PublicService | null> => {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.find({
      collection: 'services',
      where: buildServiceWhere(slug) as never,
      select: SERVICE_PUBLIC_SELECT as never,
      limit: 1,
      draft: false,
    })

    const doc = result.docs[0] as unknown as Service | undefined
    if (!doc) return null

    if (doc.saleStatus === 'hidden') return null

    // Lấy ID của các lời chia sẻ liên quan
    const rawTestimonials = Array.isArray(doc.testimonials) ? doc.testimonials : []
    const testimonialIds = rawTestimonials
      .map((t: unknown) =>
        typeof t === 'object' && t !== null && 'id' in t ? (t as { id: string | number }).id : t,
      )
      .filter(
        (id: unknown): id is string | number => typeof id === 'number' || typeof id === 'string',
      )

    let verifiedTestimonials: unknown[] = []
    if (testimonialIds.length > 0) {
      try {
        const testRes = await payload.find({
          collection: 'testimonials',
          where: {
            and: [
              { id: { in: testimonialIds } },
              { consent: { equals: true } },
              { _status: { equals: 'published' } },
            ],
          } as never,
          select: TESTIMONIAL_PUBLIC_SELECT as never,
          limit: testimonialIds.length,
          draft: false,
        })
        verifiedTestimonials = testRes.docs
      } catch {
        verifiedTestimonials = []
      }
    }

    return toPublicService(doc, verifiedTestimonials)
  } catch {
    return null
  }
})

/**
 * Lấy chi tiết chương trình doanh nghiệp từ collection `programs`:
 * - Chỉ đọc bản ghi `_status = 'published'` và `saleStatus != 'hidden'`
 * - Chỉ `select` các trường công khai cần hiển thị
 */
export const getProgramDetail = cache(async (slug: string): Promise<PublicProgram | null> => {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.find({
      collection: 'programs',
      where: buildProgramWhere(slug) as never,
      select: PROGRAM_PUBLIC_SELECT as never,
      limit: 1,
      draft: false,
    })

    const doc = result.docs[0] as unknown as Program | undefined
    if (!doc) return null

    if (doc.saleStatus === 'hidden') return null

    return toPublicProgram(doc)
  } catch {
    return null
  }
})

/**
 * Lấy chi tiết bài viết hoặc video từ collection `posts`:
 * - Chỉ đọc bản ghi `_status = 'published'`
 * - `select` các trường cần hiển thị
 * - Nếu có `ctaProduct`, nạp sản phẩm an toàn (không rò rỉ file trả phí)
 */
export const getPostDetail = cache(async (slug: string): Promise<PublicPost | null> => {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.find({
      collection: 'posts',
      where: buildPostWhere(slug) as never,
      select: POST_PUBLIC_SELECT as never,
      limit: 1,
      depth: 1,
      draft: false,
    })

    const doc = result.docs[0] as unknown as Post | undefined
    if (!doc) return null

    let ctaProduct: PublicProduct | null = null
    if (doc.ctaProduct) {
      if (typeof doc.ctaProduct === 'object' && doc.ctaProduct !== null) {
        try {
          const pub = toPublicProduct(doc.ctaProduct)
          if (pub.saleStatus !== 'hidden') {
            ctaProduct = pub
          }
        } catch {
          ctaProduct = null
        }
      } else if (typeof doc.ctaProduct === 'number' || typeof doc.ctaProduct === 'string') {
        try {
          const productRes = await payload.find({
            collection: 'products',
            where: {
              and: [{ id: { equals: doc.ctaProduct } }, { _status: { equals: 'published' } }],
            } as never,
            select: SAFE_PRODUCT_SELECT as never,
            limit: 1,
            draft: false,
          })
          const prodDoc = productRes.docs[0] as unknown as Product | undefined
          if (prodDoc && prodDoc.saleStatus !== 'hidden') {
            ctaProduct = toPublicProduct(prodDoc)
          }
        } catch {
          ctaProduct = null
        }
      }
    }

    return toPublicPost(doc, ctaProduct)
  } catch {
    return null
  }
})
