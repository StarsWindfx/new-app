import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotePencil, Trash, TextT, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
import { GlassCard } from '../components/GlassCard';
import { MagneticButton } from '../components/MagneticButton';
import { PageWrapper } from '../components/PageWrapper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { JournalEntry, Mood } from '../types';

interface JournalPageProps {
  entries: JournalEntry[];
  addEntry: (content: string, mood: Mood) => void;
  deleteEntry: (id: string) => void;
}

const MOODS: { value: Mood; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Super', emoji: '😄', color: '#22A55E' },
  { value: 'good', label: 'Bien', emoji: '🙂', color: '#3A7AB5' },
  { value: 'neutral', label: 'Neutre', emoji: '😐', color: '#A0A0A0' },
  { value: 'bad', label: 'Bof', emoji: '😕', color: '#C49428' },
  { value: 'terrible', label: 'Dur', emoji: '😞', color: '#C43C3C' },
];

export function JournalPage({ entries, addEntry, deleteEntry }: JournalPageProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);

  const [content, setContent] = useState(todayEntry?.content || '');
  const [mood, setMood] = useState<Mood>(todayEntry?.mood || 'neutral');
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Reset form when todayEntry changes
  useState(() => {
    if (todayEntry) {
      setContent(todayEntry.content);
      setMood(todayEntry.mood);
    }
  });

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const handleSave = () => {
    if (!content.trim()) return;
    addEntry(content, mood);
    setSaved(true);
    showToast('Journal sauvegardé');
    setTimeout(() => setSaved(false), 2000);
  };

  const moodStats = useMemo(() => {
    const counts: Record<Mood, number> = { great: 0, good: 0, neutral: 0, bad: 0, terrible: 0 };
    entries.forEach(e => { counts[e.mood]++; });
    const total = entries.length || 1;
    return MOODS.map(m => ({
      ...m,
      count: counts[m.value],
      pct: Math.round((counts[m.value] / total) * 100),
    }));
  }, [entries]);

  const pastEntries = useMemo(() => {
    let list = entries.filter(e => e.date !== today).sort((a, b) => b.date.localeCompare(a.date));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.content.toLowerCase().includes(q));
    }
    return list;
  }, [entries, today, search]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <PageWrapper>
      <div className="px-4 pt-14 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Journal</h1>
          <p className="text-text-muted text-sm mt-0.5 capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Today's entry */}
        <GlassCard className="p-4 mb-5" glow="violet">
          <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">Aujourd'hui</p>

          <div className="flex gap-2 mb-4">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 border"
                style={{
                  background: mood === m.value ? `${m.color}18` : 'transparent',
                  borderColor: mood === m.value ? `${m.color}50` : 'rgba(255,255,255,0.06)',
                }}
              >
                <span className={`text-lg transition-transform duration-200 ${mood === m.value ? 'scale-110' : ''}`}>{m.emoji}</span>
                <span className="text-[9px] font-medium" style={{ color: mood === m.value ? m.color : '#606060' }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Comment s'est passée ta journée…"
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-violet-light transition-colors resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-text-muted">
              <TextT size={12} />
              <span className="text-xs">{wordCount} mot{wordCount !== 1 ? 's' : ''}</span>
            </div>
            <MagneticButton
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-5 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 transition-all duration-200"
              style={{
                background: saved
                  ? 'rgba(34,165,94,0.5)'
                  : 'linear-gradient(135deg, #690B78, #26547C)',
              }}
            >
              {saved ? 'Sauvegardé' : 'Sauvegarder'}
            </MagneticButton>
          </div>
        </GlassCard>

        {/* Mood stats */}
        {entries.length > 2 && (
          <GlassCard className="p-4 mb-5">
            <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">Tendance d'humeur</p>
            <div className="space-y-2">
              {moodStats.map(m => (
                <div key={m.value} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{m.emoji}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: m.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-text-muted text-[10px] font-mono w-8 text-right">{m.pct}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Past entries */}
        {entries.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">Historique</p>
              {pastEntries.length > 3 && (
                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-text-primary placeholder-text-muted text-xs focus:outline-none focus:border-violet-light transition-colors w-32"
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pastEntries.length === 0 && search && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6 text-text-muted text-sm"
                  >
                    Aucun résultat
                  </motion.div>
                )}
                {pastEntries.map(entry => {
                  const moodInfo = MOODS.find(m => m.value === entry.mood)!;
                  const wc = entry.content.trim().split(/\s+/).filter(Boolean).length;
                  const isExpanded = expandedId === entry.id;
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <GlassCard className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                            style={{ background: `${moodInfo.color}15`, border: `1px solid ${moodInfo.color}25` }}
                          >
                            {moodInfo.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-text-secondary text-xs capitalize">{formatDate(entry.date)}</p>
                              <button
                                onClick={() => setConfirmDelete(entry.id)}
                                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <Trash size={12} className="text-text-muted hover:text-[#C43C3C] transition-colors" />
                              </button>
                            </div>
                            <p className={`text-text-primary text-sm mt-1 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                              {entry.content}
                            </p>
                            {entry.content.length > 200 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className="flex items-center gap-1 text-text-muted text-[10px] mt-1.5 hover:text-text-secondary transition-colors"
                              >
                                <CaretDown size={10} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                {isExpanded ? 'Réduire' : 'Lire la suite'}
                              </button>
                            )}
                            <p className="text-text-muted text-[10px] mt-1 flex items-center gap-1">
                              <TextT size={10} /> {wc} mot{wc !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">
            <NotePencil size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Commence ton journal</p>
            <p className="text-xs mt-1">Ecris ta première entrée pour créer un souvenir</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer l'entrée"
        message="Veux-tu vraiment supprimer cette entrée du journal ?"
        onConfirm={() => { if (confirmDelete) { deleteEntry(confirmDelete); setConfirmDelete(null); showToast('Entrée supprimée', 'info'); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </PageWrapper>
  );
}
