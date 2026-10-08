import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { anton, montserrat, playfair } from '@/lib/fonts'
import './styles.css'

export async function generateMetadata(): Promise<Metadata> {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://tramdungcamxuc.com'
  const siteUrl =
    rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')
      ? rawSiteUrl
      : `https://${rawSiteUrl}`

  let ogImageUrl: string | undefined = undefined

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const siteSettings = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 1,
    })
    const logo = siteSettings?.logo
    if (
      typeof logo === 'object' &&
      logo !== null &&
      'url' in logo &&
      typeof logo.url === 'string'
    ) {
      ogImageUrl = logo.url
    }
  } catch {
    // Graceful fallback when DB is unreachable (e.g. build / unit tests)
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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${anton.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased">
        {children}
      </body>
    </html>
  )
}
