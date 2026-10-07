/**
 * Pure helper to safely append UTM parameters to an existing URL without duplicating
 * or overwriting existing UTM parameters.
 */
export interface UtmParams {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

export function appendUtmParams(rawUrl: string, params: UtmParams): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return ''
  }

  const trimmed = rawUrl.trim()
  if (!trimmed || trimmed === '#' || trimmed.startsWith('javascript:')) {
    return trimmed
  }

  try {
    // Separate hash fragment if present
    const hashIndex = trimmed.indexOf('#')
    let baseWithQuery = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed
    const hashPart = hashIndex >= 0 ? trimmed.slice(hashIndex) : ''

    // Determine if URL is absolute or relative
    const isAbsolute =
      /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(baseWithQuery) || baseWithQuery.startsWith('//')
    const dummyBase = 'https://tramdungcamxuc.local'
    const parsed = new URL(baseWithQuery, dummyBase)

    // Append UTM params only if not already present in existing search params
    const utmMapping: Record<keyof UtmParams, string> = {
      source: 'utm_source',
      medium: 'utm_medium',
      campaign: 'utm_campaign',
      term: 'utm_term',
      content: 'utm_content',
    }

    for (const [key, paramName] of Object.entries(utmMapping) as [keyof UtmParams, string][]) {
      const val = params[key]
      if (val && typeof val === 'string' && val.trim() !== '') {
        if (!parsed.searchParams.has(paramName)) {
          parsed.searchParams.set(paramName, val.trim())
        }
      }
    }

    if (isAbsolute) {
      if (baseWithQuery.startsWith('//')) {
        // Protocol-relative URL
        const full = parsed.toString().replace(/^https?:/, '')
        return `${full}${hashPart}`
      }
      return `${parsed.origin}${parsed.pathname}${parsed.search}${hashPart}`
    }

    // Relative URL: preserve relative path + search + hash
    const relativeResult = `${parsed.pathname}${parsed.search}${hashPart}`
    // If the input didn't start with '/', preserve that format
    if (!baseWithQuery.startsWith('/') && relativeResult.startsWith('/')) {
      return relativeResult.slice(1)
    }
    return relativeResult
  } catch {
    return trimmed
  }
}
