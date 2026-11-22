/**
 * Contact links built from "Cài đặt website → Liên hệ & Zalo" (floating Email / Zalo buttons).
 */

/** Zalo chat link: the CMS link when set, else zalo.me/<phone> from the hotline (VN numbers). */
export function zaloHref(
  zaloChatUrl: string | null | undefined,
  hotline: string | null | undefined,
): string | null {
  const url = zaloChatUrl?.trim()
  if (url && /^https?:\/\//i.test(url)) return url
  let digits = (hotline || '').replace(/[^\d+]/g, '')
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`
  else if (digits.startsWith('84') && digits.length === 11) digits = `0${digits.slice(2)}`
  digits = digits.replace(/\D/g, '')
  return /^0\d{9,10}$/.test(digits) ? `https://zalo.me/${digits}` : null
}

/** `mailto:` link for a valid-looking address, else null. */
export function mailtoHref(email: string | null | undefined): string | null {
  const value = email?.trim()
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null
}
