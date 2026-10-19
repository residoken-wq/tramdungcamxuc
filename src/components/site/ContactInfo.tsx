'use client'

import React from 'react'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'

export interface PublicContactInfo {
  email?: string | null
  hotline?: string | null
  officeAddress?: string | null
  linkedInUrl?: string | null
  facebookUrl?: string | null
  youtubeUrl?: string | null
  zaloChatUrl?: string | null
}

export interface ContactInfoProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  showEmail?: boolean
  showHotline?: boolean
  showOfficeAddress?: boolean
  showSocial?: boolean
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    contact?: PublicContactInfo | null
  }
  puck?: {
    isEditing?: boolean
  }
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function ContactInfo({
  seriesLabel = vi.sm06.contactInfo.defaultSeriesLabel,
  titleLine1 = vi.sm06.contactInfo.defaultTitleLine1,
  titleLine2 = vi.sm06.contactInfo.defaultTitleLine2,
  emotionLine = vi.sm06.contactInfo.defaultEmotionLine,
  showEmail = true,
  showHotline = true,
  showOfficeAddress = true,
  showSocial = true,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: ContactInfoProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const isEditing = puck?.isEditing ?? false
  const contact = _resolved?.contact

  const email = typeof contact?.email === 'string' && contact.email.trim() ? contact.email.trim() : null
  const hotline =
    typeof contact?.hotline === 'string' && contact.hotline.trim() ? contact.hotline.trim() : null
  const officeAddress =
    typeof contact?.officeAddress === 'string' && contact.officeAddress.trim()
      ? contact.officeAddress.trim()
      : null
  const linkedInUrl =
    typeof contact?.linkedInUrl === 'string' && contact.linkedInUrl.trim()
      ? contact.linkedInUrl.trim()
      : null
  const facebookUrl =
    typeof contact?.facebookUrl === 'string' && contact.facebookUrl.trim()
      ? contact.facebookUrl.trim()
      : null
  const youtubeUrl =
    typeof contact?.youtubeUrl === 'string' && contact.youtubeUrl.trim()
      ? contact.youtubeUrl.trim()
      : null
  const zaloChatUrl =
    typeof contact?.zaloChatUrl === 'string' && contact.zaloChatUrl.trim()
      ? contact.zaloChatUrl.trim()
      : null

  const hasEmail = Boolean(showEmail && email)
  const hasHotline = Boolean(showHotline && hotline)
  const hasOfficeAddress = Boolean(showOfficeAddress && officeAddress)
  const hasSocial = Boolean(
    showSocial && (linkedInUrl || facebookUrl || youtubeUrl || zaloChatUrl),
  )

  const activeCount = [hasEmail, hasHotline, hasOfficeAddress, hasSocial].filter(Boolean).length

  if (activeCount === 0) {
    if (isEditing) {
      return (
        <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]}`}>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-card border border-dashed border-bright-magenta/40 bg-white/80 p-8 text-center shadow-soft">
              <p className="font-ui text-sm font-bold text-bright-magenta">
                {vi.sm06.contactInfo.editorEmpty}
              </p>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  // Sanitize hotline for tel: protocol (keep only digits and leading +)
  const sanitizedTel = hotline ? hotline.replace(/[^0-9+]/g, '') : ''
  const emailHref = email ? safeHref(`mailto:${email}`) : null
  const telHref = sanitizedTel ? safeHref(`tel:${sanitizedTel}`) : null
  const zaloHref = zaloChatUrl ? safeHref(zaloChatUrl) : null
  const linkedInHref = linkedInUrl ? safeHref(linkedInUrl) : null
  const facebookHref = facebookUrl ? safeHref(facebookUrl) : null
  const youtubeHref = youtubeUrl ? safeHref(youtubeUrl) : null

  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const emotionColorClass = isDeepNavy ? 'text-white/80' : 'text-deep-navy/80'
  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white shadow-soft'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  const iconContainerClass = isDeepNavy
    ? 'bg-white/15 text-soft-pink'
    : 'bg-soft-pink text-bright-magenta'
  const textMutedClass = isDeepNavy ? 'text-white/70' : 'text-deep-navy/70'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Signature Two-Tone Heading */}
        {(titleLine1 || seriesLabel || emotionLine) && (
          <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
            {seriesLabel && (
              <span
                className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            {(titleLine1 || titleLine2) && (
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15]">
                <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
                <span className={titleLine2ColorClass}>{titleLine2}</span>
              </h2>
            )}

            {emotionLine && (
              <p
                className={`mt-4 font-quote text-base sm:text-lg italic leading-relaxed max-w-2xl ${emotionColorClass}`}
              >
                {emotionLine}
              </p>
            )}
          </div>
        )}

        {/* Contact Cards Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            activeCount >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
          } gap-6 sm:gap-8 items-stretch`}
        >
          {/* Email Card */}
          {hasEmail && email && (
            <div
              className={`rounded-card p-6 sm:p-8 border flex flex-col justify-between ${cardBgClass} transition-transform hover:-translate-y-1 duration-200`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconContainerClass}`}
                  aria-hidden="true"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h3 className="font-ui text-xs font-bold uppercase tracking-wider mb-2 text-bright-magenta">
                  {vi.sm06.contactInfo.emailLabel}
                </h3>
                <p className={`font-ui text-xs sm:text-sm mb-4 leading-relaxed ${textMutedClass}`}>
                  Gửi thư cho Trạm để trao đổi chi tiết về kế hoạch hoặc băn khoăn của bạn.
                </p>
              </div>
              <div className="pt-2">
                {emailHref ? (
                  <a
                    href={emailHref}
                    className="inline-flex items-center min-h-[44px] font-ui text-base font-bold text-accent-pink hover:text-bright-magenta underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md transition-colors"
                  >
                    {email}
                  </a>
                ) : (
                  <span className="font-ui text-base font-bold">{email}</span>
                )}
              </div>
            </div>
          )}

          {/* Hotline / Zalo Card */}
          {hasHotline && hotline && (
            <div
              className={`rounded-card p-6 sm:p-8 border flex flex-col justify-between ${cardBgClass} transition-transform hover:-translate-y-1 duration-200`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconContainerClass}`}
                  aria-hidden="true"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3 className="font-ui text-xs font-bold uppercase tracking-wider mb-2 text-bright-magenta">
                  {vi.sm06.contactInfo.hotlineLabel}
                </h3>
                <p className={`font-ui text-xs sm:text-sm mb-4 leading-relaxed ${textMutedClass}`}>
                  Hỗ trợ nhanh qua điện thoại hoặc trò chuyện trực tiếp qua Zalo.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {telHref ? (
                  <a
                    href={telHref}
                    className="inline-flex items-center min-h-[44px] font-ui text-base font-bold text-accent-pink hover:text-bright-magenta underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md transition-colors"
                  >
                    {hotline}
                  </a>
                ) : (
                  <span className="font-ui text-base font-bold">{hotline}</span>
                )}
                {zaloHref && (
                  <a
                    href={zaloHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-[44px] px-3.5 py-1.5 rounded-full font-ui text-xs font-bold bg-soft-pink text-deep-navy hover:bg-bright-magenta hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink"
                  >
                    {vi.sm06.contactInfo.zaloChatButton} &rarr;
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Office Address Card */}
          {hasOfficeAddress && officeAddress && (
            <div
              className={`rounded-card p-6 sm:p-8 border flex flex-col justify-between ${cardBgClass} transition-transform hover:-translate-y-1 duration-200`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconContainerClass}`}
                  aria-hidden="true"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="font-ui text-xs font-bold uppercase tracking-wider mb-2 text-bright-magenta">
                  {vi.sm06.contactInfo.officeAddressLabel}
                </h3>
                <p className={`font-ui text-xs sm:text-sm mb-4 leading-relaxed ${textMutedClass}`}>
                  Địa điểm hoạt động và không gian tổ chức các buổi gặp gỡ trực tiếp.
                </p>
              </div>
              <div className="pt-2">
                <p className="font-ui text-base font-bold leading-normal">{officeAddress}</p>
              </div>
            </div>
          )}

          {/* Social Links Card */}
          {hasSocial && (
            <div
              className={`rounded-card p-6 sm:p-8 border flex flex-col justify-between ${cardBgClass} transition-transform hover:-translate-y-1 duration-200`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconContainerClass}`}
                  aria-hidden="true"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="m8.59 13.51 6.83 3.98" />
                    <path d="m15.41 6.51-6.82 3.98" />
                  </svg>
                </div>
                <h3 className="font-ui text-xs font-bold uppercase tracking-wider mb-2 text-bright-magenta">
                  {vi.sm06.contactInfo.socialLabel}
                </h3>
                <p className={`font-ui text-xs sm:text-sm mb-4 leading-relaxed ${textMutedClass}`}>
                  Theo dõi các bài viết chia sẻ, video và hoạt động cộng đồng của Trạm.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {linkedInHref && (
                  <a
                    href={linkedInHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={vi.sm06.contactInfo.linkedInLabel}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-lavender-mist/50 text-deep-navy hover:bg-bright-magenta hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                )}

                {facebookHref && (
                  <a
                    href={facebookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={vi.sm06.contactInfo.facebookLabel}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-lavender-mist/50 text-deep-navy hover:bg-bright-magenta hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}

                {youtubeHref && (
                  <a
                    href={youtubeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={vi.sm06.contactInfo.youtubeLabel}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-lavender-mist/50 text-deep-navy hover:bg-bright-magenta hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
                    </svg>
                  </a>
                )}

                {zaloHref && (
                  <a
                    href={zaloHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={vi.sm06.contactInfo.zaloChatLabel}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-lavender-mist/50 text-deep-navy hover:bg-bright-magenta hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
