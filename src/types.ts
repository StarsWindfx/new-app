export type Priority = 'high' | 'medium' | 'low';
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  reminder: boolean;
  created_at: string;
}

export interface Workout {
  id: string;
  type: string;
  duration_minutes: number;
  calories: number;
  notes: string;
  date: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: Mood;
  date: string;
  created_at: string;
}
