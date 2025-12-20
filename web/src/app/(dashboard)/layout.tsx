'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard, Users, BookOpen, Calculator, Bus, Award,
    Megaphone, Settings, LogOut, Menu, Bell, Search, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isProfileOpen, setProfileOpen] = useState(false);
    const router = useRouter();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Students', href: '/students', icon: GraduationCap },
        { name: 'Staff', href: '/staff', icon: Users },
        { name: 'Academic', href: '/academic/homework', icon: BookOpen },
        { name: 'Finance', href: '/finance', icon: Calculator },
        { name: 'Transport', href: '/transport', icon: Bus },
        { name: 'Communication', href: '/communication/notices', icon: Megaphone },
        { name: 'Reports', href: '/reports', icon: Award },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-2xl transition-all duration-300 ease-in-out
                    border-r border-border
                    bg-gradient-to-b from-surface via-surface to-slate-50
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    lg:relative lg:translate-x-0
                `}
            >
                {/* Brand */}
                <div className="h-20 flex items-center px-8 border-b border-border/50 bg-surface/50 backdrop-blur-sm">
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

                {/* Navigation */}
                <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 translate-x-1'
                                        : 'text-text-secondary hover:bg-white hover:text-primary hover:pl-5 hover:shadow-sm'
                                    }
                                `}
                            >
                                <item.icon className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-primary'}`} />
                                <span className="relative z-10">{item.name}</span>
                                {!isActive && <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Header */}
                <header className="h-20 bg-surface/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-40">
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

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-56 bg-surface/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-2 z-50 origin-top-right glass-card"
                                    >
                                        <div className="px-3 py-2 border-b border-border/50 mb-2">
                                            <p className="font-semibold text-text-main">{user?.first_name} {user?.last_name}</p>
                                            <p className="text-xs text-text-muted truncate">{user?.email}</p>
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
