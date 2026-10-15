import { EMOTIONS, type EmotionKey } from '../emotions'

/**
 * Ánh xạ một nhãn cảm xúc cũ (không phân biệt hoa thường, bỏ khoảng trắng)
 * sang khóa định danh EmotionKey (10 cảm xúc chuẩn Q14).
 * Trả về null nếu không khớp cảm xúc nào.
 */
export function mapLegacyEmotionTag(raw: string | null | undefined): EmotionKey | null {
  if (!raw || typeof raw !== 'string') return null
  const clean = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!clean) return null

  for (const emotion of EMOTIONS) {
    const keyNorm = emotion.key.toLowerCase().replace(/\s+/g, '')
    const labelNorm = emotion.label.toLowerCase().replace(/\s+/g, '')
    const fullNorm = `${emotion.emoji}${emotion.label}`.toLowerCase().replace(/\s+/g, '')
    if (clean === keyNorm || clean === labelNorm || clean === fullNorm) {
      return emotion.key
    }
  }

  return null
}

/**
 * Chuyển đổi danh sách nhãn cảm xúc cũ sang mảng EmotionKey chuẩn.
 * Các phần tử không khớp sẽ bị loại bỏ và tính vào droppedCount.
 * Khóa trùng lặp trong cùng một thẻ được hợp nhất (deduplicate).
 */
export function migrateEmotionTags(
  legacyTags: Array<{ text?: string | null } | string> | null | undefined,
): {
  tags: EmotionKey[]
  droppedCount: number
} {
  if (!legacyTags || !Array.isArray(legacyTags)) {
    return { tags: [], droppedCount: 0 }
  }

  const tags: EmotionKey[] = []
  let droppedCount = 0

  for (const item of legacyTags) {
    const raw = typeof item === 'string' ? item : item?.text
    const mapped = mapLegacyEmotionTag(raw)
    if (mapped) {
      if (!tags.includes(mapped)) {
        tags.push(mapped)
      }
    } else {
      droppedCount++
    }
  }

  return { tags, droppedCount }
}

/**
 * Chuyển chuỗi reflectionPrompt cũ thành mảng reflectionPrompts (1–3 câu).
 * Nếu chuỗi cũ khác rỗng, tạo phần tử đầu tiên.
 */
export function migrateReflectionPromptToPrompts(
  legacyPrompt: string | null | undefined,
): Array<{ prompt: string }> {
  if (typeof legacyPrompt === 'string' && legacyPrompt.trim().length > 0) {
    return [{ prompt: legacyPrompt.trim() }]
  }
  return []
}

/**
 * Trích xuất chuỗi câu hỏi đầu tiên khi rollback về reflectionPrompt đơn.
 */
export function rollbackReflectionPromptsToPrompt(
  prompts: Array<{ prompt?: string | null }> | null | undefined,
): string | null {
  if (Array.isArray(prompts) && prompts.length > 0) {
    const first = prompts[0]?.prompt
    if (typeof first === 'string' && first.trim().length > 0) {
      return first.trim()
    }
  }
  return null
}
