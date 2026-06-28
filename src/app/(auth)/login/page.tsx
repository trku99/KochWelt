'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Ungültige Anmeldedaten'
          : authError.message)
        setLoading(false)
        return
      }

      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
      router.refresh()
    },
    [email, password, router, searchParams, supabase]
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
