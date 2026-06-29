'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/passwort-zur%C3%BCcksetzen`,
    })
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">
        <Link href="/" className="text-2xl font-serif font-bold text-brand-dark text-center block mb-2">
          Koch<span className="text-primary">Welt</span>
        </Link>
        <p className="text-center text-sm text-gray-500 mb-8">Passwort zurücksetzen</p>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-8-8-4z"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-brand-dark mb-2">E-Mail gesendet</h2>
            <p className="text-sm text-gray-500 mb-6">Wir haben dir einen Link zum Zurücksetzen an <strong>{email}</strong> geschickt.</p>
            <Link href="/login" className="text-sm text-primary hover:text-primary-600 font-medium">Zurück zum Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.ch" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !email}
              className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
              {loading ? 'Wird gesendet...' : 'Link anfordern'}
            </button>
            <p className="text-center text-sm text-gray-400">
              Zurück zum <Link href="/login" className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
