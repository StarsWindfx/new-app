import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash, Barbell, Fire, Clock, Trophy } from '@phosphor-icons/react';
import { GlassCard } from '../components/GlassCard';
import { MagneticButton } from '../components/MagneticButton';
import { PageWrapper } from '../components/PageWrapper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { Workout } from '../types';

interface SportPageProps {
  workouts: Workout[];
  addWorkout: (data: Omit<Workout, 'id' | 'created_at'>) => void;
  deleteWorkout: (id: string) => void;
}

const WORKOUT_TYPES = ['Course', 'Musculation', 'Vélo', 'Natation', 'Yoga', 'HIIT', 'Marche', 'Boxe', 'Autre'];

const TYPE_COLORS: Record<string, string> = {
  'Course': '#C43C3C',
  'Musculation': '#8B1099',
  'Vélo': '#3A7AB5',
  'Natation': '#26547C',
  'Yoga': '#22A55E',
  'HIIT': '#C49428',
  'Marche': '#A0A0A0',
  'Boxe': '#C43C3C',
  'Autre': '#606060',
};

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

export function SportPage({ workouts, addWorkout, deleteWorkout }: SportPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('Course');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  const weekWorkouts = useMemo(() => workouts.filter(w => weekDates.includes(w.date)), [workouts, weekDates]);
  const totalCal = useMemo(() => weekWorkouts.reduce((s, w) => s + w.calories, 0), [weekWorkouts]);
  const totalMin = useMemo(() => weekWorkouts.reduce((s, w) => s + w.duration_minutes, 0), [weekWorkouts]);

  const maxCal = useMemo(
    () => Math.max(...weekDates.map(d => workouts.filter(w => w.date === d).reduce((s, w) => s + w.calories, 0)), 1),
    [workouts, weekDates]
  );

  const personalRecords = useMemo(() => {
    const byType = new Map<string, Workout[]>();
    workouts.forEach(w => {
      const arr = byType.get(w.type) || [];
      arr.push(w);
      byType.set(w.type, arr);
    });
    const records: { type: string; field: string; value: number; unit: string }[] = [];
    byType.forEach((ws, t) => {
      const maxCalW = ws.reduce((max, w) => w.calories > max.calories ? w : max, ws[0]);
      const maxDurW = ws.reduce((max, w) => w.duration_minutes > max.duration_minutes ? w : max, ws[0]);
      if (maxCalW.calories > 0) records.push({ type: t, field: 'Calories', value: maxCalW.calories, unit: 'kcal' });
      if (maxDurW.duration_minutes > 0) records.push({ type: t, field: 'Durée', value: maxDurW.duration_minutes, unit: 'min' });
    });
    return records.slice(0, 4);
  }, [workouts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !date) return;
    addWorkout({
      type,
      duration_minutes: parseInt(duration) || 0,
      calories: parseInt(calories) || 0,
      notes: notes.trim(),
      date,
    });
    showToast('Séance enregistrée');
    setDuration(''); setCalories(''); setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <PageWrapper>
      <div className="px-4 pt-14 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Sport</h1>
            <p className="text-text-muted text-sm mt-0.5">{weekWorkouts.length} séance{weekWorkouts.length !== 1 ? 's' : ''} cette semaine</p>
          </div>
          <MagneticButton
            onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #690B78, #26547C)', boxShadow: '0 4px 16px rgba(105,11,120,0.4)' }}
          >
            <motion.div animate={{ rotate: showForm ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus size={20} weight="bold" className="text-white" />
            </motion.div>
          </MagneticButton>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Séances', value: weekWorkouts.length, icon: Barbell, color: 'text-violet-light', bg: 'rgba(105,11,120,0.15)' },
            { label: 'Calories', value: totalCal, icon: Fire, color: 'text-[#C43C3C]', bg: 'rgba(196,60,60,0.12)' },
            { label: 'Minutes', value: totalMin, icon: Clock, color: 'text-blue-light', bg: 'rgba(38,84,124,0.15)' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <GlassCard key={stat.label} className="p-3 text-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: stat.bg }}>
                  <Icon size={16} weight="fill" className={stat.color} />
                </div>
                <p className="text-text-primary font-bold text-lg">{stat.value}</p>
                <p className="text-text-muted text-[10px]">{stat.label}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Week bar chart */}
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">Cette semaine</p>
            {totalCal > 0 && (
              <span className="text-text-muted text-[10px] font-mono">{totalCal} kcal</span>
            )}
          </div>
          <div className="flex gap-2 items-end h-28">
            {weekDates.map((d, i) => {
              const dayWorkouts = workouts.filter(w => w.date === d);
              const dayCal = dayWorkouts.reduce((s, w) => s + w.calories, 0);
              const dayMin = dayWorkouts.reduce((s, w) => s + w.duration_minutes, 0);
              const barHeight = dayCal > 0 ? Math.max((dayCal / maxCal) * 80, 8) : 4;
              const isToday = d === today;
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
                  {dayCal > 0 && <span className="text-[8px] text-text-muted font-mono">{dayCal}</span>}
                  <motion.div
                    className="w-full rounded-md relative group"
                    style={{
                      background: isToday
                        ? 'linear-gradient(180deg, #8B1099, #690B78)'
                        : dayCal > 0
                          ? 'linear-gradient(180deg, #3A7AB5, #26547C)'
                          : 'rgba(255,255,255,0.04)',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}px` }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                  >
                    {dayMin > 0 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[7px] text-text-muted whitespace-nowrap">
                        {dayMin}min
                      </div>
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-violet-light' : 'text-text-muted'}`}>
                    {days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Personal records */}
        {personalRecords.length > 0 && (
          <GlassCard className="p-4 mb-5" glow="violet">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} weight="fill" className="text-[#C49428]" />
              <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">Records personnels</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {personalRecords.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[rec.type] || '#606060' }} />
                  <div className="min-w-0">
                    <p className="text-text-primary text-xs font-semibold">{rec.value} {rec.unit}</p>
                    <p className="text-text-muted text-[9px] truncate">{rec.type} · {rec.field}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-4"
            >
              <GlassCard className="p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {WORKOUT_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border"
                        style={{
                          background: type === t ? `${TYPE_COLORS[t] || '#690B78'}25` : 'transparent',
                          borderColor: type === t ? TYPE_COLORS[t] || '#690B78' : 'rgba(255,255,255,0.08)',
                          color: type === t ? TYPE_COLORS[t] || '#8B1099' : '#606060',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="Durée (min)"
                      min="0"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-violet-light transition-colors"
                    />
                    <input
                      type="number"
                      value={calories}
                      onChange={e => setCalories(e.target.value)}
                      placeholder="Calories"
                      min="0"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-violet-light transition-colors"
                    />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-violet-light transition-colors"
                    style={{ colorScheme: 'dark' }}
                  />
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes (optionnel)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-violet-light transition-colors resize-none"
                  />
                  <MagneticButton
                    type="submit"
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                    style={{ background: 'linear-gradient(135deg, #690B78, #26547C)' }}
                  >
                    Enregistrer
                  </MagneticButton>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workout history */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {workouts.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm">
                <Barbell size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune séance enregistrée</p>
                <p className="text-xs mt-1">Commence par ajouter ta première séance</p>
              </div>
            ) : (
              [...workouts].sort((a, b) => b.date.localeCompare(a.date)).map(workout => (
                <motion.div
                  key={workout.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${TYPE_COLORS[workout.type] || '#690B78'}20`, border: `1px solid ${TYPE_COLORS[workout.type] || '#690B78'}30` }}
                      >
                        <Barbell size={18} weight="fill" style={{ color: TYPE_COLORS[workout.type] || '#8B1099' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-medium text-sm">{workout.type}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {workout.duration_minutes > 0 && (
                            <span className="text-text-muted text-xs flex items-center gap-1">
                              <Clock size={10} /> {workout.duration_minutes}min
                            </span>
                          )}
                          {workout.calories > 0 && (
                            <span className="text-text-muted text-xs flex items-center gap-1">
                              <Fire size={10} className="text-[#C43C3C]" /> {workout.calories} kcal
                            </span>
                          )}
                          <span className="text-text-muted text-xs ml-auto">
                            {new Date(workout.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {workout.notes && (
                          <p className="text-text-muted text-xs mt-1 truncate">{workout.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmDelete(workout.id)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Trash size={14} className="text-text-muted hover:text-[#C43C3C] transition-colors" />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer la séance"
        message="Veux-tu vraiment supprimer cette séance ?"
        onConfirm={() => { if (confirmDelete) { deleteWorkout(confirmDelete); setConfirmDelete(null); showToast('Séance supprimée', 'info'); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </PageWrapper>
  );
}
