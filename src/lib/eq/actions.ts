'use server'

import { drawEqCardCore, type DrawEqCardInput, type DrawEqCardResult } from '@/lib/eq/draw.server'

/**
 * Server action: Luồng rút thẻ EQ Buddy.
 * Chỉ export hàm bọc duy nhất theo quy định bảo mật và kiến trúc.
 */
export async function drawEqCardAction(input: DrawEqCardInput): Promise<DrawEqCardResult> {
  return drawEqCardCore(input)
}
