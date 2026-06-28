'use client'

import { useState } from 'react'
import { cn, formatFraction } from '@/lib/utils'
import type { Ingredient } from '@/types/database'

interface IngredientListProps {
  ingredients: Ingredient[]
  servings: number
  currentServings: number
}

export default function IngredientList({ ingredients, servings, currentServings }: IngredientListProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>(() => {
    const saved: Record<number, boolean> = {}
    for (const ing of ingredients) {
      try {
        const val = localStorage.getItem(`ingredient-checked-${ing.id}`)
        if (val !== null) saved[ing.id] = val === 'true'
      } catch {}
    }
    return saved
  })

  const toggleChecked = (id: number) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem(`ingredient-checked-${id}`, String(next[id]))
      } catch {}
      return next
    })
  }

  const scale = currentServings / servings

  const formatAmount = (amount: number | null): string | null => {
    if (amount === null) return null
    const scaled = amount * scale
    const rounded = Math.round(scaled * 100) / 100
    if (rounded === 0) return '< 1'
    if (Number.isInteger(rounded)) return formatFraction(rounded)
    const frac = rounded.toString()
    return frac
  }

  if (ingredients.length === 0) {
    return <p className="text-gray-400 text-sm">Keine Zutaten angegeben.</p>
  }

  return (
    <ul className="space-y-2">
      {ingredients
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((ingredient) => {
          const isChecked = checked[ingredient.id] ?? false
          const amount = formatAmount(ingredient.amount)

          return (
            <li key={ingredient.id}>
              <label
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                  isChecked ? 'bg-gray-50' : 'hover:bg-gray-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleChecked(ingredient.id)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                />
                <span
                  className={cn(
                    'text-sm transition-all',
                    isChecked ? 'line-through text-gray-400' : 'text-gray-800'
                  )}
                >
                  {amount && (
                    <span className="font-medium">{amount}{ingredient.unit ? ' ' : ''}</span>
                  )}
                  {ingredient.unit && <span className="text-gray-500">{ingredient.unit} </span>}
                  {ingredient.name}
                </span>
              </label>
            </li>
          )
        })}
    </ul>
  )
}
