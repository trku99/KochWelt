'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, clearAuthCookie } from '@/lib/supabase/client'

import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types/database'
interface RecipeListItem {
  id: number
  title: string
  slug: string
  image_url: string | null
  difficulty: Difficulty
  is_published: boolean
  view_count: number
  avg_rating: number | null
  rating_count: number | null
  created_at: string
  category: { id: number; name: string; slug: string; icon: string } | null
}

const difficultyColors: Record<Difficulty, string> = {
  Einfach: 'bg-green-100 text-green-700',
  Mittel: 'bg-yellow-100 text-yellow-700',
  Schwer: 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [publishedCount, setPublishedCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [countResult, statsResult, recipesResult] = await Promise.all([
        supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)
          .eq('is_published', true),
        supabase
          .from('recipes')
          .select('view_count, avg_rating')
          .eq('author_id', user.id)
          .eq('is_published', true),
        supabase
          .from('recipes')
          .select(`
            id, title, slug, image_url, difficulty, is_published,
            view_count, avg_rating, rating_count, created_at,
            category:categories!category_id(id, name, slug, icon)
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      setPublishedCount(countResult.count ?? 0)

      const stats = statsResult.data ?? []
      setTotalViews(stats.reduce((sum: number, r: { view_count: number | null }) => sum + (r.view_count ?? 0), 0))
      const rated = stats.filter((r: { avg_rating: number | null }) => r.avg_rating !== null)
      setAvgRating(
        rated.length > 0
          ? rated.reduce((sum: number, r: { avg_rating: number | null }) => sum + (r.avg_rating ?? 0), 0) / rated.length
          : null
      )

      setRecipes((recipesResult.data ?? []) as unknown as RecipeListItem[])
      setLoading(false)
    }
    init()
  }, [router])

  const togglePublish = useCallback(
    async (recipeId: number, current: boolean) => {
      const supabase = createClient()
      await supabase
        .from('recipes')
        .update({ is_published: !current })
        .eq('id', recipeId)

      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, is_published: !current } : r))
      )

      if (current) {
        setPublishedCount((p) => Math.max(0, p - 1))
      } else {
        setPublishedCount((p) => p + 1)
      }
    },
    []
  )

  const handleDelete = useCallback(
    async (recipeId: number) => {
      if (!window.confirm('Bist du sicher, dass du dieses Rezept löschen möchtest?')) return
      setDeletingId(recipeId)
      const supabase = createClient()
      await supabase.from('recipes').delete().eq('id', recipeId)
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId))
      setDeletingId(null)
    },
    []
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filteredRecipes = recipes.filter((r) =>
    activeTab === 'published' ? r.is_published : !r.is_published
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-brand-dark mb-8">
          Mein KochWelt
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <p className="text-sm text-gray-500 mb-1">Veröffentlichte Rezepte</p>
            <p className="text-3xl font-bold text-brand-dark">{publishedCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <p className="text-sm text-gray-500 mb-1">Aufrufe</p>
            <p className="text-3xl font-bold text-brand-dark">{totalViews}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <p className="text-sm text-gray-500 mb-1">Durchschnittsbewertung</p>
            <p className="text-3xl font-bold text-brand-dark">
              {avgRating !== null ? avgRating.toFixed(1) : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/dashboard/rezept-erstellen"
            className="inline-flex items-center gap-2 bg-primary text-white font-medium px-5 py-2.5 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Neues Rezept
          </Link>
          <Link
            href="/kochbuch"
            className="inline-flex items-center gap-2 bg-white text-gray-700 font-medium px-5 py-2.5 rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Mein Kochbuch
          </Link>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('published')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === 'published'
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Veröffentlicht
            {activeTab === 'published' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === 'drafts'
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Entwürfe
            {activeTab === 'drafts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === 'published'
                ? 'Du hast noch keine Rezepte veröffentlicht.'
                : 'Du hast keine Entwürfe.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {recipe.image_url ? (
                    <Image
                      src={recipe.image_url}
                      alt={recipe.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 via-secondary-100 to-primary-50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-brand-dark truncate">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        difficultyColors[recipe.difficulty]
                      )}
                    >
                      {recipe.difficulty}
                    </span>
                    {recipe.is_published ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Veröffentlicht
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Entwurf
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{recipe.view_count} Aufrufe</span>
                    {recipe.avg_rating !== null && (
                      <span>
                        {recipe.avg_rating.toFixed(1)} ({recipe.rating_count})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/dashboard/rezept-erstellen?id=${recipe.id}`}
                    className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary-50 transition-colors"
                    aria-label="Bearbeiten"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>

                  <button
                    onClick={() => togglePublish(recipe.id, recipe.is_published)}
                    className="p-2 rounded-lg text-gray-500 hover:text-secondary hover:bg-secondary-50 transition-colors"
                    aria-label={recipe.is_published ? 'Als Entwurf speichern' : 'Veröffentlichen'}
                  >
                    {recipe.is_published ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(recipe.id)}
                    disabled={deletingId === recipe.id}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label="Löschen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
