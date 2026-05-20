import type { Event } from '../types'

const scheduled = new Set<string>()

async function fire(title: string, body: string, tag: string) {
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
      })
    } else {
      new Notification(title, { body, icon: '/icon-192.png', tag })
    }
  } catch {
    try { new Notification(title, { body, icon: '/icon-192.png' }) } catch { /* noop */ }
  }
}

export function schedule(event: Event) {
  if (!event.reminder || !event.time) return
  if (scheduled.has(event.id)) return

  const dt = new Date(`${event.date}T${event.time}:00`)
  const reminderAt = dt.getTime() - 15 * 60_000
  const delay = reminderAt - Date.now()

  // Only schedule if between 0 and 7 days
  if (delay <= 0 || delay > 7 * 24 * 60 * 60_000) return

  scheduled.add(event.id)
  setTimeout(async () => {
    scheduled.delete(event.id)
    const desc = event.description ? ` · ${event.description}` : ''
    await fire(
      `StarsWind — ${event.title}`,
      `Dans 15 minutes${desc}`,
      `reminder-${event.id}`
    )
  }, delay)
}

export function rescheduleAll(events: Event[]) {
  events.forEach(e => {
    if (!e.reminder || !e.time || scheduled.has(e.id)) return
    const dt = new Date(`${e.date}T${e.time}:00`)
    if (dt.getTime() - 15 * 60_000 > Date.now()) schedule(e)
  })
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}
