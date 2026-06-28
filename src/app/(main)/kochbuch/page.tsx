'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, clearAuthCookie } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import RecipeCard, { type RecipeCardData, RecipeCardSkeleton } from '@/components/RecipeCard'

export default function KochbuchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<RecipeCardData[]>([])
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: savedItems } = await supabase
        .from('saved_recipes')
        .select('recipe_id, saved_at')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })

      const savedIds = (savedItems ?? []).map((s: { recipe_id: number }) => s.recipe_id)

      if (savedIds.length > 0) {
        const { data: recipesData } = await supabase
          .from('recipes')
          .select(
            `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
             author:profiles!author_id(id, username, display_name, avatar_url),
             category:categories!category_id(id, name, slug, icon)`
          )
          .in('id', savedIds)
          .eq('is_published', true)

        const mapped = (recipesData ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as number,
          title: r.title as string,
          slug: r.slug as string,
          image_url: r.image_url as string | null,
          difficulty: r.difficulty as string,
          prep_time_minutes: r.prep_time_minutes as number,
          avg_rating: r.avg_rating as number | null,
          rating_count: r.rating_count as number | null,
          author: (Array.isArray(r.author) ? r.author[0] : r.author) as RecipeCardData['author'],
          category: (Array.isArray(r.category) ? r.category[0] : r.category) as RecipeCardData['category'],
        })) as RecipeCardData[]

        const recipeMap = new Map(mapped.map((r: RecipeCardData) => [r.id, r] as const))
        setRecipes(
          savedIds
            .map((id: number) => recipeMap.get(id))
            .filter(Boolean) as RecipeCardData[]
        )
      }

      setLoading(false)
    }
    init()
  }, [router])

  const handleRemove = useCallback(
    async (recipeId: number) => {
      const supabase = createClient()
      setRemovingId(recipeId)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRemovingId(null)
        return
      }
      await supabase
        .from('saved_recipes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
      setRecipes((prev: RecipeCardData[]) => prev.filter((r: RecipeCardData) => r.id !== recipeId))
      setRemovingId(null)
    },
    []
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-brand-dark mb-8">
          Mein Kochbuch
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-serif font-bold text-brand-dark mb-2">
              Du hast noch keine Rezepte gespeichert
            </p>
            <p className="text-gray-500 mb-6">
              Entdecke neue Rezepte und speichere sie in deinem Kochbuch.
            </p>
            <Link
              href="/rezepte"
              className="inline-flex items-center gap-2 bg-primary text-white font-medium px-5 py-2.5 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Rezepte entdecken
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative group">
                <RecipeCard recipe={recipe} />
                <button
                  onClick={() => handleRemove(recipe.id)}
                  disabled={removingId === recipe.id}
                  className={cn(
                    'absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100',
                    removingId === recipe.id
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white shadow-md'
                  )}
                  aria-label="Entfernen"
                >
                  {removingId === recipe.id ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
