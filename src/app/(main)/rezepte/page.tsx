import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import FilterStateWrapper from '@/components/FilterStateWrapper'
import type { Category } from '@/types/database'

export const metadata: Metadata = {
  title: 'Alle Rezepte – KochWelt',
  description:
    'Durchstöbere alle Rezepte – filtere nach Kategorie, Schwierigkeit und Zubereitungszeit.',
}

interface SearchParams {
  category?: string
  difficulty?: string
  prepTime?: string
  sort?: string
  page?: string
}

const sortMap: Record<string, { column: string; dir: 'asc' | 'desc' }> = {
  neueste: { column: 'created_at', dir: 'desc' },
  beliebteste: { column: 'view_count', dir: 'desc' },
  schnellste: { column: 'prep_time_minutes', dir: 'asc' },
}

const PER_PAGE = 12

export default async function RezeptePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabaseClient()

  const sp = await Promise.resolve(searchParams)
  const categorySlug = sp.category ?? null
  const difficulty = sp.difficulty ?? null
  const prepTime = sp.prepTime ?? null
  const sort = sp.sort ?? 'neueste'
  const page = Math.max(1, Number(sp.page) || 1)

  const [categoriesResult, allCatsResult] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('categories').select('id, slug'),
  ])

  const allCategories = (categoriesResult.data ?? []) as Category[]

  let categoryId: number | null = null
  if (categorySlug) {
    const match = (allCatsResult.data ?? []).find(
      (c: { id: number; slug: string }) => c.slug === categorySlug
    )
    if (match) categoryId = match.id
  }

  let query = supabase
    .from('recipes')
    .select(
      `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
       author:profiles!author_id(id, username, display_name, avatar_url),
       category:categories!category_id(id, name, slug, icon)`,
      { count: 'exact' }
    )
    .eq('is_published', true)

  if (categoryId) query = query.eq('category_id', categoryId)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (prepTime === '30') query = query.lte('prep_time_minutes', 30)
  else if (prepTime === '60') query = query.lte('prep_time_minutes', 60)

  const sortConfig = sortMap[sort] ?? sortMap.neueste
  query = query.order(sortConfig.column, { ascending: sortConfig.dir === 'asc' })

  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1
  query = query.range(from, to)

  const { data: recipes, count } = await query
  const recipeList = (recipes ?? []) as unknown as RecipeCardData[]
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  const filterCategories = allCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
  }))

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (categorySlug) sp.set('category', categorySlug)
    if (difficulty) sp.set('difficulty', difficulty)
    if (prepTime) sp.set('prepTime', prepTime)
    if (sort !== 'neueste') sp.set('sort', sort)
    sp.set('page', String(p))
    return `/rezepte?${sp.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="section-title mb-8">Alle Rezepte</h1>

      <FilterStateWrapper
        categories={filterCategories}
        basePath="/rezepte"
        selectedCategory={categorySlug}
        selectedDifficulty={difficulty}
        selectedSort={sort}
        selectedPrepTime={prepTime}
      />

      <div className="mt-10">
        {recipeList.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {totalCount} Rezept{totalCount !== 1 ? 'e' : ''} gefunden
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipeList.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-gray-600">
              Keine Rezepte gefunden
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Versuche die Filter anzupassen oder
              sieh dir{' '}
              <Link href="/rezepte" className="text-primary hover:underline">
                alle Rezepte
              </Link>{' '}
              an.
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 mt-12" aria-label="Seitennavigation">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Zurück
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-300 cursor-default">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Zurück
            </span>
          )}

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildPageUrl(p)}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {p}
              </Link>
            ))}
          </div>

          {page < totalPages ? (
            <Link
              href={buildPageUrl(page + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              Weiter
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-300 cursor-default">
              Weiter
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
