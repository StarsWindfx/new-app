import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types';

const STORAGE_KEY = 'starswind_events';

function load(): Event[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(events: Event[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>(load);

  useEffect(() => { save(events); }, [events]);

  const addEvent = useCallback((data: Omit<Event, 'id' | 'created_at'>) => {
    const event: Event = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setEvents(prev => [...prev, event].sort((a, b) => a.date.localeCompare(b.date)));
    if (data.reminder && data.time) scheduleReminder(event);
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  return { events, addEvent, deleteEvent, updateEvent };
}

function scheduleReminder(event: Event) {
  if (!('Notification' in window)) return;
  const [h, m] = event.time.split(':').map(Number);
  const eventDate = new Date(event.date);
  eventDate.setHours(h, m, 0, 0);
  const reminderTime = new Date(eventDate.getTime() - 15 * 60 * 1000);
  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();
  if (delay > 0) {
    setTimeout(() => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification(`StarsWind — ${event.title}`, {
            body: `Dans 15 minutes`,
            icon: '/pwa-192.png',
          });
        }
      });
    }, delay);
  }
}
