'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, cn } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'
import type { Difficulty, Category, Tag } from '@/types/database'

interface ImportedIngredient { name: string; amount: number | null; unit: string | null }
interface ImportedData {
  title: string; description: string; image_url: string | null
  prep_time_minutes: number; cook_time_minutes: number; servings: number
  difficulty: string; category: string | null
  ingredients: ImportedIngredient[]; steps: { instruction: string }[]; tags: string[]
}

const units = ['g', 'ml', 'TL', 'EL', 'Stück'] as const
const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'Einfach', label: 'Einfach' },
  { value: 'Mittel', label: 'Mittel' },
  { value: 'Schwer', label: 'Schwer' },
]

interface IngredientRow {
  tempId: string
  name: string
  amount: number | null
  unit: string
}

interface StepRow {
  tempId: string
  instruction: string
  image_url: string | null
}

interface FormData {
  title: string
  category_id: number | null
  difficulty: Difficulty
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  description: string
  ingredients: IngredientRow[]
  steps: StepRow[]
  image_url: string | null
  tag_ids: number[]
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

const initialForm: FormData = {
  title: '',
  category_id: null,
  difficulty: 'Einfach',
  prep_time_minutes: 15,
  cook_time_minutes: 15,
  servings: 4,
  description: '',
  ingredients: [],
  steps: [],
  image_url: null,
  tag_ids: [],
  calories: null,
  protein_g: null,
  carbs_g: null,
  fat_g: null,
}

let tempIdCounter = 0
function nextTempId() {
  return `tmp_${++tempIdCounter}_${Date.now()}`
}

const stepLabels = ['Basis', 'Zutaten', 'Schritte', 'Bild & Tags']

function RecipeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const isEditing = !!editId

  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const [catResult, tagResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('tags').select('*').order('name'),
      ])

      setCategories((catResult.data ?? []) as Category[])
      setTags((tagResult.data ?? []) as Tag[])

      if (editId) {
        setLoadingEdit(true)
        const { data: recipeData } = await supabase
          .from('recipes')
          .select(`
            *,
            ingredients(*),
            steps(*),
            recipe_tags(tag_id)
          `)
          .eq('id', Number(editId))
          .single()

        if (recipeData) {
          const r = recipeData as Record<string, unknown> & {
            ingredients: { name: string; amount: number | null; unit: string | null; sort_order: number }[]
            steps: { instruction: string; image_url: string | null; step_number: number }[]
            recipe_tags: { tag_id: number }[]
          }
          setFormData({
            title: (r.title as string) ?? '',
            category_id: (r.category_id as number | null) ?? null,
            difficulty: (r.difficulty as Difficulty) ?? 'Einfach',
            prep_time_minutes: (r.prep_time_minutes as number) ?? 15,
            cook_time_minutes: (r.cook_time_minutes as number) ?? 15,
            servings: (r.servings as number) ?? 4,
            description: (r.description as string) ?? '',
            ingredients:
              (r.ingredients ?? [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((i) => ({
                  tempId: nextTempId(),
                  name: i.name,
                  amount: i.amount,
                  unit: i.unit ?? 'Stück',
                })),
            steps:
              (r.steps ?? [])
                .sort((a, b) => a.step_number - b.step_number)
                .map((s) => ({
                  tempId: nextTempId(),
                  instruction: s.instruction,
                  image_url: s.image_url,
                })),
            image_url: (r.image_url as string | null) ?? null,
            tag_ids: (r.recipe_tags ?? []).map((rt: { tag_id: number }) => rt.tag_id),
            calories: (r.calories as number | null) ?? null,
            protein_g: (r.protein_g as number | null) ?? null,
            carbs_g: (r.carbs_g as number | null) ?? null,
            fat_g: (r.fat_g as number | null) ?? null,
          })
        }
        setLoadingEdit(false)
      }
    }
    init()
  }, [router, editId])

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addIngredient = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { tempId: nextTempId(), name: '', amount: null, unit: 'Stück' },
      ],
    }))
  }, [])

  const removeIngredient = useCallback((tempId: string) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((i) => i.tempId !== tempId),
    }))
  }, [])

  const updateIngredient = useCallback((tempId: string, field: keyof IngredientRow, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((i) =>
        i.tempId === tempId ? { ...i, [field]: value } : i
      ),
    }))
  }, [])

  const moveIngredient = useCallback((index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= formData.ingredients.length) return
    setFormData((prev) => {
      const items = [...prev.ingredients]
      ;[items[index], items[target]] = [items[target], items[index]]
      return { ...prev, ingredients: items }
    })
  }, [formData.ingredients.length])

  const addStep = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { tempId: nextTempId(), instruction: '', image_url: null },
      ],
    }))
  }, [])

  const removeStep = useCallback((tempId: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.tempId !== tempId),
    }))
  }, [])

  const updateStep = useCallback((tempId: string, field: keyof StepRow, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.tempId === tempId ? { ...s, [field]: value } : s
      ),
    }))
  }, [])

  const moveStep = useCallback((index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= formData.steps.length) return
    setFormData((prev) => {
      const items = [...prev.steps]
      ;[items[index], items[target]] = [items[target], items[index]]
      return { ...prev, steps: items }
    })
  }, [formData.steps.length])

  const toggleTag = useCallback((tagId: number) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }))
  }, [])

  const canGoNext = useCallback((): boolean => {
    switch (step) {
      case 0:
        return formData.title.trim().length > 0 && formData.description.trim().length > 0
      case 1:
        return formData.ingredients.some((i) => i.name.trim().length > 0)
      case 2:
        return formData.steps.some((s) => s.instruction.trim().length > 0)
      default:
        return true
    }
  }, [step, formData])

  const handleSubmit = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    setSubmitting(true)
    setError(null)

    const slug = generateSlug(formData.title)
    const recipePayload = {
      title: formData.title.trim(),
      slug,
      description: formData.description.trim() || null,
      author_id: user.id,
      category_id: formData.category_id,
      difficulty: formData.difficulty,
      prep_time_minutes: formData.prep_time_minutes,
      cook_time_minutes: formData.cook_time_minutes,
      servings: formData.servings,
      image_url: formData.image_url,
      is_published: true,
      calories: formData.calories,
      protein_g: formData.protein_g,
      carbs_g: formData.carbs_g,
      fat_g: formData.fat_g,
    }

    try {
      if (isEditing && editId) {
        const { error: updateErr } = await supabase
          .from('recipes')
          .update(recipePayload)
          .eq('id', Number(editId))

        if (updateErr) throw updateErr

        await Promise.all([
          supabase.from('ingredients').delete().eq('recipe_id', Number(editId)),
          supabase.from('steps').delete().eq('recipe_id', Number(editId)),
          supabase.from('recipe_tags').delete().eq('recipe_id', Number(editId)),
        ])

        const ingredientRows = formData.ingredients
          .filter((i) => i.name.trim())
          .map((i, idx) => ({
            recipe_id: Number(editId),
            name: i.name.trim(),
            amount: i.amount,
            unit: i.unit,
            sort_order: idx,
          }))

        const stepRows = formData.steps
          .filter((s) => s.instruction.trim())
          .map((s, idx) => ({
            recipe_id: Number(editId),
            step_number: idx + 1,
            instruction: s.instruction.trim(),
            image_url: s.image_url,
          }))

        const tagRows = formData.tag_ids.map((tagId) => ({
          recipe_id: Number(editId),
          tag_id: tagId,
        }))

        if (ingredientRows.length > 0) {
          const { error: ie } = await supabase.from('ingredients').insert(ingredientRows)
          if (ie) throw ie
        }
        if (stepRows.length > 0) {
          const { error: se } = await supabase.from('steps').insert(stepRows)
          if (se) throw se
        }
        if (tagRows.length > 0) {
          const { error: te } = await supabase.from('recipe_tags').insert(tagRows)
          if (te) throw te
        }
      } else {
        const { data: newRecipe, error: insertErr } = await supabase
          .from('recipes')
          .insert(recipePayload)
          .select('id')
          .single()

        if (insertErr) throw insertErr
        const recipeId = newRecipe.id

        const ingredientRows = formData.ingredients
          .filter((i) => i.name.trim())
          .map((i, idx) => ({
            recipe_id: recipeId,
            name: i.name.trim(),
            amount: i.amount,
            unit: i.unit,
            sort_order: idx,
          }))

        const stepRows = formData.steps
          .filter((s) => s.instruction.trim())
          .map((s, idx) => ({
            recipe_id: recipeId,
            step_number: idx + 1,
            instruction: s.instruction.trim(),
            image_url: s.image_url,
          }))

        const tagRows = formData.tag_ids.map((tagId) => ({
          recipe_id: recipeId,
          tag_id: tagId,
        }))

        if (ingredientRows.length > 0) {
          const { error: ie } = await supabase.from('ingredients').insert(ingredientRows)
          if (ie) throw ie
        }
        if (stepRows.length > 0) {
          const { error: se } = await supabase.from('steps').insert(stepRows)
          if (se) throw se
        }
        if (tagRows.length > 0) {
          const { error: te } = await supabase.from('recipe_tags').insert(tagRows)
          if (te) throw te
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Fehler beim Speichern des Rezepts.'
      )
    } finally {
      setSubmitting(false)
    }
  }, [user, formData, isEditing, editId, router])

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      })
      const result = await res.json()
      if (!res.ok) { setImportError(result.error || 'Import fehlgeschlagen'); return }

      const d = result.data as ImportedData
      setFormData(prev => ({
        ...prev,
        title: d.title || prev.title,
        description: d.description || prev.description,
        image_url: d.image_url || prev.image_url,
        prep_time_minutes: d.prep_time_minutes || prev.prep_time_minutes,
        cook_time_minutes: d.cook_time_minutes || prev.cook_time_minutes,
        servings: d.servings || prev.servings,
        difficulty: (['Einfach', 'Mittel', 'Schwer'].includes(d.difficulty) ? d.difficulty : prev.difficulty) as Difficulty,
        ingredients: d.ingredients.map(i => ({ tempId: nextTempId(), name: i.name, amount: i.amount, unit: i.unit || 'Stück' })),
        steps: d.steps.map(s => ({ tempId: nextTempId(), instruction: s.instruction, image_url: null })),
      }))
      setShowImport(false)
      setImportUrl('')
    } catch { setImportError('Fehler beim Import') }
    finally { setImporting(false) }
  }, [importUrl])

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-brand-dark mb-8">
          {isEditing ? 'Rezept bearbeiten' : 'Neues Rezept'}
        </h1>

        {!isEditing && (
          <div className="mb-8 p-4 bg-white rounded-xl border border-gray-200">
            <button type="button" onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Von URL importieren
            </button>
            {showImport && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">Füge eine Rezept-URL ein (z. B. von chefkoch.de)</p>
                <div className="flex gap-2">
                  <input type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)}
                    placeholder="https://www.chefkoch.de/rezepte/..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="button" onClick={handleImport} disabled={importing || !importUrl.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
                    {importing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : 'Importieren'}
                  </button>
                </div>
                {importError && <p className="text-xs text-red-500">{importError}</p>}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-0 mb-10">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                    i < step
                      ? 'bg-primary text-white'
                      : i === step
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {i < step ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1.5 hidden sm:block',
                    i <= step ? 'text-primary font-medium' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-0.5 mx-1 sm:mx-2 mt-0',
                    i < step ? 'bg-primary' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Titel *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Z. B. Zürcher Geschnetzeltes"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kategorie
                </label>
                <select
                  id="category"
                  value={formData.category_id ?? ''}
                  onChange={(e) =>
                    updateField('category_id', e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="">Keine Kategorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Schwierigkeit *
                </label>
                <div className="flex gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => updateField('difficulty', d.value)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                        formData.difficulty === d.value
                          ? d.value === 'Einfach'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : d.value === 'Mittel'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Portionen *
                </label>
                <input
                  id="servings"
                  type="number"
                  min={1}
                  value={formData.servings}
                  onChange={(e) => updateField('servings', Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prep_time" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vorbereitungszeit (Minuten) *
                </label>
                <input
                  id="prep_time"
                  type="number"
                  min={0}
                  value={formData.prep_time_minutes}
                  onChange={(e) =>
                    updateField('prep_time_minutes', Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="cook_time" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kochzeit (Minuten)
                </label>
                <input
                  id="cook_time"
                  type="number"
                  min={0}
                  value={formData.cook_time_minutes}
                  onChange={(e) =>
                    updateField('cook_time_minutes', Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Beschreibung *
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                placeholder="Kurze Beschreibung des Rezepts..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Ingredients */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Füge die Zutaten für dein Rezept hinzu.
            </p>

            {formData.ingredients.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">
                Noch keine Zutaten. Klicke auf &quot;Zutat hinzufügen&quot;.
              </p>
            )}

            {formData.ingredients.map((ing, index) => (
              <div
                key={ing.tempId}
                className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-card"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveIngredient(index, -1)}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Nach oben"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveIngredient(index, 1)}
                    disabled={index === formData.ingredients.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Nach unten"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(ing.tempId, 'name', e.target.value)}
                    placeholder="Zutat"
                    className="col-span-5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={ing.amount ?? ''}
                    onChange={(e) =>
                      updateIngredient(
                        ing.tempId,
                        'amount',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="Menge"
                    className="col-span-3 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(ing.tempId, 'unit', e.target.value)}
                    className="col-span-2 px-2 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.tempId)}
                    className="col-span-2 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                    aria-label="Entfernen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addIngredient}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Zutat hinzufügen
            </button>
          </div>
        )}

        {/* Step 3: Steps */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Beschreibe die Zubereitungsschritte.
            </p>

            {formData.steps.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">
                Noch keine Schritte. Klicke auf &quot;Schritt hinzufügen&quot;.
              </p>
            )}

            {formData.steps.map((stepItem, index) => (
              <div
                key={stepItem.tempId}
                className="bg-white rounded-2xl p-5 shadow-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Nach oben"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === formData.steps.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Nach unten"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(stepItem.tempId)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Schritt entfernen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <textarea
                  value={stepItem.instruction}
                  onChange={(e) => updateStep(stepItem.tempId, 'instruction', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                  placeholder={`Schritt ${index + 1} beschreiben...`}
                />

                <div className="mt-3">
                  <ImageUpload
                    currentImage={stepItem.image_url ?? undefined}
                    onUpload={(url) => updateStep(stepItem.tempId, 'image_url', url)}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Schritt hinzufügen
            </button>
          </div>
        )}

        {/* Step 4: Cover Image + Tags + Preview */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titelbild
              </label>
              <ImageUpload
                currentImage={formData.image_url ?? undefined}
                onUpload={(url) => updateField('image_url', url)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              {tags.length === 0 ? (
                <p className="text-sm text-gray-400">Keine Tags verfügbar.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = formData.tag_ids.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                          selected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                        )}
                      >
                        #{tag.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-serif text-xl font-bold text-brand-dark mb-4">Nährwerte (optional)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kalorien (kcal)</label>
                  <input type="number" min={0} value={formData.calories ?? ''} onChange={e => updateField('calories', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Eiweiß (g)</label>
                  <input type="number" min={0} step={0.1} value={formData.protein_g ?? ''} onChange={e => updateField('protein_g', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kohlenhydrate (g)</label>
                  <input type="number" min={0} step={0.1} value={formData.carbs_g ?? ''} onChange={e => updateField('carbs_g', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fett (g)</label>
                  <input type="number" min={0} step={0.1} value={formData.fat_g ?? ''} onChange={e => updateField('fat_g', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-serif text-xl font-bold text-brand-dark mb-4">
                Vorschau
              </h3>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="relative aspect-[3/2] bg-gradient-to-br from-primary-100 via-secondary-100 to-primary-50">
                  {formData.image_url && (
                    <Image
                      src={formData.image_url}
                      alt={formData.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-serif text-lg font-bold text-brand-dark">
                    {formData.title || 'Titel'}
                  </h4>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {formData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>
                      {formData.prep_time_minutes + formData.cook_time_minutes} Min.
                    </span>
                    <span>{formData.servings} Portionen</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full font-medium',
                        formData.difficulty === 'Einfach'
                          ? 'bg-green-100 text-green-700'
                          : formData.difficulty === 'Mittel'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {formData.difficulty}
                    </span>
                  </div>
                  {formData.ingredients.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Zutaten ({formData.ingredients.length})
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {formData.ingredients
                          .filter((i) => i.name)
                          .map((i) => `${i.name}${i.amount ? ` ${i.amount}${i.unit}` : ''}`)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  {formData.steps.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Schritte ({formData.steps.length})
                      </p>
                    </div>
                  )}
                  {formData.tag_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {formData.tag_ids.map((id) => {
                        const tag = tags.find((t) => t.id === id)
                        return tag ? (
                          <span
                            key={id}
                            className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                          >
                            #{tag.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Zurück
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="inline-flex items-center gap-1 bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {isEditing ? 'Speichern' : 'Veröffentlichen'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RecipeCreatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RecipeForm />
    </Suspense>
  )
}
