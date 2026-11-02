import { vi } from '@/lib/i18n/vi'

/**
 * Formats an ISO date string to Vietnam timezone (Asia/Ho_Chi_Minh) in format "DD/MM/YYYY HH:mm".
 * Example: 2026-11-02T07:05:00.000Z -> "02/11/2026 14:05"
 */
export function formatVietnamDateTime(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  if (isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const day = parts.find((p) => p.type === 'day')?.value || '00'
  const month = parts.find((p) => p.type === 'month')?.value || '00'
  const year = parts.find((p) => p.type === 'year')?.value || '0000'
  const hour = parts.find((p) => p.type === 'hour')?.value || '00'
  const minute = parts.find((p) => p.type === 'minute')?.value || '00'

  return `${day}/${month}/${year} ${hour}:${minute}`
}

export type VersionBadgeType = 'published' | 'draft' | 'autosave'

export type VersionBadgeInfo = {
  type: VersionBadgeType
  label: string
  className: string
}

/**
 * Returns badge label and CSS classes from Payload version metadata (_status, autosave).
 */
export function getVersionBadgeInfo(version: {
  status: 'draft' | 'published'
  autosave?: boolean
}): VersionBadgeInfo {
  if (version.autosave) {
    return {
      type: 'autosave',
      label: vi.eb08.statusAutosave,
      className: 'bg-butter-cream text-deep-navy font-semibold',
    }
  }
  if (version.status === 'published') {
    return {
      type: 'published',
      label: vi.eb08.statusPublished,
      className: 'bg-mint-haze text-deep-navy font-bold',
    }
  }
  return {
    type: 'draft',
    label: vi.eb08.statusDraft,
    className: 'bg-soft-pink text-deep-navy font-semibold',
  }
}

