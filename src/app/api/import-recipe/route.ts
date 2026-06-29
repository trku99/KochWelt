import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL erforderlich' }, { status: 400 })
  }

  try {
    const html = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KochWelt/1.0)' },
      signal: AbortSignal.timeout(10000),
    }).then(r => r.text())

    const ldRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    let match: RegExpExecArray | null
    let recipeData: Record<string, unknown> | null = null

    while ((match = ldRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim())
        const items = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of items) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            recipeData = item
            break
          }
          if (item['@graph']) {
            for (const g of item['@graph']) {
              if (g['@type'] === 'Recipe' || (Array.isArray(g['@type']) && g['@type'].includes('Recipe'))) {
                recipeData = g
                break
              }
            }
          }
        }
      } catch { continue }
      if (recipeData) break
    }

    if (!recipeData) {
      return NextResponse.json({ error: 'Kein Rezept auf dieser Seite gefunden' }, { status: 404 })
    }

    const title = (recipeData.name as string) || ''
    const description = (recipeData.description as string) || ''
    const image = (() => {
      const img = recipeData.image
      if (!img) return null
      if (typeof img === 'string') return img
      if (Array.isArray(img)) return typeof img[0] === 'string' ? img[0] : null
      if (typeof img === 'object' && img && 'url' in img) return (img as { url: string }).url
      return null
    })()

    const prepTime = (() => {
      const t = recipeData.prepTime as string
      if (!t) return 0
      const m = t.match(/(\d+)/)
      return m ? parseInt(m[1]) : 0
    })()

    const cookTime = (() => {
      const t = recipeData.cookTime as string
      if (!t) return 0
      const m = t.match(/(\d+)/)
      return m ? parseInt(m[1]) : 0
    })()

    const totalTime = (() => {
      const t = recipeData.totalTime as string
      if (!t) return prepTime + cookTime
      const m = t.match(/(\d+)/)
      return m ? parseInt(m[1]) : prepTime + cookTime
    })()

    const recipeYield = (() => {
      const y = recipeData.recipeYield
      if (!y) return 4
      if (typeof y === 'string') {
        const m = y.match(/(\d+)/)
        return m ? parseInt(m[1]) : 4
      }
      if (Array.isArray(y) && y.length > 0) {
        const m = y[0].match(/(\d+)/)
        return m ? parseInt(m[1]) : 4
      }
      return 4
    })()

    const difficulty = (() => {
      const keywords = recipeData.keywords as string | undefined
      if (!keywords) return 'Mittel'
      const kw = keywords.toLowerCase()
      if (kw.includes('simpel') || kw.includes('einfach')) return 'Einfach'
      if (kw.includes('normal') || kw.includes('mittel')) return 'Mittel'
      if (kw.includes('pfiffig') || kw.includes('schwer')) return 'Schwer'
      return 'Mittel'
    })()

    const ingredients: { name: string; amount: number | null; unit: string | null }[] = []
    const rawIngredients = recipeData.recipeIngredient
    if (Array.isArray(rawIngredients)) {
      for (const line of rawIngredients) {
        const str = String(line).trim()
        if (!str) continue
        const match = str.match(/^([\d.,/\s]+)?\s*(g|ml|l|kg|el|tl|cl|dl|tropfen|prise|stück|beutel|dose|packung|bund|zehe|scheiben|ring|blatt)?\s*(.+)/i)
        if (match) {
          ingredients.push({
            amount: match[1] ? parseFloat(match[1].replace(',', '.')) : null,
            unit: match[2] ? match[2].toLowerCase() : null,
            name: match[3].trim(),
          })
        } else {
          ingredients.push({ name: str, amount: null, unit: null })
        }
      }
    }

    const steps: { instruction: string }[] = []
    const rawSteps = recipeData.recipeInstructions
    if (Array.isArray(rawSteps)) {
      for (const s of rawSteps) {
        if (typeof s === 'string') {
          steps.push({ instruction: s })
        } else if (s && typeof s === 'object' && s['@type'] === 'HowToStep') {
          const text = (s as { text?: string }).text || ''
          if (text) steps.push({ instruction: text })
        } else if (s && typeof s === 'object' && s['@type'] === 'HowToSection') {
          const section = s as { name?: string; itemListElement?: { text?: string }[] }
          if (section.name) steps.push({ instruction: `**${section.name}**` })
          if (section.itemListElement) {
            for (const item of section.itemListElement) {
              if (item.text) steps.push({ instruction: item.text })
            }
          }
        }
      }
    }

    const category = (() => {
      const c = recipeData.recipeCategory
      if (!c) return null
      return Array.isArray(c) ? c[0] : c
    })()

    const tags: string[] = []
    if (recipeData.keywords) {
      const kw = String(recipeData.keywords)
      tags.push(...kw.split(',').map((s: string) => s.trim()).filter(Boolean))
    }
    if (recipeData.recipeCuisine) {
      const c = recipeData.recipeCuisine
      tags.push(...(Array.isArray(c) ? c : [c]))
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        image_url: image,
        prep_time_minutes: totalTime || prepTime || 0,
        cook_time_minutes: cookTime || 0,
        servings: recipeYield,
        difficulty,
        category,
        ingredients,
        steps,
        tags,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fehler beim Abrufen der URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
