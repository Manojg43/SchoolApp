'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Receipt,
    Bus,
    FileBarChart,
    Settings,
    Briefcase,
    GraduationCap
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext'; // Import Auth
import { motion } from 'framer-motion';

const MENU_ITEMS = [
    { href: '/', label: 'Overview', icon: LayoutDashboard }, // Public / Basic
    { href: '/students', label: 'Students', icon: GraduationCap, permission: 'can_access_student_records' },
    { href: '/attendance', label: 'Attendance', icon: CalendarCheck, permission: 'can_access_attendance' },
    { href: '/fees', label: 'Fees & Invoices', icon: Receipt, permission: 'can_access_finance' },
    { href: '/staff', label: 'Staff & Payroll', icon: Briefcase, permission: 'is_superuser' }, // Placeholder perm
    { href: '/transport', label: 'Transport', icon: Bus, permission: 'can_access_transport' },
    { href: '/reports', label: 'Reports', icon: FileBarChart, permission: 'is_superuser' },
    { href: '/settings', label: 'Settings', icon: Settings }, // Settings usually for all, can filter sub-pages
];

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { hasPermission } = useAuth(); // Use Auth Hook

    return (
        <aside className="w-64 bg-white border-r h-screen sticky top-0 flex-col hidden md:flex">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-blue-600 tracking-tight">SchoolSaaS</h1>
                <p className="text-xs text-gray-500 mt-1">Multi-School ERP</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map((item) => {
                    // Permission Check
                    if (item.permission && !hasPermission(item.permission)) {
                        return null;
                    }

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative",
                                isActive
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-sidebar"
                                    className="absolute left-0 w-1 h-2/3 bg-blue-600 rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                            <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t text-xs text-gray-400 text-center">
                © 2024 SchoolSaaS
            </div>
        </aside>
    );
}
