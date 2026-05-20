import { useState, useEffect, useCallback } from 'react'
import { uuid } from '../utils/uuid'
import { supabase } from '../lib/supabase'
import { HAS_SUPABASE, getUserId, seedIfEmpty } from '../lib/auth'
import { schedule } from '../lib/notificationScheduler'
import type { Event } from '../types'

const KEY = 'starswind_events'

function local(): Event[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function persist(data: Event[]) { localStorage.setItem(KEY, JSON.stringify(data)) }

export function useEvents() {
  const [events, setEvents] = useState<Event[]>(local)

  useEffect(() => {
    if (!HAS_SUPABASE) return
    getUserId().then(async uid => {
      if (!uid) return
      await seedIfEmpty('events', KEY, uid)
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: true })
      if (data) { setEvents(data); persist(data) }
    })
  }, [])

  const addEvent = useCallback(async (data: Omit<Event, 'id' | 'created_at'>) => {
    const event: Event = { ...data, id: uuid(), created_at: new Date().toISOString() }
    setEvents(prev => {
      const next = [...prev, event].sort((a, b) => a.date.localeCompare(b.date))
      persist(next)
      return next
    })
    schedule(event)
    if (!HAS_SUPABASE) return
    const uid = await getUserId()
    if (uid) await supabase.from('events').insert({ ...event, user_id: uid })
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    setEvents(prev => { const next = prev.filter(e => e.id !== id); persist(next); return next })
    if (!HAS_SUPABASE) return
    await supabase.from('events').delete().eq('id', id)
  }, [])

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    setEvents(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      persist(next)
      return next
    })
    if (!HAS_SUPABASE) return
    await supabase.from('events').update(updates).eq('id', id)
  }, [])

  return { events, addEvent, deleteEvent, updateEvent }
}
