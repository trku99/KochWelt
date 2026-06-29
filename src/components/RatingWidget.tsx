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
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className={className}
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export default function RatingWidget({
  recipeId, initialScore, initialCount, readonly = true, userId, userScore,
}: RatingWidgetProps) {
  const [score, setScore] = useState(initialScore ?? 0)
  const [count, setCount] = useState(initialCount ?? 0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [currentUserScore, setCurrentUserScore] = useState(userScore ?? 0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleRate = async (star: number) => {
    if (readonly || !userId || submitting) return
    setCurrentUserScore(star)
    setShowCommentBox(true)
  }

  const handleSubmit = async () => {
    if (!userId) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('ratings')
      .upsert(
        { recipe_id: recipeId, user_id: userId, score: currentUserScore, comment: comment || null },
        { onConflict: 'recipe_id, user_id' }
      )
    if (!error) {
      setCount((prev) => (currentUserScore === 0 ? prev + 1 : prev))
      setScore((prev) => {
        if (currentUserScore === 0) return prev
        const total = prev * (userScore && userScore > 0 ? count : count)
        return (total + currentUserScore) / (count + 1)
      })
      setSubmitted(true)
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
            <StarIcon key={star} filled={star <= Math.round(displayScore)} className="text-secondary" />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">{displayScore > 0 ? displayScore.toFixed(1) : '—'}</span>
        <span className="text-sm text-gray-400">({displayCount})</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" disabled={submitting}
              onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)}
              onClick={() => handleRate(star)}
              className={cn('transition-transform hover:scale-110 disabled:opacity-50', star <= (hoveredStar || currentUserScore) ? 'text-secondary' : 'text-gray-200')}
              aria-label={`${star} von 5 Sternen`}>
              <StarIcon filled={star <= (hoveredStar || currentUserScore)} />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 ml-1">{displayScore > 0 ? displayScore.toFixed(1) : '—'}</span>
        <span className="text-sm text-gray-400">({displayCount})</span>
      </div>

      {showCommentBox && !submitted && (
        <div className="space-y-2">
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Kommentar (optional)..." rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting}
              className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
              {submitting ? 'Wird gesendet...' : 'Bewertung abschicken'}
            </button>
            <button onClick={() => { setShowCommentBox(false); setCurrentUserScore(0) }}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">Abbrechen</button>
          </div>
        </div>
      )}

      {submitted && <p className="text-xs text-green-600 font-medium">Bewertung gespeichert!</p>}

      {currentUserScore > 0 && !showCommentBox && !submitted && (
        <p className="text-xs text-gray-500">Deine Bewertung: {currentUserScore}/5</p>
      )}
    </div>
  )
}
