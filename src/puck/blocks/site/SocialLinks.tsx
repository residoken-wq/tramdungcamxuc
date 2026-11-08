import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import type { SocialLink } from '@/components/site/Footer'
import { vi } from '@/lib/i18n/vi'

export interface SocialLinksProps {
  version?: number
  align?: 'left' | 'center' | 'right'
  socialLinks?: SocialLink[]
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

    const sampleSocials: SocialLink[] =
      puck?.isEditing && socialLinks.length === 0
        ? [
            { label: 'LinkedIn', href: 'https://linkedin.com' },
            { label: 'Zalo Group', href: 'https://zalo.me' },
            { label: 'Shopee', href: 'https://shopee.vn' },
          ]
        : socialLinks

    if (sampleSocials.length === 0) {
      return <></>
    }

    return (
      <div className={`flex flex-wrap items-center gap-3 ${alignClass} w-full`}>
        {sampleSocials.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-deep-navy/15 text-xs font-ui font-semibold text-deep-navy hover:bg-lavender-mist/40 hover:text-bright-magenta group-data-[footer-bg=deep-navy]/footer:border-white/20 group-data-[footer-bg=deep-navy]/footer:text-soft-pink group-data-[footer-bg=deep-navy]/footer:hover:text-white group-data-[footer-bg=deep-navy]/footer:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy group-data-[footer-bg=deep-navy]/footer:focus-visible:outline-white"
          >
            {link.label}
          </a>
        ))}
      </div>
    )
  },
}
