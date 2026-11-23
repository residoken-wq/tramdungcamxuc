/**
 * Lesson video hosted on Hana's Facebook / TikTok (opened in a new tab, never embedded).
 * Only https links on these hosts are accepted.
 */
export type SocialVideoPlatform = 'facebook' | 'tiktok'

const HOSTS: Record<string, SocialVideoPlatform> = {
  'facebook.com': 'facebook',
  'fb.watch': 'facebook',
  'fb.com': 'facebook',
  'tiktok.com': 'tiktok',
  'vt.tiktok.com': 'tiktok',
  'vm.tiktok.com': 'tiktok',
}

export function parseSocialVideoUrl(
  value: string | null | undefined,
): { url: string; platform: SocialVideoPlatform } | null {
  const raw = value?.trim()
  if (!raw) return null
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:') return null
  const host = parsed.hostname.toLowerCase().replace(/^(www|m|web)\./, '')
  const platform = HOSTS[host]
  if (!platform || parsed.pathname.length <= 1) return null
  return { url: parsed.toString(), platform }
}
