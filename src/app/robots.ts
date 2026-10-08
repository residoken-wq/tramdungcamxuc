import type { MetadataRoute } from 'next'
import { getBaseSiteUrl } from '@/app/sitemap'

export const dynamic = 'force-dynamic'

export const DISALLOWED_ROBOTS_PATHS = [
  '/admin',
  '/builder',
  '/api',
  '/styleguide',
  '/tai-khoan',
] as const

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_NOINDEX === 'true') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  const siteUrl = getBaseSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOWED_ROBOTS_PATHS],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
