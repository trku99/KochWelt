'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!username.trim()) {
        setError('Benutzername darf nicht leer sein')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwörter stimmen nicht überein')
        return
      }

      if (password.length < 6) {
        setError('Passwort muss mindestens 6 Zeichen lang sein')
        return
      }

      setLoading(true)

      try {
        const supabase = createClient()

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          console.error('Signup error:', signUpError)
          setError('Registrierung fehlgeschlagen: ' + (signUpError.message || JSON.stringify(signUpError)))
          setLoading(false)
          return
        }

        console.log('Signup success:', authData)

        const user = authData.user
        if (!user) {
          setError('Registrierung fehlgeschlagen – bitte E-Mail bestätigen oder erneut versuchen')
          setLoading(false)
          return
        }

        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          username: username.trim(),
          display_name: displayName.trim() || null,
        })

        if (profileError) {
          console.error('Profile error:', profileError)
          setError(profileError.message || JSON.stringify(profileError))
          setLoading(false)
          return
        }

        router.push('/')
        router.refresh()
      } catch (err: unknown) {
        console.error('Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
        setLoading(false)
      }
    },
    [username, displayName, email, password, confirmPassword, router]
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-serif font-bold text-brand-dark">
              Koch<span className="text-primary">Welt</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <h1 className="font-serif text-2xl font-bold text-brand-dark text-center mb-6">
            Registrieren
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Benutzername
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="kochfan42"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Anzeigename <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Kochfan 42"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="beispiel@email.ch"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registrierung läuft…' : 'Registrieren'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Bereits registriert?{' '}
            <Link href="/login" className="text-primary hover:text-primary-600 font-medium transition-colors">
              Hier anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
