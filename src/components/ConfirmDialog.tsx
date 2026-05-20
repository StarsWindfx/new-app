import { motion, AnimatePresence } from 'framer-motion';
import { Warning } from '@phosphor-icons/react';
import { MagneticButton } from './MagneticButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Supprimer', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          onClick={onCancel}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,20,0.98), rgba(13,13,13,0.98))',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(196,60,60,0.15)]">
                <Warning size={20} weight="fill" className="text-[#C43C3C]" />
              </div>
              <h3 className="text-text-primary font-semibold text-base">{title}</h3>
            </div>
            <p className="text-text-secondary text-sm mb-5 leading-relaxed">{message}</p>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-text-secondary text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <MagneticButton
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #C43C3C, #8B1A1A)' }}
              >
                {confirmLabel}
              </MagneticButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
