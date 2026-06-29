'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/profil/bearbeiten'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setForm({
          username: profile.username || '',
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
        })
      }
      setLoading(false)
    }
    init()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      display_name: form.display_name || null,
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
    }).eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profil gespeichert!' })
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMessage({ type: 'error', text: 'Passwörter stimmen nicht überein.' }); return
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Passwort muss mindestens 6 Zeichen lang sein.' }); return
    }
    setPasswordSaving(true)
    setPasswordMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } else {
      setPasswordMessage({ type: 'success', text: 'Passwort geändert!' })
      setPasswordForm({ current: '', newPass: '', confirm: '' })
    }
    setPasswordSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary mb-6 inline-block">&larr; Dashboard</Link>
      <h1 className="text-3xl font-serif font-bold text-brand-dark mb-8">Profil bearbeiten</h1>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-brand-dark mb-4">Avatar</h2>
          <ImageUpload
            currentImage={form.avatar_url}
            onUpload={(url) => setForm(prev => ({ ...prev, avatar_url: url }))}
          />
          {form.avatar_url && (
            <div className="mt-3 flex items-center gap-3">
              <Image src={form.avatar_url} alt="Avatar" width={48} height={48} className="rounded-full object-cover w-12 h-12" unoptimized />
              <button onClick={() => setForm(prev => ({ ...prev, avatar_url: '' }))} className="text-xs text-red-500 hover:text-red-700">Entfernen</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Allgemein</h2>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Benutzername (kann nicht geändert werden)</label>
            <input type="text" value={form.username} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Anzeigename</label>
            <input type="text" value={form.display_name} onChange={e => setForm(prev => ({ ...prev, display_name: e.target.value }))} placeholder="Dein Name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Über dich..." rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Passwort ändern</h2>
          {passwordMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {passwordMessage.text}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Neues Passwort</label>
            <input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(prev => ({ ...prev, newPass: e.target.value }))} placeholder="Mind. 6 Zeichen"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Passwort bestätigen</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} placeholder="Wiederholen"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <button onClick={handlePasswordChange} disabled={passwordSaving || !passwordForm.newPass || !passwordForm.confirm}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {passwordSaving ? 'Ändern...' : 'Passwort ändern'}
          </button>
        </div>

        <Link href="/passwort-vergessen" className="block text-center text-sm text-gray-400 hover:text-primary">
          Passwort vergessen? E-Mail zum Zurücksetzen anfordern
        </Link>
      </div>
    </div>
  )
}
