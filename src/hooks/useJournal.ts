import { useState, useEffect, useCallback, useRef } from 'react';
import { uuid } from '../utils/uuid';
import { JournalEntry, Mood } from '../types';

const STORAGE_KEY = 'starswind_journal';

function load(): JournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(entries: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(load);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => { save(entries); }, [entries]);

  const addEntry = useCallback((content: string, mood: Mood) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = entriesRef.current.find(e => e.date === today);
    if (existing) {
      setEntries(prev => prev.map(e => e.id === existing.id ? { ...e, content, mood } : e));
    } else {
      const entry: JournalEntry = {
        id: uuid(),
        content,
        mood,
        date: today,
        created_at: new Date().toISOString(),
      };
      setEntries(prev => [entry, ...prev]);
    }
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return { entries, addEntry, deleteEntry };
}
