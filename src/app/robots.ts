import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.SITE_NOINDEX === 'true'
        ? { userAgent: '*', disallow: '/' }
        : { userAgent: '*', allow: '/' },
  }
}
