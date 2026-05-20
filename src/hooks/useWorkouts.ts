import { useState, useEffect, useCallback } from 'react'
import { uuid } from '../utils/uuid'
import { supabase } from '../lib/supabase'
import { HAS_SUPABASE, getUserId, seedIfEmpty } from '../lib/auth'
import type { Workout } from '../types'

const KEY = 'starswind_workouts'

function local(): Workout[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function persist(data: Workout[]) { localStorage.setItem(KEY, JSON.stringify(data)) }

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(local)

  useEffect(() => {
    if (!HAS_SUPABASE) return
    getUserId().then(async uid => {
      if (!uid) return
      await seedIfEmpty('workouts', KEY, uid)
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (data) { setWorkouts(data); persist(data) }
    })
  }, [])

  const addWorkout = useCallback(async (data: Omit<Workout, 'id' | 'created_at'>) => {
    const workout: Workout = { ...data, id: uuid(), created_at: new Date().toISOString() }
    setWorkouts(prev => { const next = [workout, ...prev]; persist(next); return next })
    if (!HAS_SUPABASE) return
    const uid = await getUserId()
    if (uid) await supabase.from('workouts').insert({ ...workout, user_id: uid })
  }, [])

  const deleteWorkout = useCallback(async (id: string) => {
    setWorkouts(prev => { const next = prev.filter(w => w.id !== id); persist(next); return next })
    if (!HAS_SUPABASE) return
    await supabase.from('workouts').delete().eq('id', id)
  }, [])

  const updateWorkout = useCallback(async (id: string, updates: Partial<Workout>) => {
    setWorkouts(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...updates } : w)
      persist(next)
      return next
    })
    if (!HAS_SUPABASE) return
    await supabase.from('workouts').update(updates).eq('id', id)
  }, [])

  return { workouts, addWorkout, deleteWorkout, updateWorkout }
}
