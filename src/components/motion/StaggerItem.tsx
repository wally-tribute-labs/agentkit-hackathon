'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { staggerItem } from '@/lib/motion';

type StaggerItemProps = HTMLMotionProps<'div'>;

export function StaggerItem({ className = '', children, ...props }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  );
}
