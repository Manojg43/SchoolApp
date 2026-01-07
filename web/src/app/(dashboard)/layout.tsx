'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard, Users, BookOpen, Calculator, Bus, Award,
    Megaphone, Settings, LogOut, Menu, Bell, Search, GraduationCap,
    CalendarCheck, FileText, IndianRupee, Gift, TrendingUp, Clock, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Menu item types
interface SubMenuItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface MenuItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    submenu?: SubMenuItem[];
}

// Navigation with collapsible submenus
const MENU_ITEMS: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    {
        href: '/admissions',
        label: 'Admissions',
        icon: FileText,
        permission: 'can_access_student_records',
        submenu: [
            { href: '/admissions', label: 'All Enquiries', icon: FileText },
            { href: '/admissions/create', label: 'New Enquiry', icon: FileText },
            { href: '/admissions/workflow', label: 'Workflow Settings', icon: Settings },
        ]
    },
    { href: '/attendance', label: 'Attendance', icon: CalendarCheck, permission: 'can_access_attendance' },
    {
        href: '/finance',
        label: 'Finance',
        icon: Calculator,
        permission: 'can_access_finance',
        submenu: [
            { href: '/fees', label: 'Fees & Invoices', icon: Calculator },
            { href: '/finance/collect', label: 'Collect Fees', icon: IndianRupee },
            { href: '/finance/create', label: 'Create Invoice', icon: FileText },
            { href: '/finance/payroll', label: 'Payroll Dashboard', icon: IndianRupee },
            { href: '/finance/discounts', label: 'Discounts & Scholarships', icon: Gift },
            { href: '/finance/certificates-fees', label: 'Certificate Fees', icon: Award },
            { href: '/finance/settlement', label: 'Year-End Settlement', icon: TrendingUp },
        ]
    },
    {
        href: '/staff',
        label: 'Staff & Payroll',
        icon: Users,
        permission: 'is_superuser',
        submenu: [
            { href: '/staff', label: 'Staff Directory', icon: Users },
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
        icon: BookOpen,
        permission: 'can_access_student_records',
        submenu: [
            { href: '/academic/homework', label: 'Homework', icon: FileText },
        ]
    },
    {
        href: '/communication',
        label: 'Communication',
        icon: Megaphone,
        submenu: [
            { href: '/communication/notices', label: 'Notices', icon: FileText },
        ]
    },
    { href: '/certificates', label: 'Certificates', icon: Award, permission: 'can_access_finance' },
    {
        href: '/reports',
        label: 'Reports',
        icon: FileText,
        permission: 'is_superuser',
        submenu: [
            { href: '/reports', label: 'Reports Dashboard', icon: FileText },
            { href: '/reports/attendance', label: 'Attendance Reports', icon: CalendarCheck },
        ]
    },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    // Close profile dropdown when route changes
    useEffect(() => {
        setProfileOpen(false);
    }, [pathname]);

    // Auto-expand menu if user is on a subpage
    useEffect(() => {
        const expandedSections: string[] = [];
        MENU_ITEMS.forEach(item => {
            if (item.submenu?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
                expandedSections.push(item.href);
            }
        });
        if (expandedSections.length > 0) {
            setExpandedMenus(prev => {
                const newExpanded = [...prev];
                expandedSections.forEach(section => {
                    if (!newExpanded.includes(section)) {
                        newExpanded.push(section);
                    }
                });
                return newExpanded;
            });
        }
    }, [pathname]);

    // Toggle menu expand/collapse
    const toggleMenu = (href: string) => {
        setExpandedMenus(prev =>
            prev.includes(href)
                ? prev.filter(h => h !== href)
                : [...prev, href]
        );
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 glass shadow-2xl transition-all duration-300 ease-in-out
                    border-r border-border-glass
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    lg:relative lg:translate-x-0
                `}
            >
                {/* Brand */}
                <div className="h-20 flex items-center px-6 border-b border-border/50 bg-surface/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-primary group cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-2.5 rounded-xl shadow-lg shadow-primary/30 transform group-hover:scale-105 transition-transform duration-300">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-text-main leading-tight">School<span className="text-primary">App</span></span>
                            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Admin Panel</span>
                        </div>
                    </div>
                </div>

                {/* Navigation with Flat Structure (Tabs moved to Pages) */}
                <nav className="p-3 space-y-2 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        // Permission Check
                        if (item.permission && !hasPermission(item.permission)) {
                            return null;
                        }

                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 translate-x-1'
                                        : 'text-text-secondary hover:bg-white/60 hover:text-primary hover:shadow-sm hover:translate-x-1'
                                    }
                                `}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-20" />
                                )}
                                <Icon className={`mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-primary'}`} />
                                <span className="relative z-10">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Header */}
                <header className="h-20 glass border-b border-border-glass flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 text-text-secondary hover:bg-background rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Search Bar (Visual Only) */}
                        <div className="hidden md:flex items-center bg-background/50 hover:bg-background px-4 py-2.5 rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all w-64 group">
                            <Search className="w-4 h-4 text-text-muted mr-2 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-text-muted"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white animate-pulse"></span>
                        </button>

                        <div className="h-8 w-[1px] bg-border mx-2"></div>

                        {/* User Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 hover:bg-background p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-border"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                                    {user?.first_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-text-main leading-tight">{user?.first_name || 'Admin'}</p>
                                    <p className="text-xs text-text-muted">View Profile</p>
                                </div>
                            </button>

                            {/* Backdrop for Click Outside */}
                            {isProfileOpen && (
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setProfileOpen(false)}></div>
                            )}

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-56 bg-surface/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-2 z-50 origin-top-right glass-card"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="px-3 py-2 border-b border-border/50 mb-2">
                                            <p className="font-semibold text-text-main">{user?.first_name} {user?.last_name}</p>
                                            <p className="text-xs text-text-muted font-medium mb-1 truncate">{user?.email}</p>
                                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                                                {typeof window !== 'undefined' ? (localStorage.getItem('school_name') || 'Sunshine High School') : 'Sunshine High School'}
                                            </div>
                                        </div>
                                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-background/80 hover:text-primary rounded-xl transition-colors">
                                            <Settings className="w-4 h-4" /> Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-error hover:bg-error/5 rounded-xl transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
                    <div className="animate-fade-in mx-auto max-w-[1600px] pb-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
