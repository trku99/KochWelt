'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tag {
  id: number
  name: string
  slug: string
}

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('tags').select('*').order('name')
    if (data) setTags(data)
    setLoading(false)
  }

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, slug: editing ? prev.slug : slugify(name) }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      await supabase.from('tags').update({ name: form.name, slug: form.slug }).eq('id', editing.id)
    } else {
      await supabase.from('tags').insert({ name: form.name, slug: form.slug })
    }
    setEditing(null)
    setForm({ name: '', slug: '' })
    setSaving(false)
    loadTags()
  }

  const handleEdit = (tag: Tag) => {
    setEditing(tag)
    setForm({ name: tag.name, slug: tag.slug })
  }

  const handleDelete = async (id: number) => {
    const supabase = createClient()
    await supabase.from('tags').delete().eq('id', id)
    setTags(tags.filter(t => t.id !== id))
    setDeleteId(null)
  }

  if (loading) return <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-20" />

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-brand-dark mb-6">Tags</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-brand-dark mb-4">{editing ? 'Tag bearbeiten' : 'Neuen Tag'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Name" value={form.name} onChange={e => handleNameChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          <input type="text" placeholder="slug" value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {saving ? 'Speichern...' : editing ? 'Aktualisieren' : 'Erstellen'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: '', slug: '' }) }}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Abbrechen</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tags.map(tag => (
              <tr key={tag.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-700">{tag.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{tag.slug}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(tag)} className="text-xs text-gray-400 hover:text-primary transition-colors">Edit</button>
                    <button onClick={() => setDeleteId(tag.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">Tag löschen</h3>
            <p className="text-sm text-gray-500 mb-6">Bist du sicher?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Abbrechen</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
