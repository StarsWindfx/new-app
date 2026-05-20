import { useState, useEffect, useCallback, useRef } from 'react'
import { uuid } from '../utils/uuid'
import { supabase } from '../lib/supabase'
import { HAS_SUPABASE, getUserId, seedIfEmpty } from '../lib/auth'
import type { JournalEntry, Mood } from '../types'

const KEY = 'starswind_journal'

function local(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function persist(data: JournalEntry[]) { localStorage.setItem(KEY, JSON.stringify(data)) }

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(local)
  const ref = useRef(entries)
  ref.current = entries

  useEffect(() => {
    if (!HAS_SUPABASE) return
    getUserId().then(async uid => {
      if (!uid) return
      await seedIfEmpty('journal_entries', KEY, uid)
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false })
      if (data) { setEntries(data); persist(data) }
    })
  }, [])

  const addEntry = useCallback(async (content: string, mood: Mood) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = ref.current.find(e => e.date === today)

    if (existing) {
      const updates = { content, mood }
      setEntries(prev => {
        const next = prev.map(e => e.id === existing.id ? { ...e, ...updates } : e)
        persist(next)
        return next
      })
      if (HAS_SUPABASE) await supabase.from('journal_entries').update(updates).eq('id', existing.id)
    } else {
      const entry: JournalEntry = {
        id: uuid(), content, mood, date: today, created_at: new Date().toISOString(),
      }
      setEntries(prev => { const next = [entry, ...prev]; persist(next); return next })
      if (HAS_SUPABASE) {
        const uid = await getUserId()
        if (uid) await supabase.from('journal_entries').insert({ ...entry, user_id: uid })
      }
    }
  }, [])

  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => { const next = prev.filter(e => e.id !== id); persist(next); return next })
    if (!HAS_SUPABASE) return
    await supabase.from('journal_entries').delete().eq('id', id)
  }, [])

  return { entries, addEntry, deleteEntry }
}
