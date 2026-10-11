/**
 * Validates and sanitizes a post-login redirect path.
 * Disallows absolute URLs, scheme traversal, protocol-relative paths, and open redirects.
 */
export function getSafeRedirectUrl(nextUrl?: string | null): string {
  if (!nextUrl || typeof nextUrl !== 'string') return '/tai-khoan'
  const trimmed = nextUrl.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/tai-khoan'
  }
  const withoutLeadingSlash = trimmed.slice(1)
  const slashIdx = withoutLeadingSlash.indexOf('/')
  const colonIdx = withoutLeadingSlash.indexOf(':')
  if (colonIdx !== -1 && (slashIdx === -1 || colonIdx < slashIdx)) {
    return '/tai-khoan'
  }
  return trimmed
}
