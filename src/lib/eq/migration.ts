import { EMOTIONS, type EmotionKey } from '../emotions'

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
}

/**
 * Ánh xạ một nhãn cảm xúc cũ (không phân biệt hoa thường, bỏ khoảng trắng, có/không dấu)
 * sang khóa định danh EmotionKey (10 cảm xúc chuẩn Q14).
 * Trả về null nếu không khớp cảm xúc nào.
 */
export function mapLegacyEmotionTag(raw: string | null | undefined): EmotionKey | null {
  if (!raw || typeof raw !== 'string') return null
  const clean = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!clean) return null
  const cleanNoTone = removeVietnameseTones(clean)

  for (const emotion of EMOTIONS) {
    const keyNorm = emotion.key.toLowerCase().replace(/\s+/g, '')
    const labelNorm = emotion.label.toLowerCase().replace(/\s+/g, '')
    const fullNorm = `${emotion.emoji}${emotion.label}`.toLowerCase().replace(/\s+/g, '')
    const labelNoTone = removeVietnameseTones(labelNorm)
    if (
      clean === keyNorm ||
      clean === labelNorm ||
      clean === fullNorm ||
      cleanNoTone === labelNoTone
    ) {
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
 * Chuyển giá trị reflectionPrompt cũ (nếu có) thành promptRecall;
 * promptPack và promptAcknowledge để rỗng.
 */
export function migrateReflectionPromptToPrompts(
  legacyPrompt: string | null | undefined,
): { promptRecall: string; promptPack: string; promptAcknowledge: string } {
  return {
    promptRecall: typeof legacyPrompt === 'string' ? legacyPrompt.trim() : '',
    promptPack: '',
    promptAcknowledge: '',
  }
}

/**
 * Trích xuất lại chuỗi promptRecall khi rollback về reflectionPrompt đơn.
 */
export function rollbackReflectionPromptsToPrompt(
  promptRecall: string | null | undefined,
): string | null {
  if (typeof promptRecall === 'string' && promptRecall.trim().length > 0) {
    return promptRecall.trim()
  }
  return null
}
