'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface Action {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
}

interface FABProps {
    mainAction?: () => void; // If simple button
    actions?: Action[]; // If speed dial
    icon?: React.ReactNode;
}

export default function FAB({ mainAction, actions, icon }: FABProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleMainClick = () => {
        if (actions) {
            toggleOpen();
        } else if (mainAction) {
            mainAction();
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && actions && (
                    <div className="flex flex-col items-end gap-3 mb-2">
                        {actions.map((action, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className="bg-surface text-text-main px-3 py-1 rounded-lg shadow-md text-sm font-medium border border-border">
                                    {action.label}
                                </span>
                                <button
                                    onClick={() => {
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                    className={`p-3 rounded-full shadow-lg text-white hover:brightness-110 transition-transform hover:scale-105 active:scale-95 ${action.color || 'bg-secondary'}`}
                                >
                                    {action.icon}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleMainClick}
                animate={{ rotate: isOpen ? 45 : 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-full bg-primary text-white shadow-xl hover:shadow-2xl transition-shadow"
            >
                {icon || <Plus size={24} />}
            </motion.button>
        </div>
    );
}
