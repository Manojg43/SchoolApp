'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file or will create one. If not, I'll allow standard class strings.

// Simple utility if @/lib/utils doesn't exist yet
function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface CarouselProps {
    items: {
        id: number;
        image_url: string;
        title: string;
        description: string;
    }[];
    autoPlay?: boolean;
    interval?: number;
}

export function Carousel({ items, autoPlay = true, interval = 5000 }: CarouselProps) {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        if (!autoPlay) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, items.length]);

    const next = () => setIndex((prev) => (prev + 1) % items.length);
    const prev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

    if (!items.length) return null;

    return (
        <div className="relative w-full h-[400px] overflow-hidden rounded-xl shadow-2xl group">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    <img
                        src={items[index].image_url}
                        alt={items[index].title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 text-white max-w-2xl">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold mb-2"
                        >
                            {items[index].title}
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg text-gray-200"
                        >
                            {items[index].description}
                        </motion.p>
                    </div>
                </motion.div>
            </AnimatePresence>

            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-4 right-4 flex gap-2">
                {items.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={classNames(
                            "w-2 h-2 rounded-full transition-all",
                            i === index ? "bg-white w-6" : "bg-white/50"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
