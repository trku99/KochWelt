-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  description TEXT
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL USING (false);

-- Tags
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT USING (true);

CREATE POLICY "Only admins can manage tags"
  ON tags FOR ALL USING (false);

-- Recipes
CREATE TABLE recipes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Einfach', 'Mittel', 'Schwer')),
  prep_time_minutes INTEGER NOT NULL DEFAULT 0,
  cook_time_minutes INTEGER NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 4,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector TSVECTOR
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published recipes are viewable by everyone"
  ON recipes FOR SELECT USING (is_published = true);

CREATE POLICY "Authors can view their own unpublished recipes"
  ON recipes FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert recipes"
  ON recipes FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own recipes"
  ON recipes FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own recipes"
  ON recipes FOR DELETE USING (auth.uid() = author_id);

-- Recipe Tags (many-to-many)
CREATE TABLE recipe_tags (
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipe tags are viewable by everyone"
  ON recipe_tags FOR SELECT USING (true);

CREATE POLICY "Authors can manage recipe tags"
  ON recipe_tags FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));
CREATE POLICY "Authors can delete recipe tags"
  ON recipe_tags FOR DELETE USING (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));

-- Ingredients
CREATE TABLE ingredients (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2),
  unit TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingredients are viewable by everyone"
  ON ingredients FOR SELECT USING (true);

CREATE POLICY "Authors can manage ingredients"
  ON ingredients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));
CREATE POLICY "Authors can update ingredients"
  ON ingredients FOR UPDATE USING (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));
CREATE POLICY "Authors can delete ingredients"
  ON ingredients FOR DELETE USING (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));

-- Steps
CREATE TABLE steps (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  image_url TEXT,
  UNIQUE(recipe_id, step_number)
);

ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Steps are viewable by everyone"
  ON steps FOR SELECT USING (true);

CREATE POLICY "Authors can manage steps"
  ON steps FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));
CREATE POLICY "Authors can update steps"
  ON steps FOR UPDATE USING (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));
CREATE POLICY "Authors can delete steps"
  ON steps FOR DELETE USING (EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND author_id = auth.uid()));

-- Ratings
CREATE TABLE ratings (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can rate"
  ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON ratings FOR DELETE USING (auth.uid() = user_id);

-- Saved Recipes
CREATE TABLE saved_recipes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved recipes"
  ON saved_recipes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes"
  ON saved_recipes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved recipes"
  ON saved_recipes FOR DELETE USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('german', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_search_vector
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- View counter increment function (bypass RLS)
CREATE OR REPLACE FUNCTION increment_view_count(recipe_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE recipes SET view_count = view_count + 1 WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Average rating update trigger
CREATE OR REPLACE FUNCTION update_recipe_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_score DECIMAL(3,2);
BEGIN
  SELECT ROUND(AVG(score)::DECIMAL, 2) INTO avg_score FROM ratings WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  UPDATE recipes SET avg_rating = avg_score WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add avg_rating column to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_recipe_rating_counts()
RETURNS TRIGGER AS $$
DECLARE
  r_id BIGINT;
  cnt INTEGER;
  avg_score DECIMAL(3,2);
BEGIN
  r_id := COALESCE(NEW.recipe_id, OLD.recipe_id);
  SELECT COUNT(*), ROUND(AVG(score)::DECIMAL, 2) INTO cnt, avg_score FROM ratings WHERE recipe_id = r_id;
  UPDATE recipes SET rating_count = cnt, avg_rating = COALESCE(avg_score, 0) WHERE id = r_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_recipe_rating ON ratings;
CREATE TRIGGER trg_update_recipe_rating
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_counts();

-- Slug generation function
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(regexp_replace(title, '[^a-zA-ZäöüÄÖÜß\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' FROM base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM recipes WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
