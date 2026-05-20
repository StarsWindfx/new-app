import { supabase } from './supabase'

export const HAS_SUPABASE = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co'
)

let _uid: string | null = null

export async function getUserId(): Promise<string | null> {
  if (!HAS_SUPABASE) return null
  if (_uid) return _uid

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    _uid = session.user.id
    return _uid
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (!error && data.user) {
    _uid = data.user.id
    return _uid
  }

  return null
}

// Seed initial localStorage data into Supabase on first login
export async function seedIfEmpty(
  table: string,
  localKey: string,
  uid: string
) {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)

  if ((count ?? 0) > 0) return // already has data

  const local = (() => {
    try { return JSON.parse(localStorage.getItem(localKey) || '[]') }
    catch { return [] }
  })()

  if (local.length === 0) return

  const rows = local.map((r: Record<string, unknown>) => ({ ...r, user_id: uid }))
  await supabase.from(table).upsert(rows, { onConflict: 'id' })
}
