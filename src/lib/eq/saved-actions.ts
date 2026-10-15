'use server'

import {
  deleteSavedCardCore,
  getSessionCustomerId,
  saveEqCardCore,
  type DeleteSavedCardResult,
  type SaveEqCardResult,
} from './saved.server'

/**
 * Server action: Lưu thẻ EQ Buddy và suy ngẫm vào tài khoản khách hàng.
 * Chỉ export hàm bọc theo quy định kiến trúc và bảo mật.
 */
// REVIEW-REQUIRED: Khách lấy từ phiên; chỉ chuyển tiếp đúng các trường cho phép từ trình duyệt.
export async function saveEqCardAction(input: {
  qrSlug: string
  reflection?: string | null
}): Promise<SaveEqCardResult> {
  const customerId = await getSessionCustomerId()
  const reflection =
    typeof input?.reflection === 'string' || input?.reflection === null
      ? input.reflection
      : undefined
  return saveEqCardCore(customerId, { qrSlug: String(input?.qrSlug ?? ''), reflection })
}

/**
 * Server action: Xóa thẻ đã lưu của chính khách hàng.
 * Chỉ export hàm bọc theo quy định kiến trúc và bảo mật.
 */
// REVIEW-REQUIRED: Khách lấy từ phiên; lõi kiểm chủ sở hữu trước khi xóa.
export async function deleteSavedCardAction(input: {
  savedCardId: number
}): Promise<DeleteSavedCardResult> {
  const customerId = await getSessionCustomerId()
  return deleteSavedCardCore(customerId, { savedCardId: Number(input?.savedCardId) })
}
