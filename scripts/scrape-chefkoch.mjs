import { writeFileSync } from 'fs';

const RECIPE_URLS = [
  'https://www.chefkoch.de/rezepte/1738671282836420/Yvonnes-Wikingertopf.html',
  'https://www.chefkoch.de/rezepte/1386571243753438/Schwedische-Kartoffeln.html',
  'https://www.chefkoch.de/rezepte/2109501340136606/Tagliatelle-al-Salmone.html',
  'https://www.chefkoch.de/rezepte/1062121211526182/Schnelle-Kaesespaetzle.html',
  'https://www.chefkoch.de/rezepte/1998981323763212/Koenigsberger-Klopse.html',
  'https://www.chefkoch.de/rezepte/819141186405890/Omas-beste-Frikadellen.html',
  'https://www.chefkoch.de/rezepte/3066771459189962/Low-Carb-Big-Mac-Rolle.html',
  'https://www.chefkoch.de/rezepte/2766911428603391/Indisches-Butter-Chicken-aus-dem-Ofen.html',
  'https://www.chefkoch.de/rezepte/22771005725755/Paprika-Sahne-Haehnchen.html',
  'https://www.chefkoch.de/rezepte/1069361212490339/Haehnchen-Ananas-Curry-mit-Reis.html',
  'https://www.chefkoch.de/rezepte/2133281343053838/Rinderrouladen-klassisch.html',
  'https://www.chefkoch.de/rezepte/716331174378295/Italienischer-Pizzateig.html',
  'https://www.chefkoch.de/rezepte/1953131317830499/Saftiger-Kuerbis-Gnocchi-Auflauf.html',
  'https://www.chefkoch.de/rezepte/982031203667502/Kaese-Lauch-Suppe-mit-Hackfleisch.html',
  'https://www.chefkoch.de/rezepte/1151011221381450/Der-beste-Pizzateig.html',
  'https://www.chefkoch.de/rezepte/1113761217428134/Brauhaus-Gulasch.html',
  'https://www.chefkoch.de/rezepte/431091134310048/Gulasch-nach-Oma-Magda.html',
  'https://www.chefkoch.de/rezepte/1844061298739441/Mozzarella-Haehnchen-in-Basilikum-Sahnesauce.html',
  'https://www.chefkoch.de/rezepte/1107291216818673/Schneller-Flammkuchen.html',
  'https://www.chefkoch.de/rezepte/1342761239096947/Filettopf.html',
  'https://www.chefkoch.de/rezepte/772011180069862/Die-echte-Sauce-Bolognese.html',
  'https://www.chefkoch.de/rezepte/1631611270752104/Vegetarische-Frikadellen.html',
  'https://www.chefkoch.de/rezepte/584721157629783/Spargel-mal-ganz-anders.html',
  'https://www.chefkoch.de/rezepte/745721177147257/Lasagne.html',
  'https://www.chefkoch.de/rezepte/1769341285740860/Zucchini-Lasagne.html',
  'https://www.chefkoch.de/rezepte/1491701259315451/Agis-Gyros-in-Metaxasauce.html',
  'https://www.chefkoch.de/rezepte/680021166092403/Cremiger-Nudelauflauf-mit-Tomaten-und-Mozzarella.html',
  'https://www.chefkoch.de/rezepte/978331200024886/Gefuellte-Paprika-nach-Uroma-Susanne.html',
  'https://www.chefkoch.de/rezepte/1841651298894151/Kartoffelgratin.html',
  'https://www.chefkoch.de/rezepte/2351181365247759/Grossmutters-Reibekuchen.html',
  'https://www.chefkoch.de/rezepte/2668551411066685/One-Pot-Spaetzle-mit-Haehnchen.html',
  'https://www.chefkoch.de/rezepte/2315211358860926/Maultaschen-Gratin.html',
  'https://www.chefkoch.de/rezepte/2117671341686111/Frischer-Knoepfle-Salat-mit-gruenem-Spargel-und-Bacon.html',
  'https://www.chefkoch.de/rezepte/1364741242190391/Cheese-Burger-Muffins.html',
  'https://www.chefkoch.de/rezepte/1836941286825023/Bunte-Gemuese-Spaetzle-Pfanne.html',
  'https://www.chefkoch.de/rezepte/2136211343343818/Herzhafte-Spaghetti-Bolognese.html',
];

function slugify(text) {
  return text.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function isoDurationToMinutes(iso) {
  if (!iso) return 30;
  const m = iso.match(/PT?(?:(\d+)H)?(?:(\d+)M)?/);
  return (parseInt(m?.[1] || 0) * 60) + parseInt(m?.[2] || 0) || 30;
}

function parseIngredient(str) {
  str = str.trim();
  const match = str.match(/^([\d.,\s/-]+)?\s*(?:([a-zA-ZäöüßÄÖÜ]+)\.)?\s*(.+)/);
  if (!match) return { amount: '', unit: '', name: str };
  const numStr = (match[1] || '').trim();
  let amount = numStr;
  let unit = '';
  const rest = (match[3] || str).trim();
  const unitMatch = rest.match(/^(g|ml|l|kg|dl|EL|TL|Tl|El|Pkg|Pck|Tüte|Fl|Dose|Zehe|Stk|Stück|Scheibe|Schuss|Prise|Spritzer|Tropfen|Zweig|Blatt|Handvoll|Bund|Beutel|Glas|Tasse|Becher|EL|TL)\s+(.+)/i);
  if (unitMatch) {
    unit = unitMatch[1];
    amount = (match[1] || '').trim() || '1';
    return { amount, unit: unit.toLowerCase(), name: unitMatch[2].trim() };
  }
  return { amount: amount || '', unit: '', name: rest };
}

function mapDifficulty(keywords) {
  const k = (keywords || '').toLowerCase();
  if (k.includes('simpel')) return 'Einfach';
  if (k.includes('normal') || k.includes('mittel')) return 'Mittel';
  if (k.includes('pfiffig')) return 'Schwer';
  return 'Mittel';
}

function mapCategory(keywords) {
  const k = (keywords || '').toLowerCase();
  if (k.includes('suppe') || k.includes('eintopf')) return 2;
  if (k.includes('salat')) return 7;
  if (k.includes('dessert') || k.includes('süßspeise')) return 5;
  if (k.includes('backen') || k.includes('kuchen') || k.includes('brot')) return 6;
  if (k.includes('vorspeise')) return 1;
  if (k.includes('beilage')) return 4;
  if (k.includes('getränk')) return 8;
  return 3;
}

function extractTags(keywords) {
  const k = (keywords || '').toLowerCase();
  const tags = [];
  if (k.includes('vegetarisch')) tags.push('vegetarisch');
  if (k.includes('vegan')) tags.push('vegan');
  if (k.includes('schnell') || k.includes('einfach')) tags.push('schnell');
  if (k.includes('gesund') || k.includes('low carb') || k.includes('kalorienarm')) tags.push('gesund');
  if (k.includes('grillen')) tags.push('grillen');
  if (k.includes('party')) tags.push('party');
  if (k.includes('sommer')) tags.push('sommer');
  if (k.includes('herbst') || k.includes('winter')) tags.push('herbst');
  return tags;
}

async function scrapeRecipe(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (!res.ok) { console.error(`  FAIL ${url} ${res.status}`); return null; }
    const html = await res.text();

    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (!ldMatch) { console.error(`  No JSON-LD found`); return null; }

    const data = JSON.parse(ldMatch[1]);
    const title = data.name?.replace(/ von .*$/, '') || 'Unbekannt';
    const description = data.description?.split('.')[0] + '.' || '';
    const image = data.image || '';

    const prepMinutes = isoDurationToMinutes(data.prepTime);
    const cookMinutes = isoDurationToMinutes(data.cookTime);
    const totalMinutes = isoDurationToMinutes(data.totalTime);

    const servingsMatch = typeof data.recipeYield === 'string'
      ? data.recipeYield.match(/(\d+)/)
      : null;
    const servings = servingsMatch ? parseInt(servingsMatch[1]) : 4;

    const ingredients = (data.recipeIngredient || []).map((s, i) => {
      const parsed = parseIngredient(s);
      return { name: parsed.name, amount: parsed.amount, unit: parsed.unit, sort_order: i + 1 };
    });

    const steps = [];
    const instructions = data.recipeInstructions || [];
    for (const section of instructions) {
      if (section['@type'] === 'HowToSection' && section.itemListElement) {
        for (const step of section.itemListElement) {
          steps.push({ step_number: steps.length + 1, instruction: step.text || step.name || '' });
        }
      } else if (section['@type'] === 'HowToStep') {
        steps.push({ step_number: steps.length + 1, instruction: section.text || section.name || '' });
      }
    }

    const keywords = data.keywords || '';
    const difficulty = mapDifficulty(keywords);
    const categoryId = mapCategory(keywords);
    const tags = extractTags(keywords);

    return {
      title,
      slug: slugify(title),
      description,
      image_url: image,
      category_id: categoryId,
      difficulty,
      prep_time_minutes: prepMinutes,
      cook_time_minutes: cookMinutes,
      total_time_minutes: totalMinutes,
      servings,
      keywords,
      tags,
      ingredients,
      steps,
      recipeId: url.match(/rezepte\/(\d+)/)?.[1] || '',
    };
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    return null;
  }
}

async function main() {
  const results = [];
  for (let i = 0; i < RECIPE_URLS.length; i++) {
    const url = RECIPE_URLS[i];
    const num = i + 1;
    process.stdout.write(`[${num}/${RECIPE_URLS.length}] ${url.split('/').pop()}`);
    const recipe = await scrapeRecipe(url);
    if (recipe) {
      results.push(recipe);
      process.stdout.write(` -> ${recipe.title} (${recipe.ingredients.length} Zutaten, ${recipe.steps.length} Schritte)\n`);
    } else {
      process.stdout.write(` -> FEHLGESCHLAGEN\n`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  writeFileSync('scraped-recipes.json', JSON.stringify(results, null, 2));
  writeFileSync('scraped-count.txt', String(results.length));
  console.log(`\n=== Fertig! ${results.length} Rezepte gescrapt.`);
}

main();
