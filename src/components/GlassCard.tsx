'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { spring, cardHover, cardTap } from '@/lib/motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean;
  glowColor?: 'cyan' | 'amber' | 'green' | 'none';
  padding?: string;
}

const GLOW_SHADOWS: Record<string, string> = {
  cyan:  'var(--shadow-glow-cyan)',
  amber: 'var(--shadow-glow-amber)',
  green: 'var(--shadow-glow-green)',
  none:  'none',
};

export function GlassCard({
  interactive = true,
  glowColor = 'none',
  padding = 'p-5',
  className = '',
  children,
  ...props
}: GlassCardProps) {
  const hoverStyles = interactive
    ? {
        scale: cardHover.scale,
        y: cardHover.y,
        boxShadow: glowColor !== 'none' ? GLOW_SHADOWS[glowColor] : 'var(--shadow-md)',
      }
    : {};

  return (
    <motion.div
      className={`glass ${padding} ${className}`}
      whileHover={interactive ? hoverStyles : undefined}
      whileTap={interactive ? cardTap : undefined}
      transition={spring}
      {...props}
    >
      {children}
    </motion.div>
  );
}
