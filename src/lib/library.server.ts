import 'server-only'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import type { Product, Post } from '@/payload-types'
import type { Data } from '@puckeditor/core'
import { resolveServerData } from '@/puck/resolve.server'
import { type LibraryQueryParams, estimateReadingMinutes } from '@/lib/library'

export interface LibraryProductItem {
  id: string | number
  name: string
  slug: string
  shortDescription?: string | null
  topic?: string | null
  type: 'ebook' | 'toolkit'
  coverImage?: { url?: string | null; alt?: string | null } | null
  isProduct: true
}

export interface LibraryPostItem extends Post {
  readingMinutes?: number
  isProduct?: false
}

export type LibraryFeedItem = LibraryProductItem | LibraryPostItem

export interface LibraryDataResult {
  featuredPost: LibraryPostItem | null
  items: LibraryFeedItem[]
  totalItems: number
  currentPage: number
  totalPages: number
  introData: Data | null
  hasError: boolean
  products: Product[]
  posts: Post[]
}

/**
 * Đọc dữ liệu thư viện phía máy chủ theo Sitemap v2 (SM-05):
 * - Puck intro từ `pages` slug 'tai-nguyen'
 * - Lọc theo chủ đề: Tất cả / Tài liệu (ebook/toolkit miễn phí) / Thói quen / Cảm xúc / Sự nghiệp
 * - Tìm kiếm theo tiêu đề `?q=`
 * - Tách 1 bài nổi bật `featured = true` mới nhất (không lặp lại trong lưới)
 * - Phân trang 9 bài / trang (`?trang=`)
 * - Thời gian đọc tự tính qua `estimateReadingMinutes` cho bài viết không phải video
 */
export async function getLibraryData(params: LibraryQueryParams): Promise<LibraryDataResult> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // 1. Lấy dữ liệu Puck giới thiệu nếu có trang 'tai-nguyen' đã xuất bản
    let introData: Data | null = null
    try {
      const pageResult = await payload.find({
        collection: 'pages',
        where: {
          and: [{ slug: { equals: 'tai-nguyen' } }, { _status: { equals: 'published' } }],
        },
        limit: 1,
        draft: false,
      })
      const pageDoc = pageResult.docs[0]
      if (pageDoc?.puckData) {
        const initialData = pageDoc.puckData as Data
        introData = await resolveServerData(initialData, { pageSlug: 'tai-nguyen' })
      }
    } catch {
      introData = null
    }

    const isTaiLieuOnly = params.topic === 'tai-lieu'
    const isTopicPost =
      params.topic === 'habit' || params.topic === 'eq' || params.topic === 'career'

    // 2. Lấy sản phẩm miễn phí (ebook, toolkit)
    // Chỉ lấy khi topic là 'tai-lieu' hoặc không chọn topic ('Tất cả')
    let rawProducts: Product[] = []
    if (!isTopicPost) {
      try {
        const productsAnd: Record<string, unknown>[] = [
          { _status: { equals: 'published' } },
          { saleStatus: { equals: 'free' } },
          { or: [{ type: { equals: 'ebook' } }, { type: { equals: 'toolkit' } }] },
        ]

        if (params.q) {
          productsAnd.push({ name: { like: params.q } })
        }

        const productsResult = await payload.find({
          collection: 'products',
          where: { and: productsAnd } as unknown as Where,
          sort: 'order',
          depth: 1,
          limit: 100,
          draft: false,
        })
        rawProducts = productsResult.docs as Product[]
      } catch {
        rawProducts = []
      }
    }

    // 3. Lấy danh sách bài viết / video
    // Chỉ lấy khi topic không phải 'tai-lieu'
    let rawPosts: Post[] = []
    if (!isTaiLieuOnly) {
      try {
        const postsAnd: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]

        if (isTopicPost && params.topic) {
          postsAnd.push({ topic: { equals: params.topic } })
        }

        if (params.q) {
          postsAnd.push({ title: { like: params.q } })
        }

        const postsResult = await payload.find({
          collection: 'posts',
          where: { and: postsAnd } as unknown as Where,
          sort: '-createdAt',
          depth: 1,
          limit: 100,
          draft: false,
        })
        rawPosts = postsResult.docs as Post[]
      } catch {
        rawPosts = []
      }
    }

    // 4. Tách 1 bài nổi bật (featured = true mới nhất khớp bộ lọc)
    let featuredPost: LibraryPostItem | null = null
    const nonFeaturedPosts: Post[] = []

    for (const post of rawPosts) {
      if (!featuredPost && post.featured === true) {
        const readingMinutes =
          post.format !== 'video' ? estimateReadingMinutes(post.content) : undefined
        featuredPost = {
          ...post,
          readingMinutes,
          isProduct: false,
        }
      } else {
        nonFeaturedPosts.push(post)
      }
    }

    // 5. Chuẩn hóa sản phẩm thành feed items
    const productItems: LibraryProductItem[] = rawProducts.map((p) => {
      const cover =
        p.coverImage && typeof p.coverImage === 'object' && 'url' in p.coverImage
          ? {
              url: (p.coverImage as { url?: string }).url || null,
              alt: (p.coverImage as { alt?: string }).alt || p.name,
            }
          : null

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription || null,
        topic: p.topic || null,
        type: (p.type === 'toolkit' ? 'toolkit' : 'ebook') as 'ebook' | 'toolkit',
        coverImage: cover,
        isProduct: true,
      }
    })

    // 6. Chuẩn hóa bài viết thành feed items với thời gian đọc
    const postItems: LibraryPostItem[] = nonFeaturedPosts.map((post) => {
      const readingMinutes =
        post.format !== 'video' ? estimateReadingMinutes(post.content) : undefined
      return {
        ...post,
        readingMinutes,
        isProduct: false,
      }
    })

    // Ghép toàn bộ feed items (bài viết + sản phẩm tài liệu)
    const allItems: LibraryFeedItem[] = [...postItems, ...productItems]

    // 7. Phân trang: 9 bài / trang
    const PAGE_SIZE = 9
    const totalItems = allItems.length
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const currentPage = Math.min(Math.max(1, params.trang || 1), totalPages)
    const paginatedItems = allItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    return {
      featuredPost,
      items: paginatedItems,
      totalItems,
      currentPage,
      totalPages,
      introData,
      hasError: false,
      products: rawProducts,
      posts: rawPosts,
    }
  } catch {
    return {
      featuredPost: null,
      items: [],
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
      introData: null,
      hasError: true,
      products: [],
      posts: [],
    }
  }
}
