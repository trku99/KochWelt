export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Difficulty = 'Einfach' | 'Mittel' | 'Schwer'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  description: string | null
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface Recipe {
  id: number
  title: string
  slug: string
  description: string | null
  author_id: string
  category_id: number | null
  difficulty: Difficulty
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url: string | null
  is_published: boolean
  view_count: number
  created_at: string
  avg_rating: number | null
  rating_count: number | null
}

export interface Ingredient {
  id: number
  recipe_id: number
  name: string
  amount: number | null
  unit: string | null
  sort_order: number
}

export interface Step {
  id: number
  recipe_id: number
  step_number: number
  instruction: string
  image_url: string | null
}

export interface Rating {
  id: number
  recipe_id: number
  user_id: string
  score: number
  comment: string | null
  created_at: string
}

export interface SavedRecipe {
  user_id: string
  recipe_id: number
  saved_at: string
}

export interface RecipeWithRelations extends Recipe {
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null
  tags: (Pick<Tag, 'id' | 'name' | 'slug'>)[]
  ingredients: Ingredient[]
  steps: Step[]
}
