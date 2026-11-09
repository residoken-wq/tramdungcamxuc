import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import type { SocialLink } from '@/components/site/Footer'
import { SocialIcon, type SocialIconName } from '@/components/brand'
import { vi } from '@/lib/i18n/vi'

export interface SocialLinksProps {
  version?: number
  align?: 'left' | 'center' | 'right'
  socialLinks?: SocialLink[]
}

function inferSocialKey(link: SocialLink): SocialIconName {
  if (link.key) return link.key
  const lower = (link.label || '').toLowerCase()
  if (lower.includes('facebook')) return 'facebook'
  if (lower.includes('tiktok')) return 'tiktok'
  if (lower.includes('youtube')) return 'youtube'
  if (lower.includes('linkedin')) return 'linkedin'
  if (lower.includes('zalo')) return 'zalo'
  if (lower.includes('shopee')) return 'shopee'
  return 'facebook'
}

export const SocialLinksBlock: ComponentConfig<SocialLinksProps> = {
  label: vi.eb10.socialLinksLabel,
  fields: {
    align: {
      type: 'select',
      label: 'Căn lề',
      options: [
        { label: 'Trái', value: 'left' },
        { label: 'Giữa', value: 'center' },
        { label: 'Phải', value: 'right' },
      ],
    },
  },
  defaultProps: {
    version: 1,
    align: 'left',
    socialLinks: [],
  },
  render: ({ align = 'left', socialLinks = [], puck }) => {
    const alignClass =
      align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'

    if (!socialLinks || socialLinks.length === 0) {
      if (puck?.isEditing) {
        return (
          <div className={`flex items-center ${alignClass} w-full`}>
            <p className="text-xs italic text-deep-navy/60 group-data-[footer-bg=deep-navy]/footer:text-soft-pink/70 border border-dashed border-deep-navy/20 group-data-[footer-bg=deep-navy]/footer:border-white/20 rounded-md px-3 py-2">
              {vi.pk32.emptyHint}
            </p>
          </div>
        )
      }
      return <></>
    }

    return (
      <div className={`flex flex-wrap items-center gap-3 ${alignClass} w-full`}>
        {socialLinks.map((link) => {
          const key = inferSocialKey(link)
          return (
            <a
              key={link.key || link.label || link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (${vi.pk32.newTab})`}
              title={link.label}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-deep-navy/15 text-deep-navy hover:text-bright-magenta hover:bg-lavender-mist/40 hover:border-bright-magenta/30 group-data-[footer-bg=deep-navy]/footer:border-white/20 group-data-[footer-bg=deep-navy]/footer:text-soft-pink group-data-[footer-bg=deep-navy]/footer:hover:text-white group-data-[footer-bg=deep-navy]/footer:hover:bg-white/10 group-data-[footer-bg=deep-navy]/footer:hover:border-white/40 transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy group-data-[footer-bg=deep-navy]/footer:focus-visible:outline-white"
            >
              <SocialIcon name={key} className="w-5 h-5" />
            </a>
          )
        })}
      </div>
    )
  },
}
