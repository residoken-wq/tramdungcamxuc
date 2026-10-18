/**
 * Public SiteSettings DTO and pure extraction function.
 *
 * Anti-data-leak rule (AGENTS.md §8.1 & T1-03 spec):
 * - Strictly extracts ONLY public social and external links (shopeeStoreUrl, zaloChatUrl, zaloGroupUrl).
 * - NEVER leaks internal banking fields (bankBin, bankName, accountNumber, accountName, transferPrefix).
 * - NEVER leaks admin notification emails, internal tokens, or seller sensitive data.
 */
export interface PublicSiteSettings {
  shopeeStoreUrl: string | null
  zaloChatUrl: string | null
  zaloGroupUrl: string | null
}

export function toPublicSiteSettings(doc: unknown): PublicSiteSettings {
  if (!doc || typeof doc !== 'object') {
    return {
      shopeeStoreUrl: null,
      zaloChatUrl: null,
      zaloGroupUrl: null,
    }
  }

  const s = doc as Record<string, unknown>

  const shopeeStoreUrl =
    typeof s.shopeeStoreUrl === 'string' && s.shopeeStoreUrl.trim().length > 0
      ? s.shopeeStoreUrl.trim()
      : null

  const zaloChatUrl =
    typeof s.zaloChatUrl === 'string' && s.zaloChatUrl.trim().length > 0
      ? s.zaloChatUrl.trim()
      : null

  const zaloGroupUrl =
    typeof s.zaloGroupUrl === 'string' && s.zaloGroupUrl.trim().length > 0
      ? s.zaloGroupUrl.trim()
      : null

  return {
    shopeeStoreUrl,
    zaloChatUrl,
    zaloGroupUrl,
  }
}
