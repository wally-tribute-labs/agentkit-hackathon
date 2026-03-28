'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';

interface AnimatedCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}

export function AnimatedCounter({
  target,
  prefix = '',
  suffix = '',
  duration = 1200,
  decimals = 0,
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const rafRef  = useRef<number | null>(null);
  const startTs = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    startTs.current = null;

    function tick(ts: number) {
      if (!startTs.current) startTs.current = ts;
      const elapsed  = ts - startTs.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(parseFloat((eased * target).toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);

  return (
    <motion.span
      className="font-mono tabular-nums"
      variants={fadeIn}
      initial="hidden"
      animate="show"
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  );
}
