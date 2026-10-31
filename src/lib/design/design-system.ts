/**
 * EB-01: pure helpers for the `designSystem` global (client-safe, no Payload imports).
 * The global itself and the server reader live in src/globals/DesignSystem.ts and
 * design-system.server.ts.
 */
import {
  BRAND_COLOR_DESCRIPTIONS,
  BRAND_COLORS_HEX,
  BRAND_RADII,
  BRAND_SPACING,
  type BrandColorToken,
} from '../brand/tokens'
import { DEFAULT_FONTS, isDesignFont, type FontRole } from './fonts'

/** Tokens the code base uses as Tailwind classes – they must always exist. */
export const CORE_COLOR_TOKENS = Object.keys(BRAND_COLORS_HEX) as BrandColorToken[]

export const LOCK_KEYS = ['colors', 'fonts', 'sizes', 'customCss'] as const
export type LockKey = (typeof LOCK_KEYS)[number]
export type LockState = 'locked' | 'open'

export const MAX_COLORS = 16
export const TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

export interface DesignColor {
  token: string
  label: string
  hex: string
}

export interface CleanDesignSystem {
  colors: DesignColor[]
  fonts: Record<FontRole, string>
  radiusCard: number
  spacing: { sm: number; md: number; lg: number }
  lock: Record<LockKey, LockState> & { contrastCheck: boolean }
}

export const DEFAULT_COLORS: DesignColor[] = CORE_COLOR_TOKENS.map((token) => ({
  token,
  // The Brand Book descriptions end with "(#RRGGBB)"; drop it so the label stays right after a HEX change.
  label: BRAND_COLOR_DESCRIPTIONS[token].replace(/\s*\(#[0-9A-Fa-f]{6}\)$/, ''),
  hex: BRAND_COLORS_HEX[token],
}))

const px = (value: string): number => Number.parseInt(value, 10)

export const DEFAULT_DESIGN_SYSTEM: CleanDesignSystem = {
  colors: DEFAULT_COLORS,
  fonts: { ...DEFAULT_FONTS },
  radiusCard: px(BRAND_RADII.card),
  spacing: {
    sm: px(BRAND_SPACING['breath-sm']),
    md: px(BRAND_SPACING['breath-md']),
    lg: px(BRAND_SPACING['breath-lg']),
  },
  // Product default for every new customer site: everything locked (decision 31/10).
  lock: {
    colors: 'locked',
    fonts: 'locked',
    sizes: 'locked',
    customCss: 'locked',
    contrastCheck: true,
  },
}

export function isOpen(ds: Pick<CleanDesignSystem, 'lock'>, key: LockKey): boolean {
  return ds.lock[key] === 'open'
}

export function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && HEX_PATTERN.test(value)
}

/** '#280A60' → '40 10 96' (the format of the `--color-*-rgb` CSS variables); null if invalid. */
export function hexToRgbTriplet(hex: string): string | null {
  if (!isValidHex(hex)) return null
  const n = Number.parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio between two `#RRGGBB` colours; null if either is invalid. */
export function contrastRatio(hexA: string, hexB: string): number | null {
  if (!isValidHex(hexA) || !isValidHex(hexB)) return null
  const [light, dark] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

/** Validation message key for a colour list, or null when valid. */
export function colorListProblem(
  colors: readonly { token?: unknown }[],
): { kind: 'missingCore'; tokens: string[] } | { kind: 'duplicate'; tokens: string[] } | null {
  const tokens = colors.map((c) => (typeof c.token === 'string' ? c.token.trim() : ''))
  const duplicates = [...new Set(tokens.filter((t, i) => t && tokens.indexOf(t) !== i))]
  if (duplicates.length) return { kind: 'duplicate', tokens: duplicates }
  const missing = CORE_COLOR_TOKENS.filter((core) => !tokens.includes(core))
  if (missing.length) return { kind: 'missingCore', tokens: missing }
  return null
}

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback

const lockState = (value: unknown): LockState => (value === 'open' ? 'open' : 'locked')

type RawDesignSystem = {
  colors?: ({ token?: string | null; label?: string | null; hex?: string | null } | null)[] | null
  fonts?: Partial<Record<FontRole, string | null>> | null
  radiusCard?: number | null
  spacing?: { sm?: number | null; md?: number | null; lg?: number | null } | null
  lock?: (Partial<Record<LockKey, string | null>> & { contrastCheck?: boolean | null }) | null
} | null

/**
 * Cleans the stored global: invalid rows are dropped, missing core tokens are filled from the
 * Brand Book, unknown fonts fall back to the default of their role, locks default to `locked`.
 */
export function cleanDesignSystem(raw: RawDesignSystem | undefined): CleanDesignSystem {
  const seen = new Set<string>()
  const colors: DesignColor[] = []
  for (const row of raw?.colors ?? []) {
    const token = row?.token?.trim() ?? ''
    if (!TOKEN_PATTERN.test(token) || seen.has(token) || !isValidHex(row?.hex)) continue
    seen.add(token)
    colors.push({ token, label: row?.label?.trim() || token, hex: row.hex.toUpperCase() })
  }
  for (const fallback of DEFAULT_COLORS) {
    if (!seen.has(fallback.token)) colors.push(fallback)
  }

  const fonts = { ...DEFAULT_FONTS }
  for (const role of Object.keys(DEFAULT_FONTS) as FontRole[]) {
    const value = raw?.fonts?.[role]
    if (isDesignFont(value)) fonts[role] = value
  }

  const spacing = DEFAULT_DESIGN_SYSTEM.spacing
  return {
    colors,
    fonts,
    radiusCard: clampNumber(raw?.radiusCard, 0, 48, DEFAULT_DESIGN_SYSTEM.radiusCard),
    spacing: {
      sm: clampNumber(raw?.spacing?.sm, 0, 96, spacing.sm),
      md: clampNumber(raw?.spacing?.md, 0, 96, spacing.md),
      lg: clampNumber(raw?.spacing?.lg, 0, 96, spacing.lg),
    },
    lock: {
      colors: lockState(raw?.lock?.colors),
      fonts: lockState(raw?.lock?.fonts),
      sizes: lockState(raw?.lock?.sizes),
      customCss: lockState(raw?.lock?.customCss),
      contrastCheck: raw?.lock?.contrastCheck !== false,
    },
  }
}
