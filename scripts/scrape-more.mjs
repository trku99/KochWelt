import { readFileSync, writeFileSync } from 'fs';

const NEW_URLS = [
  'https://www.chefkoch.de/rezepte/1031841208350942/Kaiserschmarrn-Tiroler-Landgasthofrezept.html',
  'https://www.chefkoch.de/rezepte/1033821208509812/Kartoffelsuppe.html',
  'https://www.chefkoch.de/rezepte/1066811212153175/Schwedische-Sommersuppe.html',
  'https://www.chefkoch.de/rezepte/1082601214031394/Himbeertraum.html',
  'https://www.chefkoch.de/rezepte/1113191217348957/Schnelles-Himbeer-Dessert.html',
  'https://www.chefkoch.de/rezepte/1116671217775800/Schokosoufflee-medium.html',
  'https://www.chefkoch.de/rezepte/1122481218552589/Schichtdessert-mit-Weintrauben.html',
  'https://www.chefkoch.de/rezepte/1152361221481605/Spaghetti-Eis-Dessert.html',
  'https://www.chefkoch.de/rezepte/1153081221555008/Der-perfekte-Milchreis-Grundrezept.html',
  'https://www.chefkoch.de/rezepte/115421048694976/Apfelmus.html',
  'https://www.chefkoch.de/rezepte/1159171222074763/Apple-Crumble.html',
  'https://www.chefkoch.de/rezepte/1205621226313744/Amerikanische-Pancakes.html',
  'https://www.chefkoch.de/rezepte/1218701227361593/Apfel-Crumble.html',
  'https://www.chefkoch.de/rezepte/1254101230656287/Dessert-mit-Weintrauben.html',
  'https://www.chefkoch.de/rezepte/1277281233088043/Kuerbissuppe.html',
  'https://www.chefkoch.de/rezepte/1320901236931593/Raffaello-Creme.html',
  'https://www.chefkoch.de/rezepte/1373751242290581/Frische-Tomatensuppe.html',
  'https://www.chefkoch.de/rezepte/1385291243604216/Bauerntopf.html',
  'https://www.chefkoch.de/rezepte/1415521246449438/Berliner-Kartoffelsuppe.html',
  'https://www.chefkoch.de/rezepte/1435261248423748/Mehlschwitze-gelingsicher.html',
  'https://www.chefkoch.de/rezepte/1496221254923514/Gulaschsuppe-a-la-Tick.html',
  'https://www.chefkoch.de/rezepte/1499261255443923/Tiramisu-mit-Spekulatius-und-Himbeeren.html',
  'https://www.chefkoch.de/rezepte/1540431260282175/Joghurt-Bombe.html',
  'https://www.chefkoch.de/rezepte/1546711261146783/Bunter-Hackfleisch-Gemuese-Eintopf.html',
  'https://www.chefkoch.de/rezepte/1565731264063151/Kuerbiscremesuppe.html',
  'https://www.chefkoch.de/rezepte/1578721265354850/Hackfleisch-Lauch-Suppe.html',
  'https://www.chefkoch.de/rezepte/1594161266675503/Erbseneintopf-nach-Bundeswehrrezept.html',
  'https://www.chefkoch.de/rezepte/1597871267020573/Hackbaellchen-Toscana.html',
  'https://www.chefkoch.de/rezepte/1621551269365447/Leckere-Kartoffel-Moehren-Suppe.html',
  'https://www.chefkoch.de/rezepte/1651831272990064/Pikante-Thai-Suppe-mit-Kokos-und-Huehnchen.html',
  'https://www.chefkoch.de/rezepte/1718481280523737/Rote-Linsen-Kokos-Suppe.html',
  'https://www.chefkoch.de/rezepte/1731381282223663/Rhabarberkompott.html',
  'https://www.chefkoch.de/rezepte/1748901284210089/Dicke-Obst-Pfannkuchen.html',
  'https://www.chefkoch.de/rezepte/1804511291817891/Ramen-Japanische-Nudelsuppe-mit-Huehnerbruehe-und-Schweinefilet.html',
  'https://www.chefkoch.de/rezepte/1816341294440474/Himbeerdessert-mit-Spekulatius.html',
  'https://www.chefkoch.de/rezepte/18351004366867/Kartoffelsuppe.html',
  'https://www.chefkoch.de/rezepte/18471004448751/Partysuppe-a-la-Karin.html',
  'https://www.chefkoch.de/rezepte/1857511300993833/Winterliche-Maronensuppe.html',
  'https://www.chefkoch.de/rezepte/1900361309694639/Altbaerlis-Kaiserschmarrn.html',
  'https://www.chefkoch.de/rezepte/2093341337948044/Rhabarber-Crumble.html',
  'https://www.chefkoch.de/rezepte/2096771338404215/Solero-Dessert.html',
  'https://www.chefkoch.de/rezepte/210591088150766/Soljanka-nach-Mama-Art.html',
  'https://www.chefkoch.de/rezepte/2120381341499440/Melonen-Hai.html',
  'https://www.chefkoch.de/rezepte/2183131350572745/Deftige-Gulaschsuppe.html',
  'https://www.chefkoch.de/rezepte/2213181354608975/Cremige-Kuerbissuppe-mit-Aepfeln-Karotten-und-Kartoffeln.html',
  'https://www.chefkoch.de/rezepte/225151092832424/Goldgelbe-Huehnersuppe.html',
  'https://www.chefkoch.de/rezepte/2293561365672708/Gulaschsuppe-im-Kessel-oder-Topf.html',
  'https://www.chefkoch.de/rezepte/2524101395752088/Gemuesecremesuppe.html',
  'https://www.chefkoch.de/rezepte/2529831396465550/Pfannkuchen-Crepe-und-Pancake.html',
  'https://www.chefkoch.de/rezepte/259781101566295/Kuerbissuppe-mit-Ingwer-und-Kokosmilch.html',
  'https://www.chefkoch.de/rezepte/264171102553424/Tiramisu.html',
  'https://www.chefkoch.de/rezepte/279041105901002/Creme-brulee.html',
  'https://www.chefkoch.de/rezepte/2842301436274891/Gefuellte-Buchteln.html',
  'https://www.chefkoch.de/rezepte/2928541445182001/Ofen-Tomatensuppe.html',
  'https://www.chefkoch.de/rezepte/2997561452604004/Haehnchen-Curry-Lauch-Suppe.html',
  'https://www.chefkoch.de/rezepte/305391110829449/Einfache-Kartoffelsuppe.html',
  'https://www.chefkoch.de/rezepte/3131821466495546/Mirror-Glaze-Mousse-Toertchen.html',
  'https://www.chefkoch.de/rezepte/3236611481530469/Chocolate-Crinkles.html',
  'https://www.chefkoch.de/rezepte/3432961511438145/Cheese-Burger-Muffins.html',
  'https://www.chefkoch.de/rezepte/3497191521042462/Omas-Huehnersuppe.html',
  'https://www.chefkoch.de/rezepte/3574341536659464/Maultaschen-Spinat-Auflauf.html',
  'https://www.chefkoch.de/rezepte/3740951568031314/Currysuppe-mit-Maultaschen.html',
  'https://www.chefkoch.de/rezepte/386231125240691/Feine-Linsensuppe.html',
  'https://www.chefkoch.de/rezepte/4010911616160576/Knusprige-Fruehlingsrollen.html',
  'https://www.chefkoch.de/rezepte/4157681663829150/Kalte-Rote-Bete-Suppe.html',
  'https://www.chefkoch.de/rezepte/4178471669793453/Espresso-Pannacotta-mit-Mangososse.html',
  'https://www.chefkoch.de/rezepte/4179211669969666/Petersilienwurzelsuppe-mit-Oliven-Sticks.html',
  'https://www.chefkoch.de/rezepte/4190841673426817/Pastinaken-Samtsuppe-mit-geroesteten-Mandeln-Apfel-und-Staudensellerie.html',
  'https://www.chefkoch.de/rezepte/4198171675420287/Griess-Pancakes-mit-Obstragout.html',
  'https://www.chefkoch.de/rezepte/4232331686906615/Millefeuille-mit-Mascarponecreme-und-Amarenakirschen.html',
  'https://www.chefkoch.de/rezepte/4236351688377783/Sommer-Minestrone-mit-Tomaten-Pesto.html',
  'https://www.chefkoch.de/rezepte/4236871688473147/Rote-Linsen-Eintopf-mit-Chorizo-und-Garnelen.html',
  'https://www.chefkoch.de/rezepte/4310201717409304/Schokoladenpudding.html',
  'https://www.chefkoch.de/rezepte/4313151718620719/Zimtbroetchen-Bananen-Spiess-mit-Rumsahne.html',
  'https://www.chefkoch.de/rezepte/4355821737448508/Safransuppe-mit-Fischnocken-und-Garnelen.html',
  'https://www.chefkoch.de/rezepte/4366721742979194/Rhabarber-Pfannkuchen-mit-Mascarpone.html',
  'https://www.chefkoch.de/rezepte/4369601744015758/Knusprige-Flammkuchentaschen-mit-Feta-und-Spinat-aus-dem-Airfryer.html',
  'https://www.chefkoch.de/rezepte/4370711744365634/Herzhafte-Spaghetti-Bolognese.html',
  'https://www.chefkoch.de/rezepte/4370741744365716/Cremiges-Kartoffelgratin.html',
  'https://www.chefkoch.de/rezepte/4370751744365727/Wuerzige-Kaese-Lauch-Suppe.html',
  'https://www.chefkoch.de/rezepte/4370761744365737/Leichter-Kartoffelsalat.html',
  'https://www.chefkoch.de/rezepte/4385321753191296/Blaetterteig-Taschen-mit-Aprikosen-Nuss-Fuellung.html',
  'https://www.chefkoch.de/rezepte/4430681780309590/Frischer-Sommersalat-mit-krossen-Kartoffel-Gnocchi-Garnelen-und-Avocado.html',
  'https://www.chefkoch.de/rezepte/51361018096290/Crepes.html',
  'https://www.chefkoch.de/rezepte/522711148577087/Erdbeertiramisu.html',
  'https://www.chefkoch.de/rezepte/639171164876057/Lebkuchenparfait-mit-Gewuerzorangen.html',
  'https://www.chefkoch.de/rezepte/701641172761306/Kuerbissuppe.html',
  'https://www.chefkoch.de/rezepte/761551178884059/Deftige-Erbsensuppe.html',
  'https://www.chefkoch.de/rezepte/800701183710671/Mascarpone-Himbeerquark.html',
  'https://www.chefkoch.de/rezepte/817681186299057/Birnen-in-Rotwein-an-Vanilleeis.html',
  'https://www.chefkoch.de/rezepte/845091189864506/Omas-Pizzasuppe.html',
  'https://www.chefkoch.de/rezepte/873851192726467/Kuerbissuppe-mit-Ingwer-und-Kokos.html',
  'https://www.chefkoch.de/rezepte/90891035388170/Mousse-au-chocolat.html',
  'https://www.chefkoch.de/rezepte/914011196708021/Kaese-Sahne-Dessert.html',
  'https://www.chefkoch.de/rezepte/914031196710118/Griessbrei-von-Grossmutter.html',
  'https://www.chefkoch.de/rezepte/982331203688547/Italienische-Minestrone.html',
];

// Filter out URLs we already tried
const alreadyDone = new Set([
  '1738671282836420', '1386571243753438', '2109501340136606', '1062121211526182',
  '1998981323763212', '819141186405890', '3066771459189962', '2766911428603391',
  '22771005725755', '1069361212490339', '2133281343053838', '716331174378295',
  '1953131317830499', '982031203667502', '1151011221381450', '1113761217428134',
  '431091134310048', '1844061298739441', '1107291216818673', '1342761239096947',
  '772011180069862', '1631611270752104', '584721157629783', '745721177147257',
]);

const urls = NEW_URLS.filter(u => {
  const id = u.match(/rezepte\/(\d+)/)?.[1];
  return id && !alreadyDone.has(id);
});

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
  const unitMatch = str.match(/^([\d.,\s/-]+)?\s*(g|ml|l|kg|dl|EL|TL|Pkg|Pck|Tüte|Fl|Dose|Zehe|Stk|Stück|Scheibe|Schuss|Prise|Spritzer|Tropfen|Zweig|Blatt|Handvoll|Bund|Beutel|Glas|Tasse|Becher|EL|TL|cl|Pkt|Tafel|Würfel|Prisen|Msp)\.?\s+(.+)/i);
  if (unitMatch) {
    return { amount: (unitMatch[1] || '1').trim(), unit: unitMatch[2].toLowerCase(), name: unitMatch[3].trim() };
  }
  const noUnit = str.match(/^([\d.,\s/-]+)\s+(.+)/);
  if (noUnit) {
    return { amount: noUnit[1].trim(), unit: '', name: noUnit[2].trim() };
  }
  return { amount: '', unit: '', name: str };
}

function mapDifficulty(keywords) {
  const k = (keywords || '').toLowerCase();
  if (k.includes('simpel')) return 'Einfach';
  if (k.includes('normal')) return 'Mittel';
  if (k.includes('pfiffig')) return 'Schwer';
  return 'Mittel';
}

function mapCategory(keywords, title) {
  const k = (keywords || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (k.includes('suppe') || k.includes('eintopf') || t.includes('suppe') || t.includes('eintopf')) return 2;
  if (k.includes('salat') || t.includes('salat')) return 7;
  if (k.includes('dessert') || k.includes('süßspeise') || t.includes('dessert') || t.includes('creme') || t.includes('eis') || t.includes('tiramisu') || t.includes('pudding')) return 5;
  if (k.includes('backen') || k.includes('kuchen') || k.includes('brot') || t.includes('kuchen') || t.includes('brot') || t.includes('pfannkuchen')) return 6;
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
  if (k.includes('gesund') || k.includes('low carb') || k.includes('kalorienarm') || k.includes('fettarm')) tags.push('gesund');
  if (k.includes('grillen')) tags.push('grillen');
  if (k.includes('party')) tags.push('party');
  if (k.includes('sommer')) tags.push('sommer');
  if (k.includes('herbst') || k.includes('winter')) tags.push('herbst');
  return tags;
}

async function scrapeRecipe(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (!res.ok) { return null; }
    const html = await res.text();

    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (!ldMatch) return null;

    const data = JSON.parse(ldMatch[1]);
    const title = data.name?.replace(/ von .*$/, '') || 'Unbekannt';
    const description = (data.description?.split('.')[0] || '').substring(0, 200) + '.';
    const image = data.image || '';

    const prepMinutes = isoDurationToMinutes(data.prepTime);
    const cookMinutes = isoDurationToMinutes(data.cookTime);

    const servingsMatch = typeof data.recipeYield === 'string' ? data.recipeYield.match(/(\d+)/) : null;
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
    const categoryId = mapCategory(keywords, title);
    const tags = extractTags(keywords);

    return {
      title, slug: slugify(title), description,
      image_url: image, category_id: categoryId,
      difficulty, prep_time_minutes: prepMinutes,
      cook_time_minutes: cookMinutes, servings,
      keywords, tags, ingredients, steps,
    };
  } catch (err) {
    return null;
  }
}

async function main() {
  const existing = [];
  try { existing.push(...JSON.parse(readFileSync('scraped-recipes.json', 'utf8'))); } catch {}
  const existingSlugs = new Set(existing.map(r => r.slug));
  const results = [...existing];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const num = i + 1;
    process.stdout.write(`[${num}/${urls.length}] ${url.split('/').pop()}`);
    const recipe = await scrapeRecipe(url);
    if (recipe) {
      if (!existingSlugs.has(recipe.slug)) {
        results.push(recipe);
        existingSlugs.add(recipe.slug);
        process.stdout.write(` -> ${recipe.title} (${recipe.ingredients.length} Z, ${recipe.steps.length} S)\n`);
      } else {
        process.stdout.write(` -> DUPLICATE\n`);
      }
    } else {
      process.stdout.write(` -> FAIL\n`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  writeFileSync('scraped-recipes.json', JSON.stringify(results, null, 2));
  writeFileSync('scraped-count.txt', String(results.length));
  console.log(`\n=== ${results.length} Rezepte gesamt (${results.length - existing.length} neue)`);
}

main();
