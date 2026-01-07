'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface TabItem {
    label: string;
    href: string;
}

interface PageTabsProps {
    tabs: TabItem[];
}

export function PageTabs({ tabs }: PageTabsProps) {
    const pathname = usePathname();

    return (
        <div className="flex items-center gap-1 p-1 bg-white/50 backdrop-blur-md rounded-xl border border-white/40 shadow-sm w-fit mb-6">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`relative px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
