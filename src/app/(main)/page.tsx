import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import type { Category } from '@/types/database'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'KochWelt – Die besten Rezepte aus der Schweiz',
  description:
    'Von der Schweiz für dich – traditionell, modern, einfach lecker.',
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient()

  const [featuredResult, trendingResult, categoriesResult] = await Promise.all([
    supabase
      .from('recipes')
      .select(
        `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
         author:profiles!author_id(id, username, display_name, avatar_url),
         category:categories!category_id(id, name, slug, icon)`
      )
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(6),
    supabase
      .from('recipes')
      .select(
        `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
         author:profiles!author_id(id, username, display_name, avatar_url),
         category:categories!category_id(id, name, slug, icon)`
      )
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(3),
    supabase.from('categories').select('*').order('name'),
  ])

  const featuredRecipes = (featuredResult.data ?? []) as unknown as RecipeCardData[]
  const trendingRecipes = (trendingResult.data ?? []) as unknown as RecipeCardData[]
  const categories = (categoriesResult.data ?? []) as Category[]

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary via-primary-700 to-secondary text-white">
        <div className="max-w-5xl mx-auto px-4 py-24 md:py-36 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-4 text-balance">
            Entdecke die besten Rezepte
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Von der Schweiz für dich – traditionell, modern, einfach lecker.
          </p>
          <form action="/suche" method="GET" className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                name="q"
                placeholder="Durchstöbere tausende Rezepte…"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="section-title mb-8">Beliebte Rezepte</h2>
        {featuredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Noch keine Rezepte vorhanden.</p>
        )}
      </section>

      {categories.length > 0 && (
        <section className="bg-brand-light py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="section-title mb-8">Kategorien</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/kategorien/${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all shrink-0 min-w-[120px]"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {trendingRecipes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="section-title mb-8">Im Trend</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingRecipes.map((recipe) => (
              <div key={recipe.id} className="relative">
                <div className="absolute -top-2 -left-2 z-10 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-warm">
                  Trend
                </div>
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gradient-to-r from-primary-100 via-secondary-50 to-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link
            href="/suche?q=Sommer"
            className="inline-flex items-center gap-3 text-2xl md:text-3xl font-serif font-bold text-primary hover:text-primary-600 transition-colors"
          >
            Sommerliche Rezepte entdecken
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
