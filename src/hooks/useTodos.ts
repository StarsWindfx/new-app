import { useState, useEffect, useCallback } from 'react';
import { uuid } from '../utils/uuid';
import { Todo } from '../types';

const STORAGE_KEY = 'starswind_todos';

function load(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(load);

  useEffect(() => { save(todos); }, [todos]);

  const addTodo = useCallback((title: string, priority: Todo['priority'], category: string) => {
    const todo: Todo = {
      id: uuid(),
      title,
      completed: false,
      priority,
      category,
      created_at: new Date().toISOString(),
    };
    setTodos(prev => [todo, ...prev]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  return { todos, addTodo, toggleTodo, deleteTodo, updateTodo };
}
