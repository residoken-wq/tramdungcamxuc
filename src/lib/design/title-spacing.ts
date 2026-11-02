/**
 * PK-13: title line height and heading gap presets and helpers.
 * Shared across CMS (designSystem global), Puck builder (_style), and CSS generation.
 */

export const TITLE_LINE_HEIGHT_PRESETS = ['normal', 'airy', 'very-airy'] as const
export type TitleLineHeightPreset = (typeof TITLE_LINE_HEIGHT_PRESETS)[number]

export const EYEBROW_GAP_PRESETS = ['tight', 'normal', 'airy'] as const
export type EyebrowGapPreset = (typeof EYEBROW_GAP_PRESETS)[number]

export const EMOTION_GAP_PRESETS = ['tight', 'normal', 'airy'] as const
export type EmotionGapPreset = (typeof EMOTION_GAP_PRESETS)[number]

export const TITLE_LINE_HEIGHT_VALUES: Record<TitleLineHeightPreset, string> = {
  normal: '1.3',
  airy: '1.45',
  'very-airy': '1.6',
}

export const EYEBROW_GAP_VALUES: Record<EyebrowGapPreset, string> = {
  tight: '8px',
  normal: '16px',
  airy: '24px',
}

export const EMOTION_GAP_VALUES: Record<EmotionGapPreset, string> = {
  tight: '8px',
  normal: '14px',
  airy: '24px',
}

export interface TitleSpacing {
  titleLineHeight: TitleLineHeightPreset
  eyebrowGap: EyebrowGapPreset
  emotionGap: EmotionGapPreset
}

export const DEFAULT_TITLE_SPACING: TitleSpacing = {
  titleLineHeight: 'normal',
  eyebrowGap: 'normal',
  emotionGap: 'normal',
}

export const CSS_VARS = {
  titleLineHeight: '--tdcx-title-lh',
  eyebrowGap: '--tdcx-eyebrow-gap',
  emotionGap: '--tdcx-emotion-gap',
} as const

export function cleanTitleLineHeight(value: unknown): TitleLineHeightPreset | undefined {
  return typeof value === 'string' &&
    (TITLE_LINE_HEIGHT_PRESETS as readonly string[]).includes(value)
    ? (value as TitleLineHeightPreset)
    : undefined
}

export function cleanEyebrowGap(value: unknown): EyebrowGapPreset | undefined {
  return typeof value === 'string' && (EYEBROW_GAP_PRESETS as readonly string[]).includes(value)
    ? (value as EyebrowGapPreset)
    : undefined
}

export function cleanEmotionGap(value: unknown): EmotionGapPreset | undefined {
  return typeof value === 'string' && (EMOTION_GAP_PRESETS as readonly string[]).includes(value)
    ? (value as EmotionGapPreset)
    : undefined
}

export function cleanTitleSpacing(raw: unknown): TitleSpacing {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_TITLE_SPACING }
  }
  const r = raw as Record<string, unknown>
  return {
    titleLineHeight:
      cleanTitleLineHeight(r.titleLineHeight) ?? DEFAULT_TITLE_SPACING.titleLineHeight,
    eyebrowGap: cleanEyebrowGap(r.eyebrowGap) ?? DEFAULT_TITLE_SPACING.eyebrowGap,
    emotionGap: cleanEmotionGap(r.emotionGap) ?? DEFAULT_TITLE_SPACING.emotionGap,
  }
}

