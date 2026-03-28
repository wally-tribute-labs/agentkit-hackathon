'use client';

import { motion, useInView, type HTMLMotionProps } from 'framer-motion';
import { useRef } from 'react';
import { fadeUp } from '@/lib/motion';
import type { Variants } from 'framer-motion';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  variants?: Variants;
  delay?: number;
  once?: boolean;
}

export function ScrollReveal({
  variants = fadeUp,
  delay = 0,
  once = true,
  className = '',
  children,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
