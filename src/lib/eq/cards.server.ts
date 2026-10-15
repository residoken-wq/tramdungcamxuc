import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'

export interface PublicEqCard {
  id: number | string
  code: string
  message: string | null
  story: unknown | null
  qrSlug: string
  printedAt: string | null
  order: number | null
  _status: string | null
}

/**
 * Tìm thẻ EQ Buddy theo qrSlug, chỉ lấy bản ghi đã xuất bản (_status = 'published').
 * Dùng React cache() để dùng chung kết quả giữa generateMetadata và Page component trong cùng request.
 *
 * Chỉ đọc các trường an toàn: code, message, story, qrSlug, printedAt, order, _status
 * (tuân thủ ranh giới song song với T3-01).
 */
export const getPublishedEqCardByQrSlug = cache(
  async (qrSlug: string): Promise<PublicEqCard | null> => {
    if (!qrSlug || typeof qrSlug !== 'string') return null
    const cleanSlug = qrSlug.trim().toLowerCase()
    if (!cleanSlug) return null

    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const result = await payload.find({
        collection: 'eqCards',
        where: {
          and: [{ qrSlug: { equals: cleanSlug } }, { _status: { equals: 'published' } }],
        },
        select: {
          id: true,
          code: true,
          message: true,
          story: true,
          qrSlug: true,
          printedAt: true,
          order: true,
          _status: true,
        },
        limit: 1,
        draft: false,
      })

      const doc = result.docs[0]
      if (!doc) return null

      return {
        id: doc.id,
        code: doc.code || '',
        message: doc.message || null,
        story: doc.story || null,
        qrSlug: doc.qrSlug || cleanSlug,
        printedAt: doc.printedAt ? String(doc.printedAt) : null,
        order: typeof doc.order === 'number' ? doc.order : null,
        _status: doc._status ? String(doc._status) : null,
      }
    } catch (err) {
      // A DB outage must show the error page, not a 404 on a printed QR.
      if ((err as { status?: number })?.status === 404) return null
      throw err
    }
  },
)
