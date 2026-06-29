import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function downloadImage(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.split('/')[1] || 'jpg'
  return { buffer, contentType, ext }
}

async function main() {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, image_url')
    .not('image_url', 'is', null)

  if (error) { console.error(error); return }
  console.log(`${recipes.length} recipes with images found`)

  let migrated = 0, failed = 0

  for (const recipe of recipes) {
    const url = recipe.image_url
    // skip already-migrated (pointing to own storage)
    if (url.includes(supabaseUrl)) { migrated++; continue }

    try {
      console.log(`[${migrated + 1}/${recipes.length}] Downloading: ${url}`)
      const { buffer, contentType } = await downloadImage(url)
      const fileName = `recipe-${recipe.id}-${Date.now()}.${contentType.split('/')[1] || 'jpg'}`

      const { data: upload, error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, buffer, { contentType, upsert: true })

      if (uploadError) { throw uploadError }

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: publicUrl })
        .eq('id', recipe.id)

      if (updateError) { throw updateError }

      console.log(`  -> ${publicUrl}`)
      migrated++
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${migrated} migrated, ${failed} failed`)
}

main()
