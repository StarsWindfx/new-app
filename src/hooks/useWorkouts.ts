import { useState, useEffect, useCallback } from 'react';
import { Workout } from '../types';

const STORAGE_KEY = 'starswind_workouts';

function load(): Workout[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(workouts: Workout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(load);

  useEffect(() => { save(workouts); }, [workouts]);

  const addWorkout = useCallback((data: Omit<Workout, 'id' | 'created_at'>) => {
    const workout: Workout = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setWorkouts(prev => [workout, ...prev]);
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  return { workouts, addWorkout, deleteWorkout, updateWorkout };
}
