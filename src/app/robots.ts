import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/admin/', '/kochbuch/', '/api/'] },
    sitemap: 'https://koch-welt.vercel.app/sitemap.xml',
  }
}
