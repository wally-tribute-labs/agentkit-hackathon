'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  delay?: number;
}

export function StaggerContainer({ delay = 0, className = '', children, ...props }: StaggerContainerProps) {
  const variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
