'use client';

import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

interface SuccessScreenProps {
    title: string;
    description?: string;
    onContinue?: () => void;
    continueText?: string;
    showConfetti?: boolean;
}

export default function SuccessScreen({
    title,
    description,
    onContinue,
    continueText = 'Continue',
    showConfetti = true,
}: SuccessScreenProps) {
    useEffect(() => {
        if (showConfetti) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b'],
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        }
    }, [showConfetti]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
            >
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                    <CheckCircle size={48} className="text-success" />
                </div>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-3"
            >
                {title}
            </motion.h2>

            {description && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 mb-8 max-w-md"
                >
                    {description}
                </motion.p>
            )}

            {onContinue && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={onContinue}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                    {continueText}
                </motion.button>
            )}
        </motion.div>
    );
}
