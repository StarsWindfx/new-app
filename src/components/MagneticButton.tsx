import { CSSProperties, useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  strength?: number;
}

export function MagneticButton({ children, className = '', style, onClick, type = 'button', disabled, strength = 0.35 }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setPos({ x, y });
  };

  const handleMouseLeave = () => setPos({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      className={className}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
