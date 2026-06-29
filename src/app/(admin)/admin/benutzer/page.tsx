'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (loading) return <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-20" />

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-brand-dark mb-6">Benutzer</h1>
      <p className="text-sm text-gray-400 mb-4">{users.length} registrierte Benutzer</p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Benutzername</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Anzeigename</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Registriert</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rolle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(profile => (
                <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold text-sm">
                        {profile.display_name?.charAt(0)?.toUpperCase() || profile.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{profile.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{profile.display_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{formatDate(profile.created_at)}</td>
                  <td className="px-4 py-3">
                    {profile.username === 'admin' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary">Admin</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">User</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">Keine Benutzer gefunden</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
