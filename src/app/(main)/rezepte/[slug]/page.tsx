import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import RecipeContent from './RecipeContent'
import type {
  Recipe,
  Profile,
  Category,
  Tag,
  Ingredient,
  Step,
  Rating,
} from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

interface RatingWithUser extends Rating {
  user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

interface RecipeDetailData extends Recipe {
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
  ingredients: Ingredient[]
  steps: Step[]
  ratings: RatingWithUser[]
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('recipes')
    .select('title, description, image_url')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!data) {
    return { title: 'Rezept nicht gefunden – KochWelt' }
  }

  return {
    title: `${data.title} – KochWelt`,
    description: data.description ?? undefined,
    openGraph: data.image_url
      ? { images: [{ url: data.image_url }] }
      : undefined,
  }
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  const { data: recipeData } = await supabase
    .from('recipes')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!recipeData) notFound()

  const { data: authorData } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', recipeData.author_id)
    .single()

  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .eq('id', recipeData.category_id ?? 0)
    .maybeSingle()

  const { data: ingredientsData } = await supabase
    .from('ingredients')
    .select('*')
    .eq('recipe_id', recipeData.id)
    .order('sort_order')

  const { data: stepsData } = await supabase
    .from('steps')
    .select('*')
    .eq('recipe_id', recipeData.id)
    .order('step_number')

  const { data: tagsData } = await supabase
    .from('recipe_tags')
    .select('tag:tags(id, name, slug)')
    .eq('recipe_id', recipeData.id)

  const { data: ratingsData } = await supabase
    .from('ratings')
    .select('*, user:profiles!user_id(id, username, display_name, avatar_url)')
    .eq('recipe_id', recipeData.id)
    .order('created_at', { ascending: false })

  const recipe = {
    ...recipeData,
    author: authorData ?? { id: '', username: 'unbekannt', display_name: '', avatar_url: null },
    category: categoryData ?? null,
    tags: tagsData?.map((rt: { tag: { id: number; name: string; slug: string } }) => rt.tag) ?? [],
    ingredients: ingredientsData ?? [],
    steps: stepsData ?? [],
    ratings: ratingsData ?? [],
  } as unknown as RecipeDetailData

  const authorName =
    recipe.author.display_name || recipe.author.username
  const hasImage = !!recipe.image_url

  let relatedRecipes: RecipeCardData[] = []
  if (recipe.category_id) {
    const { data: rel } = await supabase
      .from('recipes')
      .select(
        `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
         author:profiles!author_id(id, username, display_name, avatar_url),
         category:categories!category_id(id, name, slug, icon)`
      )
      .eq('is_published', true)
      .eq('category_id', recipe.category_id)
      .neq('id', recipe.id)
      .order('view_count', { ascending: false })
      .limit(4)

    relatedRecipes = (rel ?? []) as unknown as RecipeCardData[]
  }

  return (
    <div>
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        {hasImage ? (
          <>
            <Image
              src={recipe.image_url!}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-primary-700 to-secondary" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight">
            {recipe.title}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/profil/${recipe.author.username}`}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
              {recipe.author.avatar_url ? (
                <Image
                  src={recipe.author.avatar_url}
                  alt={authorName}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
              {authorName}
            </span>
          </Link>

          {recipe.category && (
            <Link
              href={`/kategorien/${recipe.category.slug}`}
              className="ml-auto text-sm text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              {recipe.category.icon} {recipe.category.name}
            </Link>
          )}
        </div>

        {recipe.description && (
          <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-3xl">
            {recipe.description}
          </p>
        )}

        <RecipeContent
          recipeId={recipe.id}
          servings={recipe.servings}
          difficulty={recipe.difficulty}
          prepTime={recipe.prep_time_minutes}
          cookTime={recipe.cook_time_minutes}
          title={recipe.title}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
          initialAvgRating={recipe.avg_rating}
          initialRatingCount={recipe.rating_count}
          ratings={recipe.ratings}
        />

        {recipe.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/suche?tag=${tag.slug}`}
                  className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedRecipes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="section-title mb-6">
              Ähnliche Rezepte
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
