'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import RecipeCardSkeleton from '@/components/SkeletonCard'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export default function KochbuchPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<RecipeCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/kochbuch'); return }
      setUser(user)
      loadSaved(supabase, user.id)
    }
    init()
  }, [router])

  const loadSaved = async (supabase: SupabaseClient, userId: string) => {
    const { data: saved } = await supabase
      .from('saved_recipes')
      .select('recipe_id, saved_at')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (!saved || saved.length === 0) {
      setLoading(false); return
    }

    const ids = saved.map((s: { recipe_id: number }) => s.recipe_id)
    const savedMap = new Map(saved.map((s: { recipe_id: number; saved_at: string }) => [s.recipe_id, new Date(s.saved_at)]))

    const { data: recipeData } = await supabase
      .from('recipes')
      .select(`id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
        author:profiles!author_id(id, username, display_name, avatar_url),
        category:categories!category_id(id, name, slug, icon)`)
      .in('id', ids)
      .eq('is_published', true)

    type RawRecipe = Record<string, unknown>
    const ordered: RecipeCardData[] = ((recipeData ?? []) as RawRecipe[]).map((r) => ({
      ...r,
      author: Array.isArray(r.author) ? (r.author as RawRecipe[])[0] : r.author,
      category: Array.isArray(r.category) ? ((r.category as RawRecipe[])[0] ?? null) : (r.category ?? null),
    } as RecipeCardData)).sort((a, b) => {
      const dateA = savedMap.get(a.id)?.getTime() ?? 0
      const dateB = savedMap.get(b.id)?.getTime() ?? 0
      return dateB - dateA
    })

    setRecipes(ordered)
    setLoading(false)
  }

  const handleRemove = useCallback(async (recipeId: number) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('recipe_id', recipeId)
      .eq('user_id', user?.id)
    if (!error) {
      setRecipes(prev => prev.filter(r => r.id !== recipeId))
    }
  }, [user?.id])

  const filtered = search
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-dark">Mein Kochbuch</h1>
          <p className="text-gray-500 mt-1">{recipes.length} gespeicherte Rezepte</p>
        </div>
        <Link href="/rezepte" className="text-sm text-primary hover:text-primary-600 font-medium">
          Rezepte entdecken &rarr;
        </Link>
      </div>

      {recipes.length > 0 && (
        <div className="mb-6">
          <input type="text" placeholder="Im Kochbuch suchen..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <RecipeCardSkeleton key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(recipe => (
            <div key={recipe.id} className="group relative">
              <RecipeCard recipe={recipe} />
              <button onClick={() => handleRemove(recipe.id)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 text-gray-400"
                aria-label="Entfernen">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-brand-dark mb-2">
            {search ? 'Keine Ergebnisse' : 'Du hast noch keine Rezepte gespeichert'}
          </h2>
          <p className="text-gray-500 mb-6">
            {search ? 'Versuche einen anderen Suchbegriff.' : 'Entdecke neue Rezepte und speichere sie in deinem Kochbuch.'}
          </p>
          <Link href="/rezepte" className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
            Rezepte entdecken
          </Link>
        </div>
      )}
    </div>
  )
}
