import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }

  return createSupabaseClient(url, key)
}

export function setAuthCookie(session: { access_token: string; refresh_token: string }) {
  document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`
  document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`
}

export function clearAuthCookie() {
  document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure'
  document.cookie = 'sb-refresh-token=; path=/; max-age=0; SameSite=Lax; Secure'
}
