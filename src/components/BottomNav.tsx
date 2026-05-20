import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  House, CheckSquare, CalendarBlank, Barbell, NotePencil
} from '@phosphor-icons/react';

export type Page = 'dashboard' | 'todo' | 'agenda' | 'sport' | 'journal';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Accueil', icon: House },
  { id: 'todo', label: 'Tâches', icon: CheckSquare },
  { id: 'agenda', label: 'Agenda', icon: CalendarBlank },
  { id: 'sport', label: 'Sport', icon: Barbell },
  { id: 'journal', label: 'Journal', icon: NotePencil },
];

interface BottomNavProps {
  active: Page;
  onChange: (page: Page) => void;
}

function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const ms = style === 'light' ? 5 : style === 'medium' ? 12 : 25;
    navigator.vibrate(ms);
  }
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillLeft, setPillLeft] = useState(0);

  const activeIndex = NAV_ITEMS.findIndex(n => n.id === active);

  const updatePill = useCallback(() => {
    const el = itemRefs.current[activeIndex];
    const nav = navRef.current;
    if (!el || !nav) return;
    const elRect = el.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    setPillLeft(elRect.left - navRect.left + elRect.width / 2 - 24);
  }, [activeIndex]);

  useEffect(() => { updatePill(); }, [updatePill]);
  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  const handleClick = (id: Page) => {
    if (id !== active) {
      haptic('light');
      onChange(id);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div
        ref={navRef}
        className="relative flex items-center gap-1 px-2 py-2 rounded-2xl mx-4 mb-2"
        style={{
          background: 'rgba(10,10,10,0.94)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 -2px 40px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Animated pill */}
        <motion.div
          className="absolute top-2 bottom-2 w-12 rounded-xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(105,11,120,0.55), rgba(38,84,124,0.55))',
            boxShadow: '0 0 20px rgba(105,11,120,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          animate={{ left: pillLeft }}
          transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
        />

        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              ref={el => { itemRefs.current[i] = el; }}
              onClick={() => handleClick(item.id)}
              className="relative z-10 flex flex-col items-center justify-center w-12 h-12 gap-0.5"
              aria-label={item.label}
            >
              <motion.div
                animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#505050]'}`}
                />
              </motion.div>
              <motion.span
                className="text-[9px] font-medium leading-none"
                animate={{ opacity: isActive ? 1 : 0.5, y: isActive ? 0 : 1 }}
                transition={{ duration: 0.15 }}
                style={{ color: isActive ? '#F0F0F0' : '#505050' }}
              >
                {item.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
