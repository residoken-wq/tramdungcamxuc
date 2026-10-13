// Q14: Bộ 10 cảm xúc cố định (hiển thị emoji) theo Brand Book 2026 và quyết định 10/10/2026.
// Danh sách 10 cảm xúc: Vui vẻ, Bình an, Tươi mới, An yên, Biết ơn, Thư thái, Tự tin, Hơi mệt, Chùn bước, Căng thẳng.

export type EmotionKey =
  | 'joyful'
  | 'peaceful'
  | 'fresh'
  | 'serene'
  | 'grateful'
  | 'relaxed'
  | 'confident'
  | 'tired'
  | 'discouraged'
  | 'stressed'

export interface Emotion {
  key: EmotionKey
  label: string
  emoji: string
}

export const EMOTIONS = [
  {
    key: 'joyful',
    label: 'Vui vẻ',
    emoji: '😊',
  },
  {
    key: 'peaceful',
    label: 'Bình an',
    emoji: '🕊️',
  },
  {
    key: 'fresh',
    label: 'Tươi mới',
    emoji: '🌱',
  },
  {
    key: 'serene',
    label: 'An yên',
    emoji: '🍵',
  },
  {
    key: 'grateful',
    label: 'Biết ơn',
    emoji: '🙏',
  },
  {
    key: 'relaxed',
    label: 'Thư thái',
    emoji: '🌿',
  },
  {
    key: 'confident',
    label: 'Tự tin',
    emoji: '✨',
  },
  {
    key: 'tired',
    label: 'Hơi mệt',
    emoji: '🥱',
  },
  {
    key: 'discouraged',
    label: 'Chùn bước',
    emoji: '🌧️',
  },
  {
    key: 'stressed',
    label: 'Căng thẳng',
    emoji: '⚡',
  },
] as const

/**
 * Lấy đối tượng cảm xúc theo khóa định danh.
 */
export function getEmotion(key: string | null | undefined): Emotion | undefined {
  if (!key) return undefined
  return EMOTIONS.find((e) => e.key === key)
}
