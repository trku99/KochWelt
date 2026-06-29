import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://koch-welt.vercel.app'
  const supabase = createServerSupabaseClient()

  const [{ data: recipes }, { data: categories }] = await Promise.all([
    supabase.from('recipes').select('slug, updated_at').eq('is_published', true),
    supabase.from('categories').select('slug'),
  ])

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseUrl}/rezepte`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/registrieren`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/suche`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
  ]

  const recipePages = (recipes ?? []).map(r => ({
    url: `${baseUrl}/rezepte/${r.slug}`,
    lastModified: new Date(r.updated_at || Date.now()),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const categoryPages = (categories ?? []).map(c => ({
    url: `${baseUrl}/kategorien/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...recipePages, ...categoryPages]
}
