'use client'

import { useRouter } from 'next/navigation'
import FilterPanel from '@/components/FilterPanel'

interface FilterCategory {
  slug: string
  name: string
  icon: string
}

interface FilterStateWrapperProps {
  categories: FilterCategory[]
  basePath: string
  selectedCategory: string | null
  selectedDifficulty: string | null
  selectedSort: string
  selectedPrepTime: string | null
}

export default function FilterStateWrapper({
  categories,
  basePath,
  selectedCategory,
  selectedDifficulty,
  selectedSort,
  selectedPrepTime,
}: FilterStateWrapperProps) {
  const router = useRouter()

  const navigate = (key: string, value: string | null) => {
    const sp = new URLSearchParams()
    if (selectedCategory) sp.set('category', selectedCategory)
    if (selectedDifficulty) sp.set('difficulty', selectedDifficulty)
    if (selectedSort && selectedSort !== 'neueste') sp.set('sort', selectedSort)
    if (selectedPrepTime) sp.set('prepTime', selectedPrepTime)

    if (value === null || value === 'neueste') {
      sp.delete(key)
    } else {
      sp.set(key, value)
    }
    sp.delete('page')
    const qs = sp.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  return (
    <FilterPanel
      categories={categories}
      selectedCategory={selectedCategory}
      selectedDifficulty={selectedDifficulty}
      selectedSort={selectedSort}
      selectedPrepTime={selectedPrepTime}
      onCategoryChange={(slug) => navigate('category', slug)}
      onDifficultyChange={(diff) => navigate('difficulty', diff)}
      onSortChange={(sort) => navigate('sort', sort)}
      onPrepTimeChange={(time) => navigate('prepTime', time)}
    />
  )
}
