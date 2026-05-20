import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash, Bell, BellSlash, CalendarBlank, ClockCounterClockwise } from '@phosphor-icons/react';
import { GlassCard } from '../components/GlassCard';
import { MagneticButton } from '../components/MagneticButton';
import { PageWrapper } from '../components/PageWrapper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { Event } from '../types';

interface AgendaPageProps {
  events: Event[];
  addEvent: (data: Omit<Event, 'id' | 'created_at'>) => void;
  deleteEvent: (id: string) => void;
}

function groupByDate(events: Event[]) {
  const map = new Map<string, Event[]>();
  events.forEach(e => {
    const arr = map.get(e.date) || [];
    arr.push(e);
    map.set(e.date, arr);
  });
  return map;
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === tomorrow) return 'Demain';
  if (dateStr === yesterday) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${h}h${m}`;
}

export function AgendaPage({ events, addEvent, deleteEvent }: AgendaPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [reminder, setReminder] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'default'>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm);
      if (perm === 'granted') showToast('Notifications activées');
      else showToast('Notifications refusées', 'error');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const futureEvents = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const pastEvents = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const displayEvents = showPast ? pastEvents : futureEvents;
  const grouped = groupByDate(displayEvents);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => showPast ? b.localeCompare(a) : a.localeCompare(b));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addEvent({ title: title.trim(), description: description.trim(), date, time, reminder });
    showToast('Événement ajouté');
    setTitle(''); setDescription(''); setTime(''); setReminder(true);
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  return (
    <PageWrapper>
      <div className="px-4 pt-14 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Agenda</h1>
            <p className="text-text-muted text-sm mt-0.5">{futureEvents.length} événement{futureEvents.length !== 1 ? 's' : ''} à venir</p>
          </div>
          <div className="flex gap-2">
            {notifStatus !== 'granted' && (
              <MagneticButton
                onClick={requestNotifPermission}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(196,148,40,0.15)', border: '1px solid rgba(196,148,40,0.3)' }}
              >
                <BellSlash size={18} className="text-[#C49428]" />
              </MagneticButton>
            )}
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
        </div>

        {/* Toggle past/future */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setShowPast(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
              !showPast ? 'text-white border-transparent' : 'text-text-muted border-white/10'
            }`}
            style={!showPast ? { background: 'linear-gradient(135deg, rgba(105,11,120,0.5), rgba(38,84,124,0.5))' } : {}}
          >
            À venir
          </button>
          <button
            onClick={() => setShowPast(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
              showPast ? 'text-white border-transparent' : 'text-text-muted border-white/10'
            }`}
            style={showPast ? { background: 'linear-gradient(135deg, rgba(105,11,120,0.5), rgba(38,84,124,0.5))' } : {}}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ClockCounterClockwise size={12} />
              Passés
            </span>
          </button>
        </div>

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
              <GlassCard className="p-4" glow="blue">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre de l'événement…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-blue-light transition-colors"
                  />
                  <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-blue-light transition-colors"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-blue-light transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-blue-light transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setReminder(!reminder)}
                    className="flex items-center gap-2 text-sm transition-colors"
                    style={{ color: reminder ? '#3A7AB5' : '#606060' }}
                  >
                    {reminder ? <Bell size={16} weight="fill" /> : <BellSlash size={16} />}
                    Rappel 15 min avant
                  </button>
                  <MagneticButton
                    type="submit"
                    disabled={!title.trim() || !date}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #690B78, #26547C)' }}
                  >
                    Ajouter
                  </MagneticButton>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events grouped by date */}
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-sm">
              <CalendarBlank size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun événement {showPast ? 'passé' : 'à venir'}</p>
              <p className="text-xs mt-1">Appuie sur + pour en créer un</p>
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-light flex-shrink-0" />
                  <h2 className="text-text-secondary text-sm font-semibold capitalize">{formatDateHeader(date)}</h2>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-text-muted text-[10px]">
                    {(grouped.get(date) || []).length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {(grouped.get(date) || []).sort((a, b) => a.time.localeCompare(b.time)).map(event => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GlassCard className="p-4" glow="blue">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-1 self-stretch rounded-full flex-shrink-0"
                              style={{ background: 'linear-gradient(180deg, #3A7AB5, #26547C)' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-text-primary font-medium text-sm">{event.title}</p>
                                <button
                                  onClick={() => setConfirmDelete(event.id)}
                                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  <Trash size={12} className="text-text-muted hover:text-[#C43C3C] transition-colors" />
                                </button>
                              </div>
                              {event.time && (
                                <p className="text-blue-light text-xs mt-0.5 font-mono">{formatTime(event.time)}</p>
                              )}
                              {event.description && (
                                <p className="text-text-muted text-xs mt-1">{event.description}</p>
                              )}
                              {event.reminder && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Bell size={10} weight="fill" className="text-blue-light" />
                                  <span className="text-blue-light text-[10px]">Rappel 15 min</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer l'événement"
        message="Veux-tu vraiment supprimer cet événement ?"
        onConfirm={() => { if (confirmDelete) { deleteEvent(confirmDelete); setConfirmDelete(null); showToast('Événement supprimé', 'info'); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </PageWrapper>
  );
}
