import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password, username, displayName } = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName || null },
    })

    if (error) {
      console.error('Admin createUser error:', error)
      return NextResponse.json({ error: error.message || 'Registrierung fehlgeschlagen' }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Benutzer konnte nicht erstellt werden' }, { status: 400 })
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        username,
        display_name: displayName || null,
      })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      return NextResponse.json({ error: profileError.message || 'Profil konnte nicht erstellt werden' }, { status: 400 })
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      return NextResponse.json({ error: signInError.message || 'Anmeldung fehlgeschlagen' }, { status: 400 })
    }

    return NextResponse.json({
      user: signInData.user,
      session: signInData.session,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
