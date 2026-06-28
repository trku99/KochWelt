'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface RatingWidgetProps {
  recipeId: number
  initialScore: number | null
  initialCount: number | null
  readonly?: boolean
  userId?: string
  userScore?: number | null
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export default function RatingWidget({
  recipeId,
  initialScore,
  initialCount,
  readonly = true,
  userId,
  userScore,
}: RatingWidgetProps) {
  const [score, setScore] = useState(initialScore ?? 0)
  const [count, setCount] = useState(initialCount ?? 0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [currentUserScore, setCurrentUserScore] = useState(userScore ?? 0)
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async (star: number) => {
    if (readonly || !userId || submitting) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('ratings')
      .upsert(
        { recipe_id: recipeId, user_id: userId, score: star },
        { onConflict: 'recipe_id, user_id' }
      )
    if (!error) {
      const diff = star - currentUserScore
      setCount((prev) => (currentUserScore === 0 ? prev + 1 : prev))
      setScore((prev) => {
        const total = prev * (currentUserScore === 0 ? count : count)
        return (total + diff) / (currentUserScore === 0 ? count + 1 : count)
      })
      setCurrentUserScore(star)
    }
    setSubmitting(false)
  }

  const displayScore = readonly ? (initialScore ?? 0) : score
  const displayCount = readonly ? (initialCount ?? 0) : count

  if (readonly) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              filled={star <= Math.round(displayScore)}
              className="text-secondary"
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {displayScore > 0 ? displayScore.toFixed(1) : '—'}
        </span>
        <span className="text-sm text-gray-400">
          ({displayCount})
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => handleRate(star)}
              className={cn(
                'transition-transform hover:scale-110 disabled:opacity-50',
                star <= (hoveredStar || currentUserScore)
                  ? 'text-secondary'
                  : 'text-gray-200'
              )}
              aria-label={`${star} von 5 Sternen`}
            >
              <StarIcon filled={star <= (hoveredStar || currentUserScore)} />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 ml-1">
          {displayScore > 0 ? displayScore.toFixed(1) : '—'}
        </span>
        <span className="text-sm text-gray-400">
          ({displayCount})
        </span>
      </div>
      {currentUserScore > 0 && (
        <p className="text-xs text-gray-500">
          Deine Bewertung: {currentUserScore}/5
        </p>
      )}
    </div>
  )
}
