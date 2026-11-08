export interface ParsedStatValue {
  prefix: string
  number: number
  suffix: string
  separator: '.' | ',' | ''
}

/**
 * PK-29 FX-09: Parses a stat string like '10+', '500+', '1.000+', '39%', '3X', '$100'.
 * Returns null if the value is not a numeric stat (e.g. 'Hàng ngàn giờ', 'ICF ACC').
 */
export function parseStatValue(raw?: string): ParsedStatValue | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Match optional prefix, the numeric part with optional thousands separators, and suffix
  // e.g. "10+", "500+", "1.000+", "39%", "3X"
  const match = trimmed.match(/^([^\d]*?)(\d{1,3}(?:[.,]\d{3})+|\d+)(.*)$/)
  if (!match) return null

  const [, prefix, numPart, suffix] = match
  // If prefix is long words (e.g. "Hàng ngàn 10"), it's not a stat counter
  if (prefix.length > 3) return null

  let separator: '.' | ',' | '' = ''
  let cleanNum = numPart
  if (numPart.includes('.')) {
    separator = '.'
    cleanNum = numPart.replace(/\./g, '')
  } else if (numPart.includes(',')) {
    separator = ','
    cleanNum = numPart.replace(/,/g, '')
  }

  const number = Number(cleanNum)
  if (isNaN(number)) return null

  return {
    prefix,
    number,
    suffix,
    separator,
  }
}

export function formatStatNumber(num: number, separator: '.' | ',' | ''): string {
  const rounded = Math.round(num)
  if (!separator) return String(rounded)
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

