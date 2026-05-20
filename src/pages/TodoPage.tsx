import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Plus, Trash, CheckCircle, Circle, FunnelSimple, PencilSimple, X } from '@phosphor-icons/react';
import { GlassCard } from '../components/GlassCard';
import { MagneticButton } from '../components/MagneticButton';
import { PageWrapper } from '../components/PageWrapper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { Todo, Priority } from '../types';

interface TodoPageProps {
  todos: Todo[];
  addTodo: (title: string, priority: Priority, category: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
}

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'high', label: 'Haute', color: '#C43C3C', bg: 'rgba(196,60,60,0.15)' },
  { value: 'medium', label: 'Moyenne', color: '#C49428', bg: 'rgba(196,148,40,0.15)' },
  { value: 'low', label: 'Basse', color: '#22A55E', bg: 'rgba(34,165,94,0.15)' },
];

const FILTERS = ['Toutes', 'En attente', 'Terminées', 'Haute', 'Moyenne', 'Basse'] as const;
type Filter = typeof FILTERS[number];

function TodoItem({ todo, onToggle, onDelete, onUpdate }: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Todo>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority);
  const [editCategory, setEditCategory] = useState(todo.category);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const x = useMotionValue(0);
  const checkOpacity = useTransform(x, [-80, -20], [1, 0]);
  const checkScale = useTransform(x, [-80, -20], [1, 0.8]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -60) onToggle();
  };

  const p = PRIORITIES.find(x => x.value === todo.priority)!;

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate({ title: editTitle.trim(), priority: editPriority, category: editCategory.trim() });
    setEditing(false);
    showToast('Tâche modifiée');
  };

  return (
    <>
      <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95, height: 0 }} transition={{ duration: 0.2 }}>
        <GlassCard className="overflow-hidden p-0">
          <motion.div
            className="relative"
            drag="x"
            dragConstraints={{ left: -80, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ x }}
          >
            {/* Swipe action bg */}
            <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center rounded-l-2xl" style={{ background: 'rgba(105,11,120,0.2)' }}>
              <motion.div style={{ opacity: checkOpacity, scale: checkScale }}>
                <CheckCircle size={22} weight="fill" className="text-violet-light" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative bg-surface/80 rounded-2xl p-4">
              {editing ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-violet-light transition-colors"
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  />
                  <div className="flex gap-1.5">
                    {PRIORITIES.map(pr => (
                      <button
                        key={pr.value}
                        type="button"
                        onClick={() => setEditPriority(pr.value)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
                        style={{
                          background: editPriority === pr.value ? pr.bg : 'transparent',
                          borderColor: editPriority === pr.value ? pr.color : 'rgba(255,255,255,0.08)',
                          color: editPriority === pr.value ? pr.color : '#606060',
                        }}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    placeholder="Catégorie"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary placeholder-text-muted text-xs focus:outline-none focus:border-violet-light transition-colors"
                  />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditing(false)} className="flex-1 py-1.5 rounded-lg text-text-muted text-xs border border-white/10 hover:bg-white/5 transition-colors">
                      Annuler
                    </button>
                    <button onClick={handleSaveEdit} className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: 'linear-gradient(135deg, #690B78, #26547C)' }}>
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={onToggle} className="flex-shrink-0">
                    {todo.completed ? (
                      <CheckCircle size={22} weight="fill" className="text-violet-light" />
                    ) : (
                      <Circle size={22} className="text-text-muted hover:text-text-secondary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-all ${todo.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {todo.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color }}>
                        {p.label}
                      </span>
                      {todo.category && (
                        <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{todo.category}</span>
                      )}
                    </div>
                  </div>
                  {!todo.completed && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <PencilSimple size={14} className="text-text-muted" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Trash size={14} className="text-text-muted hover:text-[#C43C3C] transition-colors" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer la tâche"
        message={`Veux-tu vraiment supprimer "${todo.title}" ?`}
        onConfirm={() => { onDelete(); setConfirmDelete(false); showToast('Tâche supprimée', 'info'); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export function TodoPage({ todos, addTodo, toggleTodo, deleteTodo, updateTodo }: TodoPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState<Filter>('Toutes');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTodo(title.trim(), priority, category.trim());
    showToast('Tâche ajoutée');
    setTitle(''); setPriority('medium'); setCategory('');
    setShowForm(false);
  };

  const filtered = todos.filter(t => {
    if (filter === 'En attente') return !t.completed;
    if (filter === 'Terminées') return t.completed;
    if (filter === 'Haute') return t.priority === 'high';
    if (filter === 'Moyenne') return t.priority === 'medium';
    if (filter === 'Basse') return t.priority === 'low';
    return true;
  });

  const completed = todos.filter(t => t.completed).length;
  const progress = todos.length > 0 ? (completed / todos.length) * 100 : 0;

  return (
    <PageWrapper>
      <div className="px-4 pt-14 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Tâches</h1>
            <p className="text-text-muted text-sm mt-0.5">{completed}/{todos.length} terminées</p>
          </div>
          <div className="flex gap-2">
            <MagneticButton
              onClick={() => setShowFilters(!showFilters)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: showFilters ? 'rgba(105,11,120,0.3)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <FunnelSimple size={18} weight={showFilters ? 'fill' : 'regular'} className="text-text-secondary" />
            </MagneticButton>
            <MagneticButton
              onClick={() => setShowForm(!showForm)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #690B78, #26547C)', boxShadow: '0 4px 16px rgba(105,11,120,0.4)' }}
            >
              <motion.div animate={{ rotate: showForm ? 45 : 0 }} transition={{ duration: 0.2 }}>
                {showForm ? <X size={20} weight="bold" className="text-white" /> : <Plus size={20} weight="bold" className="text-white" />}
              </motion.div>
            </MagneticButton>
          </div>
        </div>

        {/* Progress bar */}
        {todos.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-text-muted text-[10px]">Progression</span>
              <span className="text-text-muted text-[10px] font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #690B78, #26547C)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex flex-wrap gap-2 py-2">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      filter === f ? 'text-white' : 'text-text-muted border border-white/10 hover:border-white/20'
                    }`}
                    style={filter === f ? { background: 'linear-gradient(135deg, rgba(105,11,120,0.6), rgba(38,84,124,0.6))' } : {}}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre de la tâche…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-violet-light transition-colors"
                  />
                  <input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Catégorie (optionnel)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-violet-light transition-colors"
                  />
                  <div className="flex gap-2">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
                        style={{
                          background: priority === p.value ? p.bg : 'transparent',
                          borderColor: priority === p.value ? p.color : 'rgba(255,255,255,0.1)',
                          color: priority === p.value ? p.color : '#606060',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <MagneticButton
                    type="submit"
                    disabled={!title.trim()}
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

        {/* Todo list */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-text-muted text-sm"
              >
                <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune tâche ici</p>
                <p className="text-xs mt-1">Glisse à gauche pour terminer une tâche</p>
              </motion.div>
            ) : (
              filtered.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => { toggleTodo(todo.id); showToast(todo.completed ? 'Tâche rétablie' : 'Tâche terminée'); }}
                  onDelete={() => deleteTodo(todo.id)}
                  onUpdate={(updates) => updateTodo(todo.id, updates)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
