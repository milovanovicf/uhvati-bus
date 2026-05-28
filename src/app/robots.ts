import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://uhvati-bus.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/company', '/api/', '/verify-email'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
