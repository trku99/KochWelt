import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: {
    difficulty?: string
    prepTime?: string
    sort?: string
    page?: string
  }
}

const sortMap: Record<string, { column: string; dir: 'asc' | 'desc' }> = {
  neueste: { column: 'created_at', dir: 'desc' },
  beliebteste: { column: 'view_count', dir: 'desc' },
  schnellste: { column: 'prep_time_minutes', dir: 'asc' },
}

const PER_PAGE = 12

const difficulties = [
  { value: null, label: 'Alle' },
  { value: 'Einfach', label: 'Einfach' },
  { value: 'Mittel', label: 'Mittel' },
  { value: 'Schwer', label: 'Schwer' },
]

const prepTimes = [
  { value: null, label: 'Alle' },
  { value: '30', label: 'Unter 30 Min.' },
  { value: '60', label: 'Unter 60 Min.' },
]

const sortOptions = [
  { value: 'neueste', label: 'Neueste' },
  { value: 'beliebteste', label: 'Beliebteste' },
  { value: 'schnellste', label: 'Schnellste' },
]

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', params.slug)
    .single()

  if (!data) {
    return { title: 'Kategorie nicht gefunden – KochWelt' }
  }

  return {
    title: `${data.name} Rezepte – KochWelt`,
    description: data.description ?? `${data.name} Rezepte entdecken.`,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabaseClient()

  const sp = await Promise.resolve(searchParams)
  const difficulty = sp.difficulty ?? null
  const prepTime = sp.prepTime ?? null
  const sort = sp.sort ?? 'neueste'
  const page = Math.max(1, Number(sp.page) || 1)

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!category) notFound()

  let query = supabase
    .from('recipes')
    .select(
      `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
       author:profiles!author_id(id, username, display_name, avatar_url),
       category:categories!category_id(id, name, slug, icon)`,
      { count: 'exact' }
    )
    .eq('is_published', true)
    .eq('category_id', category.id)

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

  const basePath = `/kategorien/${params.slug}`

  const buildFilterUrl = (key: string, value: string | null) => {
    const p = new URLSearchParams()
    if (difficulty && key !== 'difficulty') p.set('difficulty', difficulty)
    if (prepTime && key !== 'prepTime') p.set('prepTime', prepTime)
    if (sort !== 'neueste' && key !== 'sort') p.set('sort', sort)
    if (value !== null && value !== 'neueste') p.set(key, value)
    return `${basePath}?${p.toString()}`
  }

  const buildPageUrl = (p: number) => {
    const pp = new URLSearchParams()
    if (difficulty) pp.set('difficulty', difficulty)
    if (prepTime) pp.set('prepTime', prepTime)
    if (sort !== 'neueste') pp.set('sort', sort)
    pp.set('page', String(p))
    return `${basePath}?${pp.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-5xl">{category.icon}</span>
        <div>
          <h1 className="section-title">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Schwierigkeit
          </h4>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <Link
                key={d.label}
                href={buildFilterUrl('difficulty', d.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  difficulty === d.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                )}
              >
                {d.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Zubereitungszeit
          </h4>
          <div className="flex flex-wrap gap-2">
            {prepTimes.map((t) => (
              <Link
                key={t.label}
                href={buildFilterUrl('prepTime', t.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  prepTime === t.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                )}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Sortieren
          </h4>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((o) => (
              <Link
                key={o.value}
                href={buildFilterUrl('sort', o.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  sort === o.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                )}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

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
              Versuche die Filter anzupassen.
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
