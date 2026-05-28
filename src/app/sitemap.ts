import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'
import { prisma } from '@/app/utils/db'
import { cityToSlug } from '@/lib/slug'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://uhvati-bus.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await prisma.route.findMany({
    select: {
      from: { select: { name: true } },
      to: { select: { name: true } },
    },
  })

  const routeUrls: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}/rute/${cityToSlug(route.from.name)}/${cityToSlug(route.to.name)}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/o-nama`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/za-firme`, changeFrequency: 'monthly', priority: 0.6 },
    ...routeUrls,
  ]
}
