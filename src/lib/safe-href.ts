/**
 * Validates and sanitizes links used in Puck blocks and UI components.
 *
 * Allowed link formats:
 * - Internal absolute path: starts with "/" (strictly excluding "//" protocol-relative URLs)
 * - Anchor fragment: starts with "#"
 * - Absolute HTTPS URL: starts with "https://"
 * - Absolute HTTP URL: starts with "http://"
 * - Email link: starts with "mailto:"
 * - Phone link: starts with "tel:"
 *
 * Any other scheme (e.g. javascript:, data:, vbscript:) or invalid/empty string returns null.
 */
export function safeHref(href?: string | null): string | null {
  if (!href || typeof href !== 'string') {
    return null
  }

  const trimmed = href.trim()
  if (!trimmed) {
    return null
  }

  // Reject protocol-relative URLs like "//evil.com" and "/\evil.com" (browsers treat "/\" as "//")
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return null
  }

  // Internal paths starting with single '/'
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // In-page hash anchors
  if (trimmed.startsWith('#')) {
    return trimmed
  }

  // Allowed schemes (case-insensitive)
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return trimmed
  }

  return null
}
