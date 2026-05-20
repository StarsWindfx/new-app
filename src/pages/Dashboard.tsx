import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, CalendarBlank, Barbell, TrendUp, Sparkle, Smiley, NotePencil } from '@phosphor-icons/react';
import { StarField } from '../components/StarField';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Todo, Event, Workout, JournalEntry } from '../types';

interface DashboardProps {
  todos: Todo[];
  events: Event[];
  workouts: Workout[];
  journalEntries: JournalEntry[];
}

function getWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

const MOOD_EMOJIS: Record<string, string> = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😕', terrible: '😞',
};

export function Dashboard({ todos, events, workouts, journalEntries }: DashboardProps) {
  const pendingTodos = useMemo(() => todos.filter(t => !t.completed), [todos]);
  const highPriority = useMemo(() => pendingTodos.filter(t => t.priority === 'high'), [pendingTodos]);

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = useMemo(
    () => events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [events, today]
  );
  const nextEvent = upcomingEvents[0];

  const weekDates = getWeekDates();
  const weekWorkouts = useMemo(() => workouts.filter(w => weekDates.includes(w.date)), [workouts, weekDates]);
  const weekCalories = useMemo(() => weekWorkouts.reduce((s, w) => s + w.calories, 0), [weekWorkouts]);

  const todayJournal = journalEntries.find(e => e.date === today);

  const moodStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...journalEntries].sort((a, b) => b.date.localeCompare(a.date));
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const entry = sorted.find(e => e.date === dateStr);
      if (entry) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [journalEntries]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return 'Bonne nuit';
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const stats = [
    { label: 'Tâches en attente', value: pendingTodos.length, icon: CheckCircle, color: 'violet' as const, suffix: '' },
    { label: 'Priorité haute', value: highPriority.length, icon: TrendUp, color: 'blue' as const, suffix: '' },
    { label: 'Séances semaine', value: weekWorkouts.length, icon: Barbell, color: 'violet' as const, suffix: '' },
    { label: 'Calories brûlées', value: weekCalories, icon: Sparkle, color: 'blue' as const, suffix: '' },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  const item = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0">
        <StarField />
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-bg/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-bg/90 to-transparent" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-violet/[0.04] blur-[80px]" />
        <div className="absolute bottom-1/3 -right-32 w-64 h-64 rounded-full bg-blue/[0.04] blur-[80px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 px-4 pt-14 pb-8"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-7">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-light animate-pulse" />
            <span className="text-text-secondary text-xs font-medium tracking-wider uppercase">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary leading-tight">
            {greeting}
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            <span className="bg-gradient-to-r from-violet-light to-blue-light bg-clip-text text-transparent font-semibold">
              StarsWind
            </span>
          </p>
        </motion.div>

        {/* Mood + streak row */}
        {moodStreak > 0 && (
          <motion.div variants={item} className="mb-4">
            <GlassCard className="px-4 py-3 flex items-center gap-3" glow="violet">
              <div className="flex items-center gap-1.5">
                {todayJournal ? (
                  <span className="text-xl">{MOOD_EMOJIS[todayJournal.mood]}</span>
                ) : (
                  <Smiley size={20} className="text-text-muted" />
                )}
                <div>
                  <p className="text-text-primary text-sm font-medium">
                    {todayJournal ? 'Humeur du jour' : 'Pas encore noté'}
                  </p>
                  <p className="text-text-muted text-[10px]">
                    {moodStreak} jour{moodStreak !== 1 ? 's' : ''} d'affilé
                  </p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {Array.from({ length: Math.min(moodStreak, 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-3 rounded-full"
                    style={{
                      background: i === Math.min(moodStreak, 7) - 1
                        ? 'linear-gradient(180deg, #8B1099, #690B78)'
                        : 'rgba(105,11,120,0.3)',
                    }}
                  />
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={item}>
                <GlassCard className="p-4" glow={stat.color}>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: stat.color === 'violet'
                          ? 'linear-gradient(135deg, rgba(105,11,120,0.5), rgba(105,11,120,0.2))'
                          : 'linear-gradient(135deg, rgba(38,84,124,0.5), rgba(38,84,124,0.2))',
                      }}
                    >
                      <Icon size={16} weight="fill" className={stat.color === 'violet' ? 'text-violet-light' : 'text-blue-light'} />
                    </div>
                  </div>
                  <AnimatedCounter
                    value={stat.value}
                    className="text-3xl font-bold text-text-primary block"
                    suffix={stat.suffix}
                  />
                  <p className="text-text-muted text-xs mt-1 leading-tight">{stat.label}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Next event */}
        <motion.div variants={item} className="mb-4">
          <GlassCard className="p-5" glow="blue">
            <div className="flex items-center gap-2 mb-3">
              <CalendarBlank size={16} weight="fill" className="text-blue-light" />
              <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">Prochain événement</span>
            </div>
            {nextEvent ? (
              <div>
                <p className="text-text-primary font-semibold text-lg leading-snug">{nextEvent.title}</p>
                <p className="text-text-secondary text-sm mt-1">
                  {formatDate(nextEvent.date)}{nextEvent.time ? ` · ${nextEvent.time}` : ''}
                </p>
                {nextEvent.description && (
                  <p className="text-text-muted text-xs mt-2 line-clamp-2">{nextEvent.description}</p>
                )}
                {upcomingEvents.length > 1 && (
                  <p className="text-text-muted text-[10px] mt-2">
                    +{upcomingEvents.length - 1} autre{upcomingEvents.length - 1 !== 1 ? 's' : ''} à venir
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-muted text-sm">Aucun événement à venir</p>
            )}
          </GlassCard>
        </motion.div>

        {/* Upcoming tasks */}
        {pendingTodos.length > 0 && (
          <motion.div variants={item} className="mb-4">
            <GlassCard className="p-5" glow="violet">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-violet-light" />
                  <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">Tâches prioritaires</span>
                </div>
                <span className="text-text-muted text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                  {pendingTodos.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {pendingTodos.slice(0, 5).map(todo => (
                  <div key={todo.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      todo.priority === 'high' ? 'bg-[#C43C3C]' :
                      todo.priority === 'medium' ? 'bg-[#C49428]' : 'bg-[#22A55E]'
                    }`} />
                    <span className="text-text-secondary text-sm truncate flex-1">{todo.title}</span>
                    {todo.category && (
                      <span className="text-text-muted text-[10px] ml-auto flex-shrink-0 bg-white/5 px-2 py-0.5 rounded-full">
                        {todo.category}
                      </span>
                    )}
                  </div>
                ))}
                {pendingTodos.length > 5 && (
                  <p className="text-text-muted text-xs pt-0.5">+{pendingTodos.length - 5} autres tâches</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Week sport chart */}
        <motion.div variants={item}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Barbell size={16} weight="fill" className="text-blue-light" />
                <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">Sport cette semaine</span>
              </div>
              {weekCalories > 0 && (
                <span className="text-text-muted text-[10px] font-mono">{weekCalories} kcal</span>
              )}
            </div>
            <div className="flex gap-1.5 items-end h-20">
              {weekDates.map((date, i) => {
                const dayWorkouts = workouts.filter(w => w.date === date);
                const totalCal = dayWorkouts.reduce((s, w) => s + w.calories, 0);
                const maxCal = Math.max(...weekDates.map(d => workouts.filter(w => w.date === d).reduce((s, w) => s + w.calories, 0)), 1);
                const height = totalCal > 0 ? Math.max((totalCal / maxCal) * 64, 8) : 4;
                const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
                const isToday = date === today;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                    {totalCal > 0 && (
                      <span className="text-[8px] text-text-muted font-mono">{totalCal}</span>
                    )}
                    <motion.div
                      className="w-full rounded-md"
                      style={{
                        height: `${height}px`,
                        background: totalCal > 0
                          ? isToday
                            ? 'linear-gradient(180deg, #8B1099, #690B78)'
                            : 'linear-gradient(180deg, #3A7AB5, #26547C)'
                          : 'rgba(255,255,255,0.04)',
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}px` }}
                      transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                    />
                    <span className={`text-[10px] font-medium ${isToday ? 'text-violet-light' : 'text-text-muted'}`}>
                      {days[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent journal */}
        {journalEntries.length > 0 && !todayJournal && (
          <motion.div variants={item} className="mt-4">
            <GlassCard className="p-4 flex items-center gap-3" glow="violet">
              <NotePencil size={18} weight="fill" className="text-violet-light" />
              <div className="flex-1">
                <p className="text-text-primary text-sm font-medium">Écris ton journal</p>
                <p className="text-text-muted text-[10px]">Tu n'as pas encore écrit aujourd'hui</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-light animate-pulse" />
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
