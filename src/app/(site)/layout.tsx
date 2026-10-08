import React, { cache } from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { SiteSetting } from '@/payload-types'
import { anton, montserrat, playfair } from '@/lib/fonts'
import './styles.css'

const getSiteSettings = cache(async (): Promise<SiteSetting | null> => {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const siteSettings = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 1,
    })
    return siteSettings as SiteSetting
  } catch {
    // Graceful fallback when DB is unreachable (e.g. build / unit tests)
    return null
  }
})

export async function generateMetadata(): Promise<Metadata> {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://tramdungcamxuc.com'
  const siteUrl =
    rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')
      ? rawSiteUrl
      : `https://${rawSiteUrl}`

  let ogImageUrl: string | undefined = undefined

  const siteSettings = await getSiteSettings()
  const logo = siteSettings?.logo
  if (typeof logo === 'object' && logo !== null && 'url' in logo && typeof logo.url === 'string') {
    ogImageUrl = logo.url
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: '%s | Trạm Dừng Cảm Xúc',
      default: 'Trạm Dừng Cảm Xúc',
    },
    description: 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
    openGraph: {
      siteName: 'Trạm Dừng Cảm Xúc',
      locale: 'vi_VN',
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await getSiteSettings()
  const plausibleDomain = siteSettings?.analytics?.plausibleDomain?.trim()
  const shouldLoadPlausible = Boolean(plausibleDomain && process.env.SITE_NOINDEX !== 'true')

  return (
    <html lang="vi" className={`${anton.variable} ${montserrat.variable} ${playfair.variable}`}>
      <head>
        {shouldLoadPlausible && plausibleDomain ? (
          <script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" />
        ) : null}
      </head>
      <body className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased">
        {children}
      </body>
    </html>
  )
}
