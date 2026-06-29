import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { username: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('username', params.username)
    .single()

  if (!profile) {
    return { title: 'Profil nicht gefunden – KochWelt' }
  }

  return {
    title: `${profile.display_name || profile.username} (@${profile.username}) – KochWelt`,
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const { data: recipes } = await supabase
    .from('recipes')
    .select(
      `id, title, slug, image_url, difficulty, prep_time_minutes, avg_rating, rating_count,
       author:profiles!author_id(id, username, display_name, avatar_url),
       category:categories!category_id(id, name, slug, icon)`
    )
    .eq('author_id', profile.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const recipeList = (recipes ?? []) as unknown as RecipeCardData[]

  const memberSince = new Date(profile.created_at).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
  })

  const displayName = profile.display_name || profile.username
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-gray-500">
                {initial}
              </div>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-dark">
            {displayName}
          </h1>
          <p className="text-gray-500 mt-1">@{profile.username}</p>
          {profile.bio && (
            <p className="text-gray-600 mt-3 max-w-md">{profile.bio}</p>
          )}
          <p className="text-sm text-gray-400 mt-4">Mitglied seit {memberSince}</p>
          {user?.id === profile.id && (
            <a href="/profil/bearbeiten" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-600 font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Profil bearbeiten
            </a>
          )}
        </div>

        <h2 className="section-title mb-6">Rezepte</h2>
        {recipeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipeList.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Dieser Koch hat noch keine Rezepte veröffentlicht
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
