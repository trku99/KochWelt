'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  recipes: number
  categories: number
  tags: number
  users: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ recipes: 0, categories: 0, tags: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient()
      const [recipes, categories, tags, users] = await Promise.all([
        supabase.from('recipes').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('tags').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        recipes: recipes.count ?? 0,
        categories: categories.count ?? 0,
        tags: tags.count ?? 0,
        users: users.count ?? 0,
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-brand-dark mb-6">Admin-Übersicht</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Rezepte', value: stats.recipes, href: '/admin/rezepte', color: 'text-primary', bg: 'bg-primary-50' },
          { label: 'Kategorien', value: stats.categories, href: '/admin/kategorien', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tags', value: stats.tags, href: '/admin/tags', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Benutzer', value: stats.users, href: '/admin/benutzer', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500 mb-1">{item.label}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-brand-dark mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction href="/admin/rezepte" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" label="Alle Rezepte verwalten" />
          <QuickAction href="/admin/kategorien" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" label="Kategorien verwalten" />
          <QuickAction href="/admin/tags" icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" label="Tags verwalten" />
          <QuickAction href="/admin/benutzer" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" label="Benutzer verwalten" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group">
      <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-primary">
          <path d={icon} />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-primary">{label}</span>
    </Link>
  )
}
