import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: 'violet' | 'blue' | 'none';
  onClick?: () => void;
}

export function GlassCard({ children, className = '', tilt = true, glow = 'none', onClick }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const glowColors = {
    violet: 'rgba(105,11,120,0.2)',
    blue: 'rgba(38,84,124,0.2)',
    none: 'transparent',
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const isTouch = e.pointerType === 'touch';
    const rotX = isTouch ? ((y - centerY) / centerY) * -3 : ((y - centerY) / centerY) * -8;
    const rotY = isTouch ? ((x - centerX) / centerX) * 3 : ((x - centerX) / centerX) * 8;

    setTransform(`perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovered ? 1.02 : 1},${isHovered ? 1.02 : 1},1)`);
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handlePointerEnter = () => setIsHovered(true);
  const handlePointerLeave = () => {
    setIsHovered(false);
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
  };

  const glowStyle = glow !== 'none' && isHovered ? {
    background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColors[glow]}, transparent 60%)`,
  } : {};

  return (
    <motion.div
      ref={ref}
      className={`relative rounded-2xl border border-white/[0.06] overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(12px)',
        transform,
        transition: 'transform 0.15s ease-out',
        boxShadow: isHovered
          ? '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {glow !== 'none' && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ ...glowStyle, opacity: isHovered ? 1 : 0 }} />
      )}
      {children}
    </motion.div>
  );
}
