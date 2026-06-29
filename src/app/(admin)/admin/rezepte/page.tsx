'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface RecipeRow {
  id: number
  title: string
  slug: string
  category_id: number | null
  difficulty: string | null
  prep_time_minutes: number | null
  image_url: string | null
  description: string | null
  cook_time_minutes: number | null
  servings: number | null
  is_published: boolean
  created_at: string
  categories?: { name: string } | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

interface Category { id: number; name: string; slug: string }
interface Tag { id: number; name: string; slug: string }
interface IngredientRow { id?: number; name: string; amount: number | null; unit: string | null; sort_order: number }
interface StepRow { id?: number; step_number: number; instruction: string }

const emptyIngredient = { name: '', amount: null, unit: '', sort_order: 0 }

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [batchDelete, setBatchDelete] = useState(false)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [editRecipe, setEditRecipe] = useState<RecipeRow | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [recipeTags, setRecipeTags] = useState<number[]>([])
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [steps, setSteps] = useState<StepRow[]>([])
  const [saving, setSaving] = useState(false)

  const loadRecipes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('recipes').select('*, categories(name)').order('created_at', { ascending: false })
    if (data) setRecipes(data as unknown as RecipeRow[])
    setLoading(false)
  }, [])

  useEffect(() => { loadRecipes() }, [loadRecipes])

  useEffect(() => {
    if (editRecipe) {
      const supabase = createClient()
      Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('tags').select('*').order('name'),
        supabase.from('ingredients').select('*').eq('recipe_id', editRecipe.id).order('sort_order'),
        supabase.from('steps').select('*').eq('recipe_id', editRecipe.id).order('step_number'),
        supabase.from('recipe_tags').select('tag_id').eq('recipe_id', editRecipe.id),
      ]).then(([catRes, tagRes, ingRes, stepRes, rtRes]) => {
        if (catRes.data) setCategories(catRes.data)
        if (tagRes.data) setTags(tagRes.data)
        if (ingRes.data) setIngredients(ingRes.data as IngredientRow[])
        if (stepRes.data) setSteps(stepRes.data as StepRow[])
        if (rtRes.data) setRecipeTags(rtRes.data.map((r: { tag_id: number }) => r.tag_id))
      })
    }
  }, [editRecipe])

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(r => r.id)))
    }
  }

  const handleBatchPublish = async (publish: boolean) => {
    if (selected.size === 0) return
    setBatchProcessing(true)
    const supabase = createClient()
    const { error } = await supabase.from('recipes').update({ is_published: publish }).in('id', Array.from(selected))
    if (!error) { setSelected(new Set()); loadRecipes() }
    setBatchProcessing(false)
  }

  const handleBatchDelete = async () => {
    if (selected.size === 0) return
    setBatchProcessing(true)
    const supabase = createClient()
    const ids = Array.from(selected)
    await supabase.from('recipe_tags').delete().in('recipe_id', ids)
    await supabase.from('ingredients').delete().in('recipe_id', ids)
    await supabase.from('steps').delete().in('recipe_id', ids)
    await supabase.from('ratings').delete().in('recipe_id', ids)
    await supabase.from('saved_recipes').delete().in('recipe_id', ids)
    await supabase.from('recipes').delete().in('id', ids)
    setSelected(new Set())
    setBatchDelete(false)
    setBatchProcessing(false)
    loadRecipes()
  }

  const handleDelete = async (id: number) => {
    const supabase = createClient()
    await supabase.from('recipe_tags').delete().eq('recipe_id', id)
    await supabase.from('ingredients').delete().eq('recipe_id', id)
    await supabase.from('steps').delete().eq('recipe_id', id)
    await supabase.from('ratings').delete().eq('recipe_id', id)
    await supabase.from('saved_recipes').delete().eq('recipe_id', id)
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (!error) { setRecipes(recipes.filter(r => r.id !== id)); setDeleteId(null) }
  }

  const openEdit = (recipe: RecipeRow) => {
    setEditRecipe(recipe); setIngredients([]); setSteps([]); setRecipeTags([])
  }

  const addIngredient = () => setIngredients(prev => [...prev, { ...emptyIngredient, sort_order: prev.length }])
  const updateIngredient = (index: number, field: keyof IngredientRow, value: string | number | null) =>
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing))
  const removeIngredient = (index: number) =>
    setIngredients(prev => prev.filter((_, i) => i !== index).map((ing, i) => ({ ...ing, sort_order: i })))
  const addStep = () => setSteps(prev => [...prev, { instruction: '', step_number: prev.length + 1 }])
  const updateStep = (index: number, instruction: string) =>
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, instruction } : s))
  const removeStep = (index: number) =>
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })))
  const toggleTag = (tagId: number) =>
    setRecipeTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])

  const handleSave = async () => {
    if (!editRecipe) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('recipes').update({
      title: editRecipe.title, slug: editRecipe.slug, description: editRecipe.description || null,
      category_id: editRecipe.category_id, difficulty: editRecipe.difficulty,
      prep_time_minutes: editRecipe.prep_time_minutes, cook_time_minutes: editRecipe.cook_time_minutes,
      servings: editRecipe.servings, image_url: editRecipe.image_url || null, is_published: editRecipe.is_published,
    }).eq('id', editRecipe.id)
    await supabase.from('ingredients').delete().eq('recipe_id', editRecipe.id)
    if (ingredients.length > 0) await supabase.from('ingredients').insert(ingredients.map(ing => ({ recipe_id: editRecipe.id, name: ing.name, amount: ing.amount, unit: ing.unit || null, sort_order: ing.sort_order })))
    await supabase.from('steps').delete().eq('recipe_id', editRecipe.id)
    if (steps.length > 0) await supabase.from('steps').insert(steps.map(s => ({ recipe_id: editRecipe.id, step_number: s.step_number, instruction: s.instruction })))
    await supabase.from('recipe_tags').delete().eq('recipe_id', editRecipe.id)
    if (recipeTags.length > 0) await supabase.from('recipe_tags').insert(recipeTags.map(tag_id => ({ recipe_id: editRecipe.id, tag_id })))
    setSaving(false); setEditRecipe(null); loadRecipes()
  }

  const filtered = search ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : recipes

  if (loading) return <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-20" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-brand-dark">Rezepte</h1>
        <span className="text-sm text-gray-400">{recipes.length} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Rezept suchen..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selected.size} ausgewählt</span>
            <button onClick={() => handleBatchPublish(true)} disabled={batchProcessing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">Veröffentlichen</button>
            <button onClick={() => handleBatchPublish(false)} disabled={batchProcessing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors">Als Entwurf</button>
            <button onClick={() => setBatchDelete(true)} disabled={batchProcessing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">Löschen</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="w-10 px-2 py-3 text-center">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll} className="rounded border-gray-300 text-primary focus:ring-primary" />
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Titel</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Kategorie</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Schwierigkeit</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Status</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(recipe => (
                <tr key={recipe.id} className={cn("hover:bg-gray-50/50 transition-colors", selected.has(recipe.id) && "bg-primary-5")}>
                  <td className="px-2 py-3 text-center">
                    <input type="checkbox" checked={selected.has(recipe.id)} onChange={() => toggleSelect(recipe.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {recipe.image_url ? (
                          <Image src={recipe.image_url} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{recipe.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 hidden sm:table-cell">{recipe.categories?.name || '—'}</td>
                  <td className="px-3 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {recipe.difficulty ? (
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        recipe.difficulty === 'Einfach' ? 'bg-green-50 text-green-600' :
                        recipe.difficulty === 'Mittel' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600')}>
                        {recipe.difficulty}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm hidden md:table-cell">
                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                      recipe.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500')}>
                      {recipe.is_published ? 'Online' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/rezepte/${recipe.slug}`} className="text-xs text-gray-400 hover:text-primary transition-colors">View</Link>
                      <button onClick={() => openEdit(recipe)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Edit</button>
                      <button onClick={() => setDeleteId(recipe.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Keine Rezepte gefunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">Rezept löschen</h3>
            <p className="text-sm text-gray-500 mb-6">Bist du sicher? Dies kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Abbrechen</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {batchDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setBatchDelete(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">{selected.size} Rezepte löschen</h3>
            <p className="text-sm text-gray-500 mb-6">Bist du sicher, dass du diese {selected.size} Rezepte löschen möchtest?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setBatchDelete(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Abbrechen</button>
              <button onClick={handleBatchDelete} disabled={batchProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                {batchProcessing ? 'Löschen...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editRecipe && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 overflow-y-auto" onClick={() => setEditRecipe(null)}>
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full my-8 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-brand-dark">Rezept bearbeiten</h2>
              <button onClick={() => setEditRecipe(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
                  <input type="text" value={editRecipe.title} onChange={e => setEditRecipe(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                  <input type="text" value={editRecipe.slug} onChange={e => setEditRecipe(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kategorie</label>
                  <select value={editRecipe.category_id ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, category_id: e.target.value ? Number(e.target.value) : null } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="">Keine</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Schwierigkeit</label>
                  <select value={editRecipe.difficulty ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, difficulty: e.target.value || null } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="">Keine</option>
                    <option value="Einfach">Einfach</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Schwer">Schwer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Zubereitungszeit (Min.)</label>
                  <input type="number" value={editRecipe.prep_time_minutes ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, prep_time_minutes: e.target.value ? Number(e.target.value) : null } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kochzeit (Min.)</label>
                  <input type="number" value={editRecipe.cook_time_minutes ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, cook_time_minutes: e.target.value ? Number(e.target.value) : null } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Portionen</label>
                  <input type="number" value={editRecipe.servings ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, servings: e.target.value ? Number(e.target.value) : null } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bild-URL</label>
                  <input type="text" value={editRecipe.image_url ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, image_url: e.target.value || null } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Beschreibung</label>
                <textarea value={editRecipe.description ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, description: e.target.value } : null)} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_published" checked={editRecipe.is_published} onChange={e => setEditRecipe(prev => prev ? { ...prev, is_published: e.target.checked } : null)}
                  className="rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="is_published" className="text-sm text-gray-700">Veröffentlicht</label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Nährwerte (pro Portion)</label>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Kalorien</label>
                    <input type="number" min={0} value={editRecipe.calories ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, calories: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Eiweiß (g)</label>
                    <input type="number" min={0} step={0.1} value={editRecipe.protein_g ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, protein_g: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Kohlenhydrate (g)</label>
                    <input type="number" min={0} step={0.1} value={editRecipe.carbs_g ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, carbs_g: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Fett (g)</label>
                    <input type="number" min={0} step={0.1} value={editRecipe.fat_g ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, fat_g: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                      className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                        recipeTags.includes(tag.id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">Zutaten</label>
                  <button type="button" onClick={addIngredient} className="text-xs text-primary hover:text-primary-600 font-medium">+ Zutat hinzufügen</button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" placeholder="Menge" value={ing.amount ?? ''} onChange={e => updateIngredient(i, 'amount', e.target.value ? Number(e.target.value) : null)}
                        className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <input type="text" placeholder="Einheit" value={ing.unit ?? ''} onChange={e => updateIngredient(i, 'unit', e.target.value)}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <input type="text" placeholder="Zutat" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">Schritte</label>
                  <button type="button" onClick={addStep} className="text-xs text-primary hover:text-primary-600 font-medium">+ Schritt hinzufügen</button>
                </div>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center text-sm font-medium shrink-0">{step.step_number}</div>
                      <textarea placeholder="Anweisung..." value={step.instruction} onChange={e => updateStep(i, e.target.value)} rows={2}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <button type="button" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setEditRecipe(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Abbrechen</button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
