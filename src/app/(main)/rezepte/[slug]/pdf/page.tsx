import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import PrintTrigger from './PrintTrigger'
import type { Recipe, Category, Tag, Ingredient, Step } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps { params: { slug: string } }

interface PdfRecipeData extends Recipe {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  tags: Pick<Tag, 'id' | 'name'>[]
  ingredients: Ingredient[]
  steps: Step[]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('recipes').select('title').eq('slug', params.slug).eq('is_published', true).single()
  return { title: data ? `${data.title} – PDF – KochWelt` : 'KochWelt' }
}

export default async function RecipePdfPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  const { data: recipe } = await supabase.from('recipes').select('*').eq('slug', params.slug).eq('is_published', true).single()
  if (!recipe) notFound()

  const { data: category } = await supabase.from('categories').select('id, name, slug').eq('id', recipe.category_id ?? 0).maybeSingle()
  const { data: ingredients } = await supabase.from('ingredients').select('*').eq('recipe_id', recipe.id).order('sort_order')
  const { data: steps } = await supabase.from('steps').select('*').eq('recipe_id', recipe.id).order('step_number')
  const { data: tagsData } = await supabase.from('recipe_tags').select('tag:tags(id, name)').eq('recipe_id', recipe.id)

  const tags = ((tagsData ?? []) as unknown[])?.map((rt: unknown) => {
    const row = rt as { tag: { id: number; name: string } | { id: number; name: string }[] }
    return Array.isArray(row.tag) ? row.tag[0] : row.tag
  }) ?? []

  const data = {
    ...recipe,
    category: category ?? null,
    tags,
    ingredients: (ingredients ?? []) as Ingredient[],
    steps: (steps ?? []) as Step[],
  } as PdfRecipeData

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min.`
    const h = Math.floor(minutes / 60)
    const rem = minutes % 60
    return rem ? `${h} Std. ${rem} Min.` : `${h} Std.`
  }

  return (
    <>
      <PrintTrigger />
      <div className="pdf-print">
        {data.image_url && (
          <div className="pdf-img">
            <Image src={data.image_url} alt={data.title} width={800} height={450} className="w-full h-auto rounded-xl object-cover" unoptimized />
          </div>
        )}

        <h1 className="font-serif text-3xl font-bold text-brand-dark mt-6 mb-2">{data.title}</h1>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mb-4">
          {data.difficulty && <span>Schwierigkeit: {data.difficulty}</span>}
          <span>Vorbereitung: {formatTime(data.prep_time_minutes || 0)}</span>
          <span>Kochen: {formatTime(data.cook_time_minutes || 0)}</span>
          <span>Gesamt: {formatTime((data.prep_time_minutes || 0) + (data.cook_time_minutes || 0))}</span>
          {data.servings && <span>Portionen: {data.servings}</span>}
          {data.category && <span>Kategorie: {data.category.name}</span>}
        </div>

        {data.description && (
          <p className="text-gray-600 leading-relaxed mb-6 max-w-3xl">{data.description}</p>
        )}

        <hr className="border-gray-200 my-6" />

        <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Zutaten</h2>
        <ul className="space-y-1 mb-8">
          {data.ingredients.map((ing, i) => (
            <li key={i} className="text-sm text-gray-700 border-b border-gray-50 pb-1">
              {ing.amount != null && <span className="font-medium">{ing.amount}</span>}
              {ing.unit && <span className="text-gray-500"> {ing.unit}</span>}
              {ing.amount != null || ing.unit ? ' ' : ''}{ing.name}
            </li>
          ))}
        </ul>

        <hr className="border-gray-200 my-6" />

        <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Zubereitung</h2>
        <ol className="space-y-4">
          {data.steps.map((step) => (
            <li key={step.id} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.step_number}</span>
              <span className="text-sm text-gray-700 leading-relaxed">{step.instruction}</span>
            </li>
          ))}
        </ol>

        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {data.tags.map((tag) => (
              <span key={tag.id} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-500">#{tag.name}</span>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-gray-400 mt-10 pt-4 border-t border-gray-100">
          Gedruckt von KochWelt
        </div>
      </div>
    </>
  )
}
