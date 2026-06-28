import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Ungültige Rezept-ID' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !recipe) {
      return NextResponse.json({ error: 'Rezept nicht gefunden' }, { status: 404 })
    }

    if (recipe.author_id !== user.id) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const body = await request.json()

    const { data: updatedRecipe, error: updateError } = await supabase
      .from('recipes')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedRecipe)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Ungültige Rezept-ID' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !recipe) {
      return NextResponse.json({ error: 'Rezept nicht gefunden' }, { status: 404 })
    }

    if (recipe.author_id !== user.id) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
