import type { Transition, Variants } from 'framer-motion';

// ─── Transition presets ────────────────────────────────────────────────────
export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const springFast: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 30,
};

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 18,
};

export const easeOut: Transition = {
  duration: 0.28,
  ease: [0.0, 0.0, 0.2, 1.0],
};

export const easeOutSlow: Transition = {
  duration: 0.5,
  ease: [0.0, 0.0, 0.2, 1.0],
};

// ─── Stagger ───────────────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring,
  },
};

// ─── Page/section reveals ──────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: easeOutSlow,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: easeOut,
  },
};

// ─── Interactive element variants ─────────────────────────────────────────
export const buttonTap = { scale: 0.97 };
export const buttonHover = { scale: 1.02 };
export const cardHover = { scale: 1.01, y: -2 };
export const cardTap = { scale: 0.99 };

// ─── Page transition ──────────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { ...easeOutSlow, duration: 0.4 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' } },
};
