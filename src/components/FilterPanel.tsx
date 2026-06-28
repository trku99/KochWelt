'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FilterCategory {
  slug: string
  name: string
  icon: string
}

interface FilterPanelProps {
  categories: FilterCategory[]
  selectedCategory: string | null
  selectedDifficulty: string | null
  selectedSort: string
  selectedPrepTime: string | null
  onCategoryChange: (slug: string | null) => void
  onDifficultyChange: (difficulty: string | null) => void
  onSortChange: (sort: string) => void
  onPrepTimeChange: (time: string | null) => void
}

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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
        active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
      )}
    >
      {children}
    </button>
  )
}

export default function FilterPanel({
  categories,
  selectedCategory,
  selectedDifficulty,
  selectedSort,
  selectedPrepTime,
  onCategoryChange,
  onDifficultyChange,
  onSortChange,
  onPrepTimeChange,
}: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="21" y2="21" />
            <line x1="4" x2="20" y1="14" y2="14" />
            <line x1="4" x2="20" y1="7" y2="7" />
            <line x1="4" x2="20" y1="3" y2="3" />
          </svg>
          Filter
          {(selectedCategory || selectedDifficulty || selectedPrepTime) && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                'text-sm font-medium px-3 py-1.5 rounded-full transition-colors',
                selectedSort === option.value
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-primary'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(mobileOpen ? 'block' : 'hidden', 'md:block space-y-4')}>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Kategorien
          </h4>
          <div className="flex flex-wrap gap-2">
            <Chip active={selectedCategory === null} onClick={() => onCategoryChange(null)}>
              Alle
            </Chip>
            {categories.map((cat) => (
              <Chip
                key={cat.slug}
                active={selectedCategory === cat.slug}
                onClick={() => onCategoryChange(selectedCategory === cat.slug ? null : cat.slug)}
              >
                {cat.icon} {cat.name}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Schwierigkeit
          </h4>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <Chip
                key={d.label}
                active={selectedDifficulty === d.value}
                onClick={() => onDifficultyChange(selectedDifficulty === d.value ? null : d.value)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Zubereitungszeit
          </h4>
          <div className="flex flex-wrap gap-2">
            {prepTimes.map((t) => (
              <Chip
                key={t.label}
                active={selectedPrepTime === t.value}
                onClick={() => onPrepTimeChange(selectedPrepTime === t.value ? null : t.value)}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Sortieren:
          </span>
          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  'text-sm font-medium px-3 py-1.5 rounded-full transition-colors',
                  selectedSort === option.value
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:text-primary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
