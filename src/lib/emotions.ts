// Q14: Bộ 10 cảm xúc cố định (hiển thị emoji) theo Brand Book 2026 và quyết định 10/10/2026.
// Danh sách 10 cảm xúc: Vui vẻ, Bình an, Tươi mới, An yên, Biết ơn, Thư thái, Tự tin, Hơi mệt, Chùn bước, Căng thẳng.
// H5: Bổ sung 5 mức cảm xúc tự tin của zip (Tự ti, Chưa tự tin, Hơi tự tin, Rất tự tin, Tuyệt vời).

export type LegacyEmotionKey =
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

export const CONFIDENCE_EMOTIONS = [
  { key: 'insecure', label: 'Tự ti', emoji: '😫' },
  { key: 'unconfident', label: 'Chưa tự tin', emoji: '😣' },
  { key: 'somewhat_confident', label: 'Hơi tự tin', emoji: '😊' },
  { key: 'very_confident', label: 'Rất tự tin', emoji: '🥰' },
  { key: 'wonderful', label: 'Tuyệt vời', emoji: '😍' },
] as const

export type ConfidenceEmotionKey = (typeof CONFIDENCE_EMOTIONS)[number]['key']

export type EmotionKey = LegacyEmotionKey | ConfidenceEmotionKey

export interface Emotion {
  key: EmotionKey
  label: string
  emoji: string
}

export const EMOTIONS: readonly Emotion[] = [
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

export const ALL_CHECKIN_EMOTIONS: readonly Emotion[] = [
  ...EMOTIONS,
  ...CONFIDENCE_EMOTIONS,
]

/**
 * Lấy đối tượng cảm xúc theo khóa định danh.
 */
export function getEmotion(key: string | null | undefined): Emotion | undefined {
  if (!key) return undefined
  return ALL_CHECKIN_EMOTIONS.find((e) => e.key === key)
}
