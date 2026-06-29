'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, cn } from '@/lib/utils'

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
  view_count: number
  avg_rating: number | null
  rating_count: number | null
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

type SortKey = 'title' | 'difficulty' | 'is_published' | 'created_at' | 'prep_time_minutes' | 'view_count' | 'avg_rating'
type SortDir = 'asc' | 'desc'

const emptyIngredient = { name: '', amount: null, unit: '', sort_order: 0 }
const ITEMS_PER_PAGE = 20

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [batchDelete, setBatchDelete] = useState(false)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [editRecipe, setEditRecipe] = useState<RecipeRow | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [recipeTags, setRecipeTags] = useState<number[]>([])
  const [editTab, setEditTab] = useState<'general' | 'nutrition' | 'ingredients' | 'steps'>('general')
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
    const supabase = createClient()
    supabase.from('categories').select('*').order('name').then(({ data }) => { if (data) setAllCategories(data) })
  }, [])

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
        setEditTab('general')
      })
    }
  }, [editRecipe])

  const filtered = useMemo(() => {
    let result = [...recipes]
    if (search) result = result.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase()))
    if (filterCategory) result = result.filter(r => r.category_id === Number(filterCategory))
    if (filterDifficulty) result = result.filter(r => r.difficulty === filterDifficulty)
    if (filterStatus) result = result.filter(r => r.is_published === (filterStatus === 'published'))
    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortKey === 'difficulty') cmp = (a.difficulty || '').localeCompare(b.difficulty || '')
      else if (sortKey === 'is_published') cmp = Number(a.is_published) - Number(b.is_published)
      else if (sortKey === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      else if (sortKey === 'prep_time_minutes') cmp = (a.prep_time_minutes || 0) - (b.prep_time_minutes || 0)
      else if (sortKey === 'view_count') cmp = (a.view_count || 0) - (b.view_count || 0)
      else if (sortKey === 'avg_rating') cmp = (a.avg_rating || 0) - (b.avg_rating || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [recipes, search, filterCategory, filterDifficulty, filterStatus, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => { setPage(1) }, [search, filterCategory, filterDifficulty, filterStatus])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === paged.length) { setSelected(new Set()) }
    else { setSelected(new Set(paged.map(r => r.id))) }
  }

  const handleBatchPublish = async (publish: boolean) => {
    if (selected.size === 0) return
    setBatchProcessing(true)
    const supabase = createClient()
    await supabase.from('recipes').update({ is_published: publish }).in('id', Array.from(selected))
    setSelected(new Set()); loadRecipes(); setBatchProcessing(false)
  }

  const handleBatchDelete = async () => {
    setBatchProcessing(true)
    const ids = Array.from(selected)
    const supabase = createClient()
    await supabase.from('recipe_tags').delete().in('recipe_id', ids)
    await supabase.from('ingredients').delete().in('recipe_id', ids)
    await supabase.from('steps').delete().in('recipe_id', ids)
    await supabase.from('ratings').delete().in('recipe_id', ids)
    await supabase.from('saved_recipes').delete().in('recipe_id', ids)
    await supabase.from('recipes').delete().in('id', ids)
    setSelected(new Set()); setBatchDelete(false); setBatchProcessing(false); loadRecipes()
  }

  const handleDelete = async (id: number) => {
    const supabase = createClient()
    await supabase.from('recipe_tags').delete().eq('recipe_id', id)
    await supabase.from('ingredients').delete().eq('recipe_id', id)
    await supabase.from('steps').delete().eq('recipe_id', id)
    await supabase.from('ratings').delete().eq('recipe_id', id)
    await supabase.from('saved_recipes').delete().eq('recipe_id', id)
    await supabase.from('recipes').delete().eq('id', id)
    setRecipes(recipes.filter(r => r.id !== id)); setDeleteId(null)
  }

  const openEdit = (recipe: RecipeRow) => {
    setEditRecipe(recipe); setIngredients([]); setSteps([]); setRecipeTags([])
  }

  const updateTitle = (title: string) => {
    setEditRecipe(prev => prev ? { ...prev, title, slug: generateSlug(title) } : null)
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
      calories: editRecipe.calories, protein_g: editRecipe.protein_g, carbs_g: editRecipe.carbs_g, fat_g: editRecipe.fat_g,
    }).eq('id', editRecipe.id)
    await supabase.from('ingredients').delete().eq('recipe_id', editRecipe.id)
    if (ingredients.length > 0) await supabase.from('ingredients').insert(ingredients.map(ing => ({ recipe_id: editRecipe.id, name: ing.name, amount: ing.amount, unit: ing.unit || null, sort_order: ing.sort_order })))
    await supabase.from('steps').delete().eq('recipe_id', editRecipe.id)
    if (steps.length > 0) await supabase.from('steps').insert(steps.map(s => ({ recipe_id: editRecipe.id, step_number: s.step_number, instruction: s.instruction })))
    await supabase.from('recipe_tags').delete().eq('recipe_id', editRecipe.id)
    if (recipeTags.length > 0) await supabase.from('recipe_tags').insert(recipeTags.map(tag_id => ({ recipe_id: editRecipe.id, tag_id })))
    setSaving(false); setEditRecipe(null); loadRecipes()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (loading) return <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-20" />

  const stats = {
    total: recipes.length,
    published: recipes.filter(r => r.is_published).length,
    drafts: recipes.filter(r => !r.is_published).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-serif font-bold text-brand-dark">Rezepte</h1>
        <Link href="/dashboard/rezept-erstellen" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">+ Neu</Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-brand-dark">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">Gesamt</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          <div className="text-xs text-gray-500 mt-0.5">Online</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.drafts}</div>
          <div className="text-xs text-gray-500 mt-0.5">Entwurf</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Titel oder Slug suchen..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-60 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="">Alle Kategorien</option>
          {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="">Alle Schwierigkeiten</option>
          <option value="Einfach">Einfach</option>
          <option value="Mittel">Mittel</option>
          <option value="Schwer">Schwer</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="">Alle Status</option>
          <option value="published">Online</option>
          <option value="draft">Entwurf</option>
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
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
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="w-10 px-2 py-3 text-center">
                  <input type="checkbox" checked={selected.size === paged.length && paged.length > 0}
                    onChange={toggleSelectAll} className="rounded border-gray-300 text-primary focus:ring-primary" />
                </th>
                <th className="text-left px-3 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('title')}>Titel{sortIcon('title')}</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Kategorie</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('difficulty')}>Schwierigkeit{sortIcon('difficulty')}</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('prep_time_minutes')}>Zeit{sortIcon('prep_time_minutes')}</th>
                <th className="text-left px-3 py-3 hidden xl:table-cell cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('view_count')}>Views{sortIcon('view_count')}</th>
                <th className="text-left px-3 py-3 hidden xl:table-cell cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('avg_rating')}>Bew.{sortIcon('avg_rating')}</th>
                <th className="text-left px-3 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('is_published')}>Status{sortIcon('is_published')}</th>
                <th className="text-left px-3 py-3 hidden xl:table-cell cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('created_at')}>Datum{sortIcon('created_at')}</th>
                <th className="text-right px-3 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(recipe => (
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
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{recipe.title}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">/{recipe.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 hidden md:table-cell">{recipe.categories?.name || '—'}</td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    {recipe.difficulty ? (
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        recipe.difficulty === 'Einfach' ? 'bg-green-50 text-green-600' :
                        recipe.difficulty === 'Mittel' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600')}>
                        {recipe.difficulty}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 hidden lg:table-cell">
                    {recipe.prep_time_minutes != null ? `${recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} Min.` : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 hidden xl:table-cell">{recipe.view_count}</td>
                  <td className="px-3 py-3 text-sm text-gray-500 hidden xl:table-cell">
                    {recipe.avg_rating != null ? `${recipe.avg_rating.toFixed(1)} (${recipe.rating_count})` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={async () => {
                      const supabase = createClient()
                      await supabase.from('recipes').update({ is_published: !recipe.is_published }).eq('id', recipe.id)
                      loadRecipes()
                    }} className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                      recipe.is_published ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                      {recipe.is_published ? 'Online' : 'Entwurf'}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-400 hidden xl:table-cell">{formatDate(recipe.created_at)}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/rezepte/${recipe.slug}`} target="_blank" className="text-xs text-gray-400 hover:text-primary transition-colors">View</Link>
                      <button onClick={() => openEdit(recipe)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Edit</button>
                      <button onClick={() => setDeleteId(recipe.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">Keine Rezepte gefunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">{filtered.length} Rezepte gesamt</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors">←</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors">→</button>
          </div>
        </div>
      )}

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
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full my-8 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-brand-dark">Rezept bearbeiten</h2>
              <button onClick={() => setEditRecipe(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {(['general', 'nutrition', 'ingredients', 'steps'] as const).map(tab => (
                <button key={tab} onClick={() => setEditTab(tab)}
                  className={cn("px-4 py-2.5 text-sm font-medium transition-colors relative",
                    editTab === tab ? 'text-primary' : 'text-gray-500 hover:text-gray-700')}>
                  {tab === 'general' ? 'Allgemein' : tab === 'nutrition' ? 'Nährwerte' : tab === 'ingredients' ? 'Zutaten' : 'Schritte'}
                  {editTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            {editTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
                    <input type="text" value={editRecipe.title} onChange={e => updateTitle(e.target.value)}
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
                    <label className="block text-xs font-medium text-gray-500 mb-1">Vorbereitungszeit (Min.)</label>
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
                    <div className="flex gap-2">
                      <input type="text" value={editRecipe.image_url ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, image_url: e.target.value || null } : null)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {editRecipe.image_url && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <Image src={editRecipe.image_url} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                        </div>
                      )}
                    </div>
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

                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-400">Erstellt:</span> <span className="text-gray-700">{formatDate(editRecipe.created_at)}</span></div>
                  <div><span className="text-gray-400">Aufrufe:</span> <span className="text-gray-700">{editRecipe.view_count}</span></div>
                  <div><span className="text-gray-400">Bewertung:</span> <span className="text-gray-700">{editRecipe.avg_rating ? `${editRecipe.avg_rating.toFixed(1)} ⭐ (${editRecipe.rating_count})` : '—'}</span></div>
                  <div><span className="text-gray-400">ID:</span> <span className="text-gray-700">#{editRecipe.id}</span></div>
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
              </div>
            )}

            {editTab === 'nutrition' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kalorien (kcal)</label>
                    <input type="number" min={0} value={editRecipe.calories ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, calories: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Eiweiß (g)</label>
                    <input type="number" min={0} step={0.1} value={editRecipe.protein_g ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, protein_g: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kohlenhydrate (g)</label>
                    <input type="number" min={0} step={0.1} value={editRecipe.carbs_g ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, carbs_g: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fett (g)</label>
                    <input type="number" min={0} step={0.1} value={editRecipe.fat_g ?? ''} onChange={e => setEditRecipe(prev => prev ? { ...prev, fat_g: e.target.value ? Number(e.target.value) : null } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>
            )}

            {editTab === 'ingredients' && (
              <div className="space-y-4">
                {ingredients.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">Noch keine Zutaten.</p>
                )}
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
                <button type="button" onClick={addIngredient} className="text-sm text-primary hover:text-primary-600 font-medium">+ Zutat hinzufügen</button>
              </div>
            )}

            {editTab === 'steps' && (
              <div className="space-y-4">
                {steps.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">Noch keine Schritte.</p>
                )}
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
                <button type="button" onClick={addStep} className="text-sm text-primary hover:text-primary-600 font-medium">+ Schritt hinzufügen</button>
              </div>
            )}

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
