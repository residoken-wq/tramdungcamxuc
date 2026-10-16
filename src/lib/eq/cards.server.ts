import 'server-only'
import { cache } from 'react'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'

export interface PublicEqCard {
  id: number | string
  code: string
  keywordEn: string | null
  message: string | null
  promptRecall: string | null
  promptPack: string | null
  promptAcknowledge: string | null
  story: unknown | null
  qrSlug: string
  printedAt: string | null
  order: number | null
  _status: string | null
  smallAction?: string | null
  topic?: string | null
}

/**
 * Tìm thẻ EQ Buddy theo qrSlug, chỉ lấy bản ghi đã xuất bản (_status = 'published').
 * Dùng React cache() để dùng chung kết quả giữa generateMetadata và Page component trong cùng request.
 *
 * Chỉ đọc các trường an toàn: code, message, story, qrSlug, printedAt, order, _status, smallAction, topic
 * (tuân thủ ranh giới song song với T3-01).
 */
export const getPublishedEqCardByQrSlug = cache(
  async (
    qrSlug: string,
    options?: { draft?: boolean; previewId?: string | number; user?: unknown },
  ): Promise<PublicEqCard | null> => {
    if (!qrSlug || typeof qrSlug !== 'string') return null
    const cleanSlug = qrSlug.trim().toLowerCase()
    if (!cleanSlug) return null

    const isDraft = Boolean(options?.draft)

    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const whereConditions = isDraft
        ? options?.previewId
          ? { id: { equals: options.previewId } }
          : { qrSlug: { equals: cleanSlug } }
        : {
            and: [{ qrSlug: { equals: cleanSlug } }, { _status: { equals: 'published' } }],
          }

      const result = await payload.find({
        collection: 'eqCards',
        where: whereConditions as unknown as Where,
        select: {
          id: true,
          code: true,
          keywordEn: true,
          message: true,
          promptRecall: true,
          promptPack: true,
          promptAcknowledge: true,
          story: true,
          smallAction: true,
          topic: true,
          qrSlug: true,
          printedAt: true,
          order: true,
          _status: true,
        },
        limit: 1,
        draft: isDraft,
        // Draft preview: enforce the admin's access. Public read keeps the previous behaviour
        // (field access such as products.files is admin-only and must not blank the public page).
        ...(isDraft ? { overrideAccess: false, user: options?.user as never } : {}),
      })

      const doc = result.docs[0]
      if (!doc) return null

      return {
        id: doc.id,
        code: doc.code || '',
        keywordEn: doc.keywordEn || null,
        message: doc.message || null,
        promptRecall: doc.promptRecall || null,
        promptPack: doc.promptPack || null,
        promptAcknowledge: doc.promptAcknowledge || null,
        story: doc.story || null,
        smallAction: doc.smallAction || null,
        topic: doc.topic || null,
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

export interface PublicEqCardKeyword {
  code: string
  keywordEn: string
  qrSlug: string
  order: number | null
}

/**
 * Lấy danh sách từ khóa của toàn bộ thẻ EQ Buddy đã xuất bản, sắp theo order (A–Z).
 * Dùng cho lưới chọn theo từ khóa ở Bước 1 của luồng rút thẻ.
 */
export const getPublishedEqKeywords = cache(async (): Promise<PublicEqCardKeyword[]> => {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.find({
      collection: 'eqCards',
      where: {
        _status: { equals: 'published' },
      },
      select: {
        code: true,
        keywordEn: true,
        qrSlug: true,
        order: true,
      },
      sort: 'order',
      limit: 100,
      draft: false,
    })

    return result.docs
      .filter((doc) => Boolean(doc.keywordEn && doc.qrSlug))
      .map((doc) => ({
        code: doc.code || '',
        keywordEn: doc.keywordEn || '',
        qrSlug: doc.qrSlug || '',
        order: typeof doc.order === 'number' ? doc.order : null,
      }))
  } catch (err) {
    if ((err as { status?: number })?.status === 404) return []
    throw err
  }
})
