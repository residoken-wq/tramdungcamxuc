import 'server-only'

export const DEFAULT_SITE_URL = 'https://tramdungcamxuc.com'

/**
 * Returns the canonical base URL for the site without trailing slash.
 * Read at runtime on the server to avoid baking in build-time URLs (e.g. Docker demo deployments).
 *
 * Precedence:
 * 1. process.env.SITE_URL (runtime override, e.g. http://IP-SERVER:3400)
 * 2. process.env.NEXT_PUBLIC_SITE_URL (legacy / build-time fallback)
 * 3. https://tramdungcamxuc.com
 */
export function getSiteUrl(): string {
  const rawCandidate =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL

  const withProtocol =
    rawCandidate.startsWith('http://') || rawCandidate.startsWith('https://')
      ? rawCandidate
      : `https://${rawCandidate}`

  return withProtocol.replace(/\/+$/, '')
}
