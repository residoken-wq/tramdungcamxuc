'use server'

import {
  saveEqCardCore,
  deleteSavedCardCore,
  type SaveEqCardInput,
  type SaveEqCardResult,
  type DeleteSavedCardInput,
  type DeleteSavedCardResult,
} from './saved.server'

/**
 * Server action: Lưu thẻ EQ Buddy và suy ngẫm vào tài khoản khách hàng.
 * Chỉ export hàm bọc theo quy định kiến trúc và bảo mật.
 */
export async function saveEqCardAction(
  input: Omit<SaveEqCardInput, 'customerIdOverride'>,
): Promise<SaveEqCardResult> {
  return saveEqCardCore(input)
}

/**
 * Server action: Xóa thẻ đã lưu của chính khách hàng.
 * Chỉ export hàm bọc theo quy định kiến trúc và bảo mật.
 */
export async function deleteSavedCardAction(
  input: Omit<DeleteSavedCardInput, 'customerIdOverride'>,
): Promise<DeleteSavedCardResult> {
  return deleteSavedCardCore(input)
}
