'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Mindestens 6 Zeichen.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-brand-dark mb-2">Passwort geändert!</h2>
          <p className="text-sm text-gray-500">Weiter zum Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">
        <h1 className="text-2xl font-serif font-bold text-brand-dark text-center mb-2">Neues Passwort</h1>
        <p className="text-center text-sm text-gray-500 mb-8">Wähle ein neues Passwort für dein Konto.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Neues Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mind. 6 Zeichen" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bestätigen</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Wiederholen" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !password || !confirm}
            className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/login" className="text-primary hover:underline">Zum Login</Link>
        </p>
      </div>
    </div>
  )
}
