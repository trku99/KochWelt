'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient, setAuthCookie } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        let data: { error?: string; session?: { access_token: string; refresh_token: string } }
        try {
          data = await res.json()
        } catch {
          const text = await res.text()
          setError('Server-Antwort: ' + text.substring(0, 100))
          setLoading(false)
          return
        }

        if (!res.ok) {
          setError(data.error || 'Anmeldung fehlgeschlagen')
          setLoading(false)
          return
        }

        if (data.session) {
          const supabase = createClient()
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
          setAuthCookie(data.session)
        }

        const redirect = searchParams.get('redirect') || '/'
        router.push(redirect)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
        setLoading(false)
      }
    },
    [email, password, router, searchParams]
  )

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-serif font-bold text-brand-dark">
            Koch<span className="text-primary">Welt</span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-brand-dark mt-6">Anmelden</h1>
          <p className="text-gray-500 mt-2">Willkommen zurück!</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="deine@email.ch"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="••••••••"
            />
            <div className="text-right mt-1">
              <Link href="/passwort-vergessen" className="text-xs text-gray-400 hover:text-primary transition-colors">
                Passwort vergessen?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird angemeldet…' : 'Anmelden'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link href="/registrieren" className="text-primary font-medium hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Wird geladen…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
