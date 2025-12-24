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
    GraduationCap,
    Clock,
    FileText,
    ChevronDown,
    TrendingUp,
    Gift,
    Award,
    DollarSign
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext'; // Import Auth
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

// TypeScript interfaces for menu items
interface SubMenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
    permission?: string;
    submenu?: SubMenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    {
        href: '/students',
        label: 'Students',
        icon: GraduationCap,
        permission: 'can_access_student_records',
        submenu: [
            { href: '/students', label: 'Student Directory', icon: GraduationCap },
            { href: '/students/attendance', label: 'Mark Attendance', icon: CalendarCheck },
        ]
    },
    { href: '/attendance', label: 'Attendance', icon: CalendarCheck, permission: 'can_access_attendance' },
    {
        href: '/fees',
        label: 'Finance',
        icon: Receipt,
        permission: 'can_access_finance',
        submenu: [
            { href: '/fees', label: 'Fees & Invoices', icon: Receipt },
            { href: '/finance/create', label: 'Create Invoice', icon: FileText },
            { href: '/finance/payroll', label: 'Payroll Dashboard', icon: DollarSign },
            { href: '/finance/discounts', label: 'Discounts & Scholarships', icon: Gift },
            { href: '/finance/certificates-fees', label: 'Certificate Fees', icon: Award },
            { href: '/finance/settlement', label: 'Year-End Settlement', icon: TrendingUp },
        ]
    },
    {
        href: '/staff',
        label: 'Staff & Payroll',
        icon: Briefcase,
        permission: 'is_superuser',
        submenu: [
            { href: '/staff', label: 'Staff Directory', icon: Briefcase },
            { href: '/staff/attendance', label: 'Staff Attendance', icon: Clock },
            { href: '/staff/leaves', label: 'Leave Applications', icon: FileText },
        ]
    },
    {
        href: '/transport',
        label: 'Transport',
        icon: Bus,
        permission: 'can_access_transport',
        submenu: [
            { href: '/transport', label: 'Vehicle List', icon: Bus },
            { href: '/transport/create', label: 'Add Vehicle', icon: FileText },
        ]
    },
    {
        href: '/academic',
        label: 'Academic',
        icon: GraduationCap,
        permission: 'can_access_student_records',
        submenu: [
            { href: '/academic/homework', label: 'Homework', icon: FileText },
        ]
    },
    {
        href: '/communication',
        label: 'Communication',
        icon: FileText,
        submenu: [
            { href: '/communication/notices', label: 'Notices', icon: FileText },
        ]
    },
    { href: '/certificates', label: 'Certificates', icon: Award, permission: 'can_access_finance' },
    {
        href: '/reports',
        label: 'Reports',
        icon: FileBarChart,
        permission: 'is_superuser',
        submenu: [
            { href: '/reports', label: 'Reports Dashboard', icon: FileBarChart },
            { href: '/reports/attendance', label: 'Attendance Reports', icon: CalendarCheck },
        ]
    },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { hasPermission } = useAuth(); // Use Auth Hook
    // Expand all menu sections by default so sub-pages are visible
    const [expandedMenus, setExpandedMenus] = useState<string[]>([
        '/students',
        '/fees',
        '/staff',
        '/transport',
        '/academic',
        '/communication',
        '/reports'
    ]);

    const toggleMenu = (href: string) => {
        setExpandedMenus(prev =>
            prev.includes(href)
                ? prev.filter(h => h !== href)
                : [...prev, href]
        );
    };

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

                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = expandedMenus.includes(item.href);
                    const isActive = pathname === item.href || (hasSubmenu && item.submenu?.some(sub => pathname === sub.href));
                    const Icon = item.icon;

                    return (
                        <div key={item.href}>
                            {/* Main Menu Item */}
                            {hasSubmenu ? (
                                <button
                                    onClick={() => toggleMenu(item.href)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative w-full",
                                        isActive
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    <ChevronDown
                                        className={cn(
                                            "w-4 h-4 transition-transform",
                                            isExpanded ? "rotate-180" : ""
                                        )}
                                    />
                                </button>
                            ) : (
                                <Link
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
                            )}

                            {/* Submenu */}
                            {hasSubmenu && isExpanded && (
                                <div className="ml-4 mt-1 space-y-1">
                                    {item.submenu?.map((subItem) => {
                                        const isSubActive = pathname === subItem.href;
                                        const SubIcon = subItem.icon;

                                        return (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors relative",
                                                    isSubActive
                                                        ? "text-blue-600 bg-blue-50 font-medium"
                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                )}
                                            >
                                                {isSubActive && (
                                                    <motion.div
                                                        layoutId="active-sidebar"
                                                        className="absolute left-0 w-1 h-2/3 bg-blue-600 rounded-r-full"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                    />
                                                )}
                                                <SubIcon className={cn("w-4 h-4", isSubActive ? "text-blue-600" : "text-gray-400")} />
                                                {subItem.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t text-xs text-gray-400 text-center">
                © 2024 SchoolSaaS
            </div>
        </aside>
    );
}
