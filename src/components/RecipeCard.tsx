'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime } from '@/lib/utils'
import type { Difficulty } from '@/types/database'

export interface RecipeCardData {
  id: number
  title: string
  slug: string
  image_url: string | null
  difficulty: Difficulty
  prep_time_minutes: number
  avg_rating: number | null
  rating_count: number | null
  author: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  category: {
    id: number
    name: string
    slug: string
    icon: string
  } | null
}

interface RecipeCardProps {
  recipe: RecipeCardData
}

const difficultyColors: Record<Difficulty, string> = {
  Einfach: 'bg-green-100 text-green-700',
  Mittel: 'bg-yellow-100 text-yellow-700',
  Schwer: 'bg-red-100 text-red-700',
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={star <= Math.round(score) ? 'text-secondary' : 'text-gray-200'}
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [imageError, setImageError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('saved_recipes')
          .select('*')
          .eq('recipe_id', recipe.id)
          .eq('user_id', user.id)
          .single()
        setIsSaved(!!data)
      }
    }
    checkAuth()
  }, [recipe.id, supabase])

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    if (isSaved) {
      await supabase
        .from('saved_recipes')
        .delete()
        .eq('recipe_id', recipe.id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('saved_recipes')
        .insert({ recipe_id: recipe.id, user_id: user.id })
    }
    setIsSaved(!isSaved)
  }

  const authorName = recipe.author.display_name || recipe.author.username
  const hasImage = recipe.image_url && !imageError

  return (
    <Link
      href={`/rezepte/${recipe.slug}`}
      className="block rounded-2xl bg-white shadow-card overflow-hidden card-hover group"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        {hasImage ? (
          <Image
            src={recipe.image_url!}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 via-secondary-100 to-primary-50" />
        )}

        {recipe.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-800 px-2.5 py-1 rounded-full">
            {recipe.category.icon} {recipe.category.name}
          </span>
        )}

        <button
          onClick={toggleSave}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            isSaved
              ? 'bg-primary text-white shadow-md'
              : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:bg-white hover:text-primary'
          )}
          aria-label={isSaved ? 'Entfernen' : 'Speichern'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg font-bold text-brand-dark leading-tight line-clamp-2">
          {recipe.title}
        </h3>

        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 shrink-0">
            {recipe.author.avatar_url ? (
              <Image
                src={recipe.author.avatar_url}
                alt={authorName}
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600 truncate">{authorName}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {recipe.avg_rating !== null && (
            <div className="flex items-center gap-1 shrink-0">
              <StarRating score={recipe.avg_rating} />
              <span className="text-xs text-gray-500">
                {recipe.avg_rating.toFixed(1)} ({recipe.rating_count})
              </span>
            </div>
          )}

          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full ml-auto',
              difficultyColors[recipe.difficulty]
            )}
          >
            {recipe.difficulty}
          </span>

          <span className="text-xs text-gray-500 shrink-0">
            {formatTime(recipe.prep_time_minutes)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-pulse">
      <div className="aspect-[3/2] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-5 bg-gray-200 rounded-full w-16 ml-auto" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  )
}
