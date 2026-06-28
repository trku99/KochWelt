'use client'

import { useState } from 'react'

interface ServingCalculatorProps {
  baseServings: number
  onServingsChange: (servings: number) => void
}

export default function ServingCalculator({ baseServings, onServingsChange }: ServingCalculatorProps) {
  const [servings, setServings] = useState(baseServings)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setServings(value)
    onServingsChange(value)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card">
      <label className="text-sm font-medium text-gray-700" htmlFor="serving-slider">
        Portionen anpassen
      </label>

      <div className="mt-3 flex items-center gap-4">
        <span className="text-sm text-gray-500 w-6 text-center">1</span>
        <input
          id="serving-slider"
          type="range"
          min={1}
          max={20}
          value={servings}
          onChange={handleChange}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                     bg-gray-200 accent-primary
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-primary
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:w-5
                     [&::-moz-range-thumb]:h-5
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-primary
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:shadow-md
                     [&::-moz-range-thumb]:cursor-pointer"
        />
        <span className="text-sm text-gray-500 w-8 text-center">20</span>
      </div>

      <div className="mt-4 text-center">
        <span className="text-lg font-serif font-bold text-brand-dark">
          Für {servings} {servings === 1 ? 'Person' : 'Personen'}
        </span>
      </div>
    </div>
  )
}
