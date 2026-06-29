'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import ServingCalculator from '@/components/ServingCalculator'
import IngredientList from '@/components/IngredientList'
import RatingWidget from '@/components/RatingWidget'
import type {
  Ingredient,
  Step,
  Difficulty,
  Rating,
  Profile,
} from '@/types/database'

interface RatingWithUser extends Rating {
  user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

interface RecipeContentProps {
  recipeId: number
  servings: number
  difficulty: Difficulty
  prepTime: number
  cookTime: number
  title: string
  ingredients: Ingredient[]
  steps: Step[]
  initialAvgRating: number | null
  initialRatingCount: number | null
  ratings: RatingWithUser[]
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
}

const difficultyColors: Record<Difficulty, string> = {
  Einfach: 'bg-green-100 text-green-700',
  Mittel: 'bg-yellow-100 text-yellow-700',
  Schwer: 'bg-red-100 text-red-700',
}

export default function RecipeContent({
  recipeId,
  servings,
  difficulty,
  prepTime,
  cookTime,
  title,
  ingredients,
  steps,
  initialAvgRating,
  initialRatingCount,
  ratings,
  calories,
  proteinG,
  carbsG,
  fatG,
}: RecipeContentProps) {
  const pathname = usePathname()
  const [currentServings, setCurrentServings] = useState(servings)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const totalTime = prepTime + cookTime

  useEffect(() => {
    const supabase = createClient()

    const increment = async () => {
      const { error } = await supabase.rpc('increment_view_count', {
        recipe_id: recipeId,
      })
      if (error) console.error(error)
    }
    increment()

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('saved_recipes')
          .select('*')
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id)
          .single()
        setIsSaved(!!data)
      }
    }
    init()
  }, [recipeId])

  const toggleSave = async () => {
    if (!user) return
    const supabase = createClient()
    if (isSaved) {
      await supabase
        .from('saved_recipes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('saved_recipes')
        .insert({ recipe_id: recipeId, user_id: user.id })
    }
    setIsSaved(!isSaved)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min.`
    const h = Math.floor(minutes / 60)
    const rem = minutes % 60
    return rem ? `${h} Std. ${rem} Min.` : `${h} Std.`
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ServingCalculator
            baseServings={servings}
            onServingsChange={setCurrentServings}
          />

          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-serif text-xl font-bold mb-4">Zutaten</h3>
            <IngredientList
              ingredients={ingredients}
              servings={servings}
              currentServings={currentServings}
            />
          </div>
        </div>

        {calories != null && (
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-serif text-xl font-bold mb-4">Nährwerte pro Portion</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-primary-50 rounded-xl text-center">
                <div className="text-lg font-bold text-primary">{calories}</div>
                <div className="text-xs text-gray-500">Kalorien</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <div className="text-lg font-bold text-blue-600">{proteinG ?? '—'}</div>
                <div className="text-xs text-gray-500">Eiweiß (g)</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <div className="text-lg font-bold text-amber-600">{carbsG ?? '—'}</div>
                <div className="text-xs text-gray-500">Kohlenhydrate (g)</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-center">
                <div className="text-lg font-bold text-rose-600">{fatG ?? '—'}</div>
                <div className="text-xs text-gray-500">Fett (g)</div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={cn(
                'text-sm font-medium px-3 py-1 rounded-full',
                difficultyColors[difficulty]
              )}
            >
              {difficulty}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v4" /><path d="M14 2v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M12 14h.01" /><path d="M8 18h.01" /><path d="M16 18h.01" /><path d="M12 18h.01" /><path d="M21 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Vorbereitung: {formatTime(prepTime)}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v4" /><path d="M14 2v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M12 14h.01" /><path d="M8 18h.01" /><path d="M16 18h.01" /><path d="M12 18h.01" /><path d="M21 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Kochen: {formatTime(cookTime)}
            </span>
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Gesamt: {formatTime(totalTime)}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {servings} Portionen
            </span>
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold mb-6">Zubereitung</h3>
            <ol className="space-y-8">
              {steps.map((step) => (
                <li key={step.id} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                    {step.step_number}
                  </span>
                  <div className="flex-1 space-y-3">
                    <p className="text-gray-800 leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.image_url && (
                      <div className="relative aspect-video rounded-xl overflow-hidden">
                        <Image
                          src={step.image_url}
                          alt={`Schritt ${step.step_number}: ${title}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-gray-600 border border-gray-200 hover:border-primary hover:text-primary transition-all print:hidden"
            aria-label="Drucken">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Drucken
          </button>
          <Link href={`${pathname}/pdf`} target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-gray-600 border border-gray-200 hover:border-primary hover:text-primary transition-all print:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            PDF
          </Link>
          <button
            onClick={toggleSave}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all',
              isSaved
                ? 'bg-primary text-white shadow-warm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary hover:text-primary'
            )}
            aria-label={isSaved ? 'Aus Kochbuch entfernen' : 'In Kochbuch speichern'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            {isSaved ? 'Gespeichert' : 'Speichern'}
          </button>
        </div>

        <RatingWidget
          recipeId={recipeId}
          initialScore={initialAvgRating}
          initialCount={initialRatingCount}
          readonly={!user}
          userId={user?.id}
        />
      </div>

      {ratings.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <h3 className="font-serif text-xl font-bold mb-6">
            Bewertungen ({ratings.length})
          </h3>
          <div className="space-y-4">
            {ratings.map((rating) => {
              const name = rating.user.display_name || rating.user.username
              return (
                <div
                  key={rating.id}
                  className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {rating.user.avatar_url ? (
                      <Image
                        src={rating.user.avatar_url}
                        alt={name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        {name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(rating.created_at).toLocaleDateString('de-CH')}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          className={
                            star <= rating.score ? 'text-secondary' : 'text-gray-200'
                          }
                          fill="currentColor"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 mt-1">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
