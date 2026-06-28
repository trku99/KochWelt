import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://gfoizddyfpasubchlmrw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2l6ZGR5ZnBhc3ViY2hsbXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY0MTc1NCwiZXhwIjoyMDk4MjE3NzU0fQ.cl_kOBYdJav0dNRIqT5ioQM2NQtWS6MAIfHouH7V1PU';
const AUTHOR_ID = '00000000-0000-0000-0000-000000000001';

const recipes = JSON.parse(readFileSync('scraped-recipes.json', 'utf8'));

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const TAG_MAP = {
  'vegetarisch': 1, 'vegan': 2, 'schnell': 5, 'gesund': 6,
  'party': 7, 'grillen': 8, 'sommer': 10, 'herbst': 9,
};

async function getRecipeBySlug(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recipes?slug=eq.${slug}&select=id`,
    { headers: { ...headers, Prefer: '' } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.id || null;
}

async function insertRecipe(recipe, index) {
  const existing = await getRecipeBySlug(recipe.slug);
  if (existing) {
    console.log(`SKIP (already exists, id=${existing})`);
    return existing;
  }

  let slug = recipe.slug;
  // 1. Insert recipe
  const recipeBody = {
    title: recipe.title,
    slug,
    description: recipe.description,
    author_id: AUTHOR_ID,
    category_id: recipe.category_id,
    difficulty: recipe.difficulty,
    prep_time_minutes: recipe.prep_time_minutes || 30,
    cook_time_minutes: recipe.cook_time_minutes || 0,
    servings: recipe.servings || 4,
    image_url: recipe.image_url,
    is_published: true,
  };

  const recipeRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(recipeBody),
  });

  if (!recipeRes.ok) {
    const errText = await recipeRes.text();
    if (errText.includes('recipes_slug_key')) {
      slug = `${recipe.slug}-${index}`;
      recipeBody.slug = slug;
      const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(recipeBody),
      });
      if (!retryRes.ok) {
        console.error(`FAIL: ${await retryRes.text()}`);
        return null;
      }
      const retryData = await retryRes.json();
      if (!retryData?.length) return null;
      const rid = retryData[0].id;
      await insertRelations(rid, recipe);
      return rid;
    }
    console.error(`FAIL: ${errText.substring(0, 200)}`);
    return null;
  }

  const data = await recipeRes.json();
  if (!data?.length) {
    const found = await getRecipeBySlug(slug);
    if (found) {
      await insertRelations(found, recipe);
      return found;
    }
    return null;
  }

  const recipeId = data[0].id;
  await insertRelations(recipeId, recipe);
  return recipeId;
}

async function insertRelations(recipeId, recipe) {
  if (recipe.ingredients?.length > 0) {
    const rows = recipe.ingredients.map(ing => ({
      recipe_id: recipeId, name: ing.name,
      amount: ing.amount || null, unit: ing.unit || null,
      sort_order: ing.sort_order,
    }));
    await fetch(`${SUPABASE_URL}/rest/v1/ingredients`, {
      method: 'POST', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
  }

  if (recipe.steps?.length > 0) {
    const rows = recipe.steps.map(step => ({
      recipe_id: recipeId, step_number: step.step_number, instruction: step.instruction,
    }));
    await fetch(`${SUPABASE_URL}/rest/v1/steps`, {
      method: 'POST', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
  }

  if (recipe.tags?.length > 0) {
    const rows = recipe.tags.map(t => TAG_MAP[t]).filter(Boolean).map(tagId => ({
      recipe_id: recipeId, tag_id: tagId,
    }));
    if (rows.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/recipe_tags`, {
        method: 'POST', headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(rows),
      });
    }
  }
}

async function main() {
  let success = 0;
  for (let i = 0; i < recipes.length; i++) {
    process.stdout.write(`[${i + 1}/${recipes.length}] ${recipes[i].title}... `);
    const id = await insertRecipe(recipes[i], i);
    console.log(id ? `OK (id=${id})` : 'FAILED');
    if (id) success++;
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`\n=== ${success}/${recipes.length} Rezepte importiert.`);
}

main();
