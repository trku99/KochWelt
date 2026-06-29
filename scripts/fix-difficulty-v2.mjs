const SUPABASE_URL = 'https://gfoizddyfpasubchlmrw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2l6ZGR5ZnBhc3ViY2hsbXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY0MTc1NCwiZXhwIjoyMDk4MjE3NzU0fQ.cl_kOBYdJav0dNRIqT5ioQM2NQtWS6MAIfHouH7V1PU';
const h = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const f = (u, o) => fetch(u, { headers: h, ...o });

function classifyDifficulty(title, categoryId, ingCount, stepCount) {
  const t = title.toLowerCase();

  // Keywords that strongly suggest "Einfach" (easy)
  const einfachWords = ['schnell', 'schnelle', 'schnelles', 'einfach', 'einfache', 'einfaches', 'gelingsicher', 'fluffig'];
  for (const w of einfachWords) {
    if (t.includes(w)) return 'Einfach';
  }

  // Simple desserts and soups (category 2 = soups, category 5 = dessert)
  if (categoryId === 5) { // dessert
    if (stepCount <= 4) return 'Einfach';
  }
  if (categoryId === 2) { // soup
    if (ingCount <= 10) return 'Einfach';
  }

  // If few ingredients and few steps → Einfach
  if (ingCount <= 8 && stepCount <= 4) return 'Einfach';

  // If many ingredients or many steps → Schwer
  if (ingCount >= 18 || stepCount >= 8) return 'Schwer';

  // Medium by default
  return 'Mittel';
}

function estimatePrepTime(title, categoryId, ingCount, stepCount, difficulty) {
  const t = title.toLowerCase();

  if (t.includes('schnell')) return 15;
  if (t.includes('schnelle') || t.includes('schnelles')) return 15;

  // Desserts and simple dishes: 15-20 min
  if (difficulty === 'Einfach') {
    if (categoryId === 5) return 15;
    if (categoryId === 2) return 15;
    return 20;
  }

  // Medium: 25-35 min
  if (difficulty === 'Mittel') {
    if (ingCount <= 10) return 25;
    return 30;
  }

  // Hard: 40-60 min
  return 45;
}

async function main() {
  // Get recipes with ingredient and step counts
  const [recipesRaw, ingsRaw, stepsRaw] = await Promise.all([
    f(`${SUPABASE_URL}/rest/v1/recipes?select=id,title,category_id&order=id`).then(r => r.json()),
    f(`${SUPABASE_URL}/rest/v1/ingredients?select=recipe_id`).then(r => r.json()),
    f(`${SUPABASE_URL}/rest/v1/steps?select=recipe_id`).then(r => r.json()),
  ]);

  // Count ingredients and steps per recipe
  const ingCounts = {};
  for (const ing of ingsRaw) {
    ingCounts[ing.recipe_id] = (ingCounts[ing.recipe_id] || 0) + 1;
  }
  const stepCounts = {};
  for (const step of stepsRaw) {
    stepCounts[step.recipe_id] = (stepCounts[step.recipe_id] || 0) + 1;
  }

  let updated = 0;
  for (const recipe of recipesRaw) {
    const ic = ingCounts[recipe.id] || 0;
    const sc = stepCounts[recipe.id] || 0;
    const diff = classifyDifficulty(recipe.title, recipe.category_id, ic, sc);
    const prep = estimatePrepTime(recipe.title, recipe.category_id, ic, sc, diff);

    const res = await f(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipe.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ difficulty: diff, prep_time_minutes: prep }),
    });

    if (res.ok) {
      console.log(`[${recipe.id}] ${recipe.title} → ${diff}, ${prep} Min. (${ic} Z, ${sc} S)`);
      updated++;
    } else {
      console.log(`[${recipe.id}] FAIL: ${await res.text()}`);
    }
  }

  console.log(`\n=== ${updated}/${recipesRaw.length} updated ===`);
}

main();
