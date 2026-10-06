import 'server-only'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import type { Product, Post } from '@/payload-types'
import type { Data } from '@puckeditor/core'
import { resolveServerData } from '@/puck/resolve.server'
import {
  type LibraryQueryParams,
  buildProductsWhere,
  buildPostsWhere,
  productTopic,
} from '@/lib/library'

export interface LibraryDataResult {
  products: Product[]
  posts: Post[]
  introData: Data | null
  hasError: boolean
}

/**
 * Đọc dữ liệu thư viện phía máy chủ:
 * - Puck intro từ `pages` slug 'thu-vien' (nếu có bản published)
 * - Sản phẩm (products) theo tab và bộ lọc
 * - Bài viết / video (posts) theo tab 'noi-dung' và bộ lọc
 * - Bọc try/catch toàn bộ để không bao giờ quăng lỗi 500 ra giao diện.
 */
export async function getLibraryData(params: LibraryQueryParams): Promise<LibraryDataResult> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // 1. Lấy dữ liệu Puck giới thiệu nếu có trang 'thu-vien' đã xuất bản
    let introData: Data | null = null
    try {
      const pageResult = await payload.find({
        collection: 'pages',
        where: {
          and: [{ slug: { equals: 'thu-vien' } }, { _status: { equals: 'published' } }],
        },
        limit: 1,
        draft: false,
      })
      const pageDoc = pageResult.docs[0]
      if (pageDoc?.puckData) {
        const initialData = pageDoc.puckData as Data
        introData = await resolveServerData(initialData)
      }
    } catch {
      // Nếu lỗi đọc trang giới thiệu, bỏ qua để phần còn lại hoạt động bình thường
      introData = null
    }

    // 2. Lấy danh sách sản phẩm
    let products: Product[] = []
    try {
      const productsWhere = buildProductsWhere(params)
      const productsResult = await payload.find({
        collection: 'products',
        where: productsWhere as unknown as Where,
        sort: 'order',
        depth: 1,
        limit: 100,
        draft: false,
      })

      // Lọc an toàn phía server: loại bỏ hidden và đảm bảo productTopic khớp nếu có topic
      products = (productsResult.docs as Product[]).filter((p) => {
        if (p.saleStatus === 'hidden') return false
        if (params.topic) {
          return productTopic(p) === params.topic
        }
        return true
      })
    } catch {
      products = []
    }

    // 3. Lấy danh sách bài viết / video (chỉ áp dụng cho tab 'noi-dung')
    let posts: Post[] = []
    if (params.tab === 'noi-dung') {
      try {
        const postsWhere = buildPostsWhere(params)
        const postsResult = await payload.find({
          collection: 'posts',
          where: postsWhere as unknown as Where,
          sort: '-createdAt',
          depth: 1,
          limit: 100,
          draft: false,
        })
        posts = postsResult.docs as Post[]
      } catch {
        posts = []
      }
    }

    return {
      products,
      posts,
      introData,
      hasError: false,
    }
  } catch {
    return {
      products: [],
      posts: [],
      introData: null,
      hasError: true,
    }
  }
}
