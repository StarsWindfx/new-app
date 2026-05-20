import { useState, useEffect, useCallback } from 'react'
import { uuid } from '../utils/uuid'
import { supabase } from '../lib/supabase'
import { HAS_SUPABASE, getUserId, seedIfEmpty } from '../lib/auth'
import type { Todo } from '../types'

const KEY = 'starswind_todos'

function local(): Todo[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function persist(data: Todo[]) { localStorage.setItem(KEY, JSON.stringify(data)) }

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(local)

  // Load from Supabase on mount, seed if first time
  useEffect(() => {
    if (!HAS_SUPABASE) return
    getUserId().then(async uid => {
      if (!uid) return
      await seedIfEmpty('todos', KEY, uid)
      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (data) { setTodos(data); persist(data) }
    })
  }, [])

  const addTodo = useCallback(async (title: string, priority: Todo['priority'], category: string) => {
    const todo: Todo = {
      id: uuid(), title, completed: false,
      priority, category, created_at: new Date().toISOString(),
    }
    setTodos(prev => { const next = [todo, ...prev]; persist(next); return next })
    if (!HAS_SUPABASE) return
    const uid = await getUserId()
    if (uid) await supabase.from('todos').insert({ ...todo, user_id: uid })
  }, [])

  const toggleTodo = useCallback(async (id: string) => {
    let completed = false
    setTodos(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t
        completed = !t.completed
        return { ...t, completed }
      })
      persist(next)
      return next
    })
    if (!HAS_SUPABASE) return
    await supabase.from('todos').update({ completed }).eq('id', id)
  }, [])

  const deleteTodo = useCallback(async (id: string) => {
    setTodos(prev => { const next = prev.filter(t => t.id !== id); persist(next); return next })
    if (!HAS_SUPABASE) return
    await supabase.from('todos').delete().eq('id', id)
  }, [])

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    setTodos(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      persist(next)
      return next
    })
    if (!HAS_SUPABASE) return
    await supabase.from('todos').update(updates).eq('id', id)
  }, [])

  return { todos, addTodo, toggleTodo, deleteTodo, updateTodo }
}
