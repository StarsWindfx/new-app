import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BottomNav, Page } from './components/BottomNav'
import { ToastContainer } from './components/Toast'
import { Dashboard } from './pages/Dashboard'
import { TodoPage } from './pages/TodoPage'
import { AgendaPage } from './pages/AgendaPage'
import { SportPage } from './pages/SportPage'
import { JournalPage } from './pages/JournalPage'
import { useTodos } from './hooks/useTodos'
import { useEvents } from './hooks/useEvents'
import { useWorkouts } from './hooks/useWorkouts'
import { useJournal } from './hooks/useJournal'
import { rescheduleAll } from './lib/notificationScheduler'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo } = useTodos()
  const { events, addEvent, deleteEvent } = useEvents()
  const { workouts, addWorkout, deleteWorkout } = useWorkouts()
  const { entries, addEntry, deleteEntry } = useJournal()

  // Reschedule all pending reminders on every app load
  useEffect(() => {
    if (Notification.permission === 'granted') {
      rescheduleAll(events)
    }
  }, [events])

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <ToastContainer />
      <AnimatePresence mode="wait">
        {page === 'dashboard' && (
          <Dashboard key="dashboard" todos={todos} events={events} workouts={workouts} journalEntries={entries} />
        )}
        {page === 'todo' && (
          <TodoPage key="todo" todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} updateTodo={updateTodo} />
        )}
        {page === 'agenda' && (
          <AgendaPage key="agenda" events={events} addEvent={addEvent} deleteEvent={deleteEvent} />
        )}
        {page === 'sport' && (
          <SportPage key="sport" workouts={workouts} addWorkout={addWorkout} deleteWorkout={deleteWorkout} />
        )}
        {page === 'journal' && (
          <JournalPage key="journal" entries={entries} addEntry={addEntry} deleteEntry={deleteEntry} />
        )}
      </AnimatePresence>
      <BottomNav active={page} onChange={setPage} />
    </div>
  )
}
