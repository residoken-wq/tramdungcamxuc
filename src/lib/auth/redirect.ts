/**
 * REVIEW-REQUIRED: Validates and sanitizes post-login redirect path.
 * Disallows absolute URLs, scheme traversal, protocol-relative paths,
 * control characters (< 0x20, 0x7F), encoded slashes/backslashes, and open redirects.
 */
export function getSafeRedirectUrl(nextUrl?: string | null): string {
  if (!nextUrl || typeof nextUrl !== 'string') return '/tai-khoan'
  const trimmed = nextUrl.trim()

  // Must start with '/' and not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/tai-khoan'
  }

  // Reject ASCII control characters (< 0x20 or 0x7F) in raw string
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) {
      return '/tai-khoan'
    }
  }

  // Check URL-decoded version for encoded control chars or traversal bypasses (%09, %0a, %0d, %5c, %2f, etc.)
  let decoded: string
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    return '/tai-khoan'
  }

  // Check decoded string for control chars or dangerous sequences
  for (let i = 0; i < decoded.length; i++) {
    const code = decoded.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) {
      return '/tai-khoan'
    }
  }

  if (decoded.includes('\\') || decoded.startsWith('//') || decoded.startsWith('/\\')) {
    return '/tai-khoan'
  }

  // Ensure parsing with base origin strictly stays on the same origin and starts with '/'
  try {
    const parsed = new URL(trimmed, 'https://dummy.local')
    if (parsed.origin !== 'https://dummy.local' || !parsed.pathname.startsWith('/')) {
      return '/tai-khoan'
    }
    const parsedDecoded = new URL(decoded, 'https://dummy.local')
    if (parsedDecoded.origin !== 'https://dummy.local' || !parsedDecoded.pathname.startsWith('/')) {
      return '/tai-khoan'
    }
  } catch {
    return '/tai-khoan'
  }

  // Reject scheme-relative or protocol syntax before first slash
  const withoutLeadingSlash = trimmed.slice(1)
  const slashIdx = withoutLeadingSlash.indexOf('/')
  const colonIdx = withoutLeadingSlash.indexOf(':')
  if (colonIdx !== -1 && (slashIdx === -1 || colonIdx < slashIdx)) {
    return '/tai-khoan'
  }

  return trimmed
}
