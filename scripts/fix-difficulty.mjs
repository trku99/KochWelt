import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://gfoizddyfpasubchlmrw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2l6ZGR5ZnBhc3ViY2hsbXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY0MTc1NCwiZXhwIjoyMDk4MjE3NzU0fQ.cl_kOBYdJav0dNRIqT5ioQM2NQtWS6MAIfHouH7V1PU';
const headers = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

function slugify(text) {
  return text.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function mapDifficulty(keywords) {
  const k = (keywords || '').toLowerCase();
  if (k.includes('simpel')) return 'Einfach';
  if (k.includes('normal') || k.includes('mittel')) return 'Mittel';
  if (k.includes('pfiffig') || k.includes('professionell')) return 'Schwer';
  return null; // not found
}

function isoDurationToMinutes(iso) {
  if (!iso) return null;
  const m = iso.match(/PT?(?:(\d+)H)?(?:(\d+)M)?/);
  return (parseInt(m?.[1] || 0) * 60) + parseInt(m?.[2] || 0) || null;
}

// Build URL list from both scraper files
function getAllUrls() {
  const urls = [];

  // From scrape-chefkoch.mjs
  const batch1 = [
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
  urls.push(...batch1);

  // From scrape-more.mjs (all NEW_URLS)
  const batch2 = [
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
  urls.push(...batch2);
  return urls;
}

// Build a slug -> URL map using chefkoch URL slugs
function buildSlugUrlMap(urls) {
  const map = {};
  for (const url of urls) {
    const match = url.match(/rezepte\/\d+\/(.+)\.html/);
    if (match) {
      const chefkochSlug = slugify(match[1]);
      map[chefkochSlug] = url;
    }
  }
  return map;
}

async function main() {
  const allUrls = getAllUrls();
  const slugUrlMap = buildSlugUrlMap(allUrls);
  console.log(`URL map has ${Object.keys(slugUrlMap).length} entries`);

  // Get all recipes from DB
  const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=id,title,slug&order=id`, { headers });
  const recipes = await res.json();
  console.log(`Got ${recipes.length} recipes from DB`);

  let success = 0;
  let notFound = 0;

  for (const recipe of recipes) {
    const baseSlug = recipe.slug.replace(/-\d+$/, ''); // Remove duplicate suffixes like -0
    const titleSlug = slugify(recipe.title.replace(/ von .*$/, '').replace(/!$/, '').replace(/:/g, '').replace(/,/g, '').trim());
    
    // Try multiple slug variants to find the URL
    let targetUrl = slugUrlMap[baseSlug] || slugUrlMap[recipe.slug] || slugUrlMap[titleSlug];
    
    // Try with "schnelle" vs "schnelles" etc.
    if (!targetUrl) {
      for (const [s, u] of Object.entries(slugUrlMap)) {
        if (s.includes(baseSlug.replace(/^schnelle-/, 'schnell-').replace(/^schnelles-/, 'schnell-').replace(/^einfache-/, 'einfach-').replace(/^einfaches-/, 'einfach-'))) {
          targetUrl = u;
          break;
        }
      }
    }

    if (!targetUrl) {
      console.log(`[${recipe.id}] ${recipe.title} -> no URL found (base: ${baseSlug}, title: ${titleSlug})`);
      notFound++;
      continue;
    }
    process.stdout.write(`[${recipe.id}] ${recipe.title}... `);

    try {
      const htmlRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      });
      if (!htmlRes.ok) { console.log(`HTTP ${htmlRes.status}`); notFound++; continue; }
      const html = await htmlRes.text();

      const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
      if (!ldMatch) { console.log('no JSON-LD'); notFound++; continue; }

      const data = JSON.parse(ldMatch[1]);
      const keywords = data.keywords || '';
      const difficulty = mapDifficulty(keywords);
      const prepTime = isoDurationToMinutes(data.prepTime) || isoDurationToMinutes(data.totalTime) || null;

      if (!difficulty && !prepTime) { console.log('no data found'); notFound++; continue; }

      // Update DB
      const updateData = {};
      if (difficulty) updateData.difficulty = difficulty;
      if (prepTime) updateData.prep_time_minutes = prepTime;

      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipe.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(updateData),
      });

      if (updateRes.ok) {
        console.log(`OK → ${difficulty || '?'}, ${prepTime || '?'} Min.`);
        success++;
      } else {
        console.log(`UPDATE FAIL: ${await updateRes.text()}`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n=== ${success} updated, ${notFound} not found ===`);
}

main();
