import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import type { EqCard } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getPublishedEqCardByQrSlug } from '@/lib/eq/cards.server'
import { vi } from '@/lib/i18n/vi'

export interface SaveEqCardInput {
  qrSlug: string
  reflection?: string | null
  /** Optional customer override for unit testing with mock sessions */
  customerIdOverride?: number
}

export interface SaveEqCardResult {
  success: boolean
  code?: 'UNAUTHENTICATED' | 'CARD_NOT_FOUND' | 'VALIDATION_ERROR' | 'ERROR'
  message?: string
  savedCardId?: number
}

export interface DeleteSavedCardInput {
  savedCardId: number
  /** Optional customer override for unit testing with mock sessions */
  customerIdOverride?: number
}

export interface DeleteSavedCardResult {
  success: boolean
  code?: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'ERROR'
  message?: string
}

export interface CustomerSavedCardItem {
  id: number
  cardId: number
  code: string
  keywordEn: string
  keywordVi: string | null
  message: string
  qrSlug: string
  savedAt: string
  reflection: string | null
}

/**
 * REVIEW-REQUIRED: Lõi lưu thẻ EQ Buddy và suy ngẫm cho khách hàng.
 * - Khách hàng phải đăng nhập (lấy từ phiên qua getCurrentCustomer).
 * - Chỉ cho phép lưu thẻ đã xuất bản (_status = 'published').
 * - Thẻ đã lưu rồi -> cập nhật reflection (upsert theo saveKey).
 * - reflection tối đa 2000 ký tự, trim, rỗng -> null.
 * - Không gửi reflection vào analytics, log, email.
 */
export async function saveEqCardCore(input: SaveEqCardInput): Promise<SaveEqCardResult> {
  // REVIEW-REQUIRED: Kiểm tra phiên khách hàng đăng nhập
  let customerId: number | null = null
  if (typeof input?.customerIdOverride === 'number') {
    customerId = input.customerIdOverride
  } else {
    try {
      const customer = await getCurrentCustomer()
      customerId = customer ? customer.id : null
    } catch {
      customerId = null
    }
  }

  if (!customerId) {
    return {
      success: false,
      code: 'UNAUTHENTICATED',
      message: vi.eqBuddy.savedCards.errors.unauthenticated,
    }
  }

  // REVIEW-REQUIRED: Chỉ thẻ đã xuất bản mới được phép lưu
  const card = await getPublishedEqCardByQrSlug(input.qrSlug)
  if (!card) {
    return {
      success: false,
      code: 'CARD_NOT_FOUND',
      message: vi.eqBuddy.savedCards.errors.cardNotFound,
    }
  }

  // Chuẩn hóa và xác thực reflection (tối đa 2000 ký tự, trim, rỗng -> null)
  let cleanReflection: string | null = null
  if (typeof input.reflection === 'string') {
    const trimmed = input.reflection.trim()
    if (trimmed.length > 2000) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: vi.eqBuddy.savedCards.errors.reflectionTooLong,
      }
    }
    cleanReflection = trimmed.length > 0 ? trimmed : null
  }

  const saveKey = `${customerId}:${card.id}`

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Kiểm tra xem thẻ đã được lưu trước đó chưa
    const existingRes = await payload.find({
      collection: 'savedCards',
      where: {
        saveKey: { equals: saveKey },
      },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })

    const existingDoc = existingRes.docs[0]
    if (existingDoc) {
      // Đã lưu rồi -> cập nhật reflection
      const updated = await payload.update({
        collection: 'savedCards',
        id: existingDoc.id,
        data: {
          reflection: cleanReflection,
        },
        overrideAccess: true,
      })
      return {
        success: true,
        savedCardId: updated.id,
      }
    }

    // Chưa lưu -> tạo bản ghi mới
    try {
      const created = await payload.create({
        collection: 'savedCards',
        data: {
          customer: customerId,
          card: Number(card.id),
          reflection: cleanReflection,
          saveKey,
          savedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      return {
        success: true,
        savedCardId: created.id,
      }
    } catch {
      // Xử lý race condition: nếu bản ghi vừa được tạo đồng thời, tìm và cập nhật
      const retryExisting = await payload.find({
        collection: 'savedCards',
        where: { saveKey: { equals: saveKey } },
        limit: 1,
        overrideAccess: true,
        depth: 0,
      })
      if (retryExisting.docs[0]) {
        const updated = await payload.update({
          collection: 'savedCards',
          id: retryExisting.docs[0].id,
          data: { reflection: cleanReflection },
          overrideAccess: true,
        })
        return {
          success: true,
          savedCardId: updated.id,
        }
      }
      throw new Error(vi.eqBuddy.savedCards.errors.generalError)
    }
  } catch (err) {
    console.error(
      '[saveEqCardCore] Lỗi khi lưu thẻ (không ghi reflection):',
      err instanceof Error ? err.message : '',
    )
    return {
      success: false,
      code: 'ERROR',
      message: vi.eqBuddy.savedCards.errors.generalError,
    }
  }
}

/**
 * REVIEW-REQUIRED: Lõi xóa thẻ đã lưu của chính khách hàng.
 * - Chỉ xóa bản của chính khách hàng (kiểm tra quyền sở hữu customer).
 * - Không phải của mình -> lỗi chung, không tiết lộ lý do bảo mật.
 */
export async function deleteSavedCardCore(
  input: DeleteSavedCardInput,
): Promise<DeleteSavedCardResult> {
  // REVIEW-REQUIRED: Kiểm tra phiên khách hàng
  let customerId: number | null = null
  if (typeof input?.customerIdOverride === 'number') {
    customerId = input.customerIdOverride
  } else {
    try {
      const customer = await getCurrentCustomer()
      customerId = customer ? customer.id : null
    } catch {
      customerId = null
    }
  }

  if (!customerId) {
    return {
      success: false,
      code: 'UNAUTHENTICATED',
      message: vi.eqBuddy.savedCards.errors.unauthenticated,
    }
  }

  if (!input || !input.savedCardId || typeof input.savedCardId !== 'number') {
    return {
      success: false,
      code: 'ERROR',
      message: vi.eqBuddy.savedCards.errors.deleteForbidden,
    }
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const doc = await payload.findByID({
      collection: 'savedCards',
      id: input.savedCardId,
      depth: 0,
      overrideAccess: true,
    })

    if (!doc) {
      // Không tìm thấy -> lỗi chung
      return {
        success: false,
        code: 'ERROR',
        message: vi.eqBuddy.savedCards.errors.deleteForbidden,
      }
    }

    // REVIEW-REQUIRED: Kiểm tra quyền sở hữu của chính khách hàng
    const docCustomerId =
      typeof doc.customer === 'object' && doc.customer !== null
        ? (doc.customer as { id: number }).id
        : Number(doc.customer)

    if (docCustomerId !== customerId) {
      return {
        success: false,
        code: 'ERROR',
        message: vi.eqBuddy.savedCards.errors.deleteForbidden,
      }
    }

    await payload.delete({
      collection: 'savedCards',
      id: input.savedCardId,
      overrideAccess: true,
    })

    return {
      success: true,
    }
  } catch (err) {
    console.error('[deleteSavedCardCore] Lỗi khi xóa thẻ:', err instanceof Error ? err.message : '')
    return {
      success: false,
      code: 'ERROR',
      message: vi.eqBuddy.savedCards.errors.generalError,
    }
  }
}

/**
 * REVIEW-REQUIRED: Đọc danh sách thẻ đã lưu của chính khách hàng (cho trang /tai-khoan).
 * Chỉ đọc thẻ của customerId được chỉ định, lọc ra các thẻ đã xuất bản.
 */
export async function getCustomerSavedCards(customerId: number): Promise<CustomerSavedCardItem[]> {
  if (!customerId) return []

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const result = await payload.find({
    collection: 'savedCards',
    where: {
      customer: { equals: customerId },
    },
    sort: '-savedAt',
    depth: 1,
    limit: 100,
    overrideAccess: true,
  })

  const items: CustomerSavedCardItem[] = []
  for (const doc of result.docs) {
    const card = doc.card
    if (typeof card === 'object' && card !== null && 'code' in card) {
      const eqCard = card as EqCard
      if (eqCard._status === 'published') {
        items.push({
          id: doc.id,
          cardId: eqCard.id,
          code: eqCard.code,
          keywordEn: eqCard.keywordEn || eqCard.code,
          keywordVi: eqCard.keywordVi || null,
          message: eqCard.message || '',
          qrSlug: eqCard.qrSlug || '',
          savedAt: doc.savedAt || doc.createdAt || new Date().toISOString(),
          reflection: doc.reflection || null,
        })
      }
    }
  }

  return items
}

/**
 * Kiểm tra trạng thái lưu thẻ của khách hàng cho một thẻ cụ thể theo qrSlug.
 */
export async function getSavedCardStatus(
  customerId: number,
  qrSlug: string,
): Promise<{ isSaved: boolean; reflection: string | null; id?: number }> {
  if (!customerId || !qrSlug) return { isSaved: false, reflection: null }

  const card = await getPublishedEqCardByQrSlug(qrSlug)
  if (!card) return { isSaved: false, reflection: null }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const result = await payload.find({
    collection: 'savedCards',
    where: {
      saveKey: { equals: `${customerId}:${card.id}` },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc) return { isSaved: false, reflection: null }

  return {
    isSaved: true,
    reflection: doc.reflection || null,
    id: doc.id,
  }
}
