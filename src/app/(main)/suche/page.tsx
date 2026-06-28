'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import RecipeCard, { type RecipeCardData, RecipeCardSkeleton } from '@/components/RecipeCard'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [results, setResults] = useState<RecipeCardData[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabaseRef = useRef(createClient())
  const fetchRef = useRef<(term: string) => Promise<void>>()

  fetchRef.current = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    const supabase = supabaseRef.current
    const { data: textSearchData } = await supabase
      .from('recipes')
      .select(
        `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
         author:profiles!author_id(id, username, display_name, avatar_url),
         category:categories!category_id(id, name, slug, icon)`
      )
      .eq('is_published', true)
      .textSearch('search_vector', searchTerm, { config: 'german' })
      .limit(20)

    if (textSearchData && textSearchData.length > 0) {
      setResults(textSearchData as unknown as RecipeCardData[])
      setLoading(false)
      return
    }

    const { data: ilikeData } = await supabase
      .from('recipes')
      .select(
        `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
         author:profiles!author_id(id, username, display_name, avatar_url),
         category:categories!category_id(id, name, slug, icon)`
      )
      .eq('is_published', true)
      .ilike('title', `%${searchTerm}%`)
      .limit(20)

    setResults((ilikeData ?? []) as unknown as RecipeCardData[])
    setLoading(false)
  }

  useEffect(() => {
    if (initialQuery && fetchRef.current) {
      fetchRef.current(initialQuery)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      setQuery(inputValue)
      fetchRef.current?.(inputValue)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue])

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary via-primary-700 to-secondary pb-12">
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-serif font-bold text-white">
              Koch<span className="text-secondary">Welt</span>
            </span>
          </Link>

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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Durchstöbere tausende Rezepte…"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-serif font-bold text-brand-dark mb-2">
              Keine Rezepte gefunden für &quot;{query}&quot;
            </p>
            <p className="text-gray-500 mb-8">
              Versuche es mit anderen Suchbegriffen oder durchstöbere unsere Kategorien.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/kategorien"
                className="bg-white text-gray-700 font-medium px-5 py-2.5 rounded-lg shadow-card hover:shadow-card-hover transition-all"
              >
                Kategorien durchsuchen
              </Link>
              <Link
                href="/rezepte"
                className="bg-primary text-white font-medium px-5 py-2.5 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Alle Rezepte
              </Link>
            </div>
          </div>
        ) : (
          <>
            {hasSearched && (
              <p className="text-sm text-gray-500 mb-6">
                {results.length} {results.length === 1 ? 'Rezept' : 'Rezepte'} gefunden
                {query && <> für &quot;{query}&quot;</>}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-br from-primary via-primary-700 to-secondary pb-12">
            <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
              <span className="text-2xl font-serif font-bold text-white">
                Koch<span className="text-secondary">Welt</span>
              </span>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <RecipeCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
