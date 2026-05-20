import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Warning, Info } from '@phosphor-icons/react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: ToastType = 'success') {
  const toast: Toast = { id: nextId++, message, type };
  listeners.forEach(fn => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev.slice(-4), toast]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
      timersRef.current.delete(toast.id);
    }, 3000);
    timersRef.current.set(toast.id, timer);
  }, []);

  useState(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  });

  const icons = {
    success: <CheckCircle size={18} weight="fill" className="text-[#22A55E]" />,
    error: <Warning size={18} weight="fill" className="text-[#C43C3C]" />,
    info: <Info size={18} weight="fill" className="text-[#3A7AB5]" />,
  };

  const bgColors = {
    success: 'rgba(34,165,94,0.12)',
    error: 'rgba(196,60,60,0.12)',
    info: 'rgba(58,122,181,0.12)',
  };

  const borderColors = {
    success: 'rgba(34,165,94,0.25)',
    error: 'rgba(196,60,60,0.25)',
    info: 'rgba(58,122,181,0.25)',
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-xl max-w-sm w-full"
            style={{
              background: bgColors[toast.type],
              border: `1px solid ${borderColors[toast.type]}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {icons[toast.type]}
            <span className="text-text-primary text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
