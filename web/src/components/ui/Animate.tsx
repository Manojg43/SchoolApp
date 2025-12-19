'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimateProps {
    children: ReactNode;
    animation?: 'fade' | 'slideUp' | 'scale' | 'none';
    duration?: number;
    delay?: number;
    className?: string;
}

const variants = {
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
    },
    scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
    none: {
        initial: {},
        animate: {},
        exit: {},
    },
};

export default function Animate({
    children,
    animation = 'fade',
    duration = 0.3,
    delay = 0,
    className = '',
}: AnimateProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants[animation]}
            transition={{ duration, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const AnimatePage = ({ children }: { children: ReactNode }) => (
    <Animate animation="fade" duration={0.4}>
        {children}
    </Animate>
);
